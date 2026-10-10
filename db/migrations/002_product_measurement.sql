ALTER TABLE release_engineer.accounts ADD COLUMN IF NOT EXISTS is_operator boolean NOT NULL DEFAULT false;
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS release_engineer.inference_days (
  scope text NOT NULL, utc_day date NOT NULL, PRIMARY KEY(scope, utc_day)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS release_engineer.inference_usage (
  id uuid PRIMARY KEY,
  scope text NOT NULL,
  utc_day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id text REFERENCES release_engineer.accounts ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved','succeeded','failed')),
  model text NOT NULL,
  product_commit text,
  cost_micros bigint NOT NULL CHECK(cost_micros >= 0),
  cost_known boolean NOT NULL DEFAULT false,
  input_tokens bigint, output_tokens bigint, cache_write_tokens bigint, cache_read_tokens bigint,
  duration_ms integer,
  partial_context boolean NOT NULL DEFAULT false,
  usefulness text CHECK(usefulness IN ('useful','mixed','not_useful')),
  action text CHECK(action IN ('checked_evidence','changed_code','added_or_changed_tests','requested_human_review','none_recorded'))
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS inference_usage_scope_day ON release_engineer.inference_usage(scope,utc_day);
-- statement-breakpoint
CREATE OR REPLACE FUNCTION release_engineer.reserve_inference(p_id uuid, p_scope text, p_user text, p_model text, p_commit text, p_reserve bigint, p_limit bigint)
RETURNS boolean LANGUAGE plpgsql SET search_path = release_engineer, pg_temp AS $$
DECLARE day date := (now() AT TIME ZONE 'UTC')::date; spent bigint;
BEGIN
  INSERT INTO inference_days(scope,utc_day) VALUES(p_scope,day) ON CONFLICT DO NOTHING;
  PERFORM scope FROM inference_days WHERE scope=p_scope AND utc_day=day FOR UPDATE;
  SELECT coalesce(sum(cost_micros),0) INTO spent FROM inference_usage WHERE scope=p_scope AND utc_day=day;
  IF p_reserve < 1 OR p_limit < 1 OR spent + p_reserve > p_limit THEN RETURN false; END IF;
  INSERT INTO inference_usage(id,scope,user_id,model,product_commit,cost_micros) VALUES(p_id,p_scope,p_user,p_model,p_commit,p_reserve);
  DELETE FROM inference_usage WHERE scope=p_scope AND created_at < now()-interval '90 days';
  DELETE FROM inference_days WHERE scope=p_scope AND utc_day < day-90;
  RETURN true;
END;
$$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION release_engineer.account_usage(p_user text, p_live_price text)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = release_engineer, pg_temp AS $$
  WITH entitlement AS (
    SELECT EXISTS (SELECT 1 FROM subscriptions WHERE user_id=p_user AND environment='live'
      AND status='active' AND price_id=p_live_price AND valid_until > now()) AS pro
  ), counts AS (
    SELECT count(*) FILTER (WHERE status='completed' AND utc_day=(now() AT TIME ZONE 'UTC')::date)::int AS used,
      count(*) FILTER (WHERE status='pending' AND expires_at>now())::int AS pending,
      count(*) FILTER (WHERE status='completed' AND utc_day >= date_trunc('month',now() AT TIME ZONE 'UTC')::date)::int AS month_used
    FROM reviews WHERE user_id=p_user
  )
  SELECT jsonb_build_object('plan',CASE WHEN pro THEN 'pro' ELSE 'free' END,
    'limit',CASE WHEN pro THEN 100 ELSE 10 END,'used',used,'pending',pending,
    'remaining',greatest(0,CASE WHEN pro THEN least(100-used-pending,100-month_used-pending) ELSE least(10-used-pending,30-month_used-pending) END),
    'resetsAt',(((now() AT TIME ZONE 'UTC')::date+1)::timestamp AT TIME ZONE 'UTC'),
    'monthly',jsonb_build_object('limit',CASE WHEN pro THEN 100 ELSE 30 END,'used',month_used,'remaining',greatest(0,(CASE WHEN pro THEN 100 ELSE 30 END)-month_used-pending),
      'resetsAt',((date_trunc('month',now() AT TIME ZONE 'UTC')+interval '1 month') AT TIME ZONE 'UTC')))
  FROM entitlement,counts;
$$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION release_engineer.reserve_review(p_user text,p_id uuid,p_live_price text)
RETURNS jsonb LANGUAGE plpgsql SET search_path = release_engineer, pg_temp AS $$
DECLARE usage jsonb;
BEGIN
  INSERT INTO accounts(user_id) VALUES(p_user) ON CONFLICT DO NOTHING;
  PERFORM user_id FROM accounts WHERE user_id=p_user FOR UPDATE;
  DELETE FROM reviews WHERE user_id=p_user AND utc_day < (now() AT TIME ZONE 'UTC')::date-31;
  usage := account_usage(p_user,p_live_price);
  IF (usage->>'pending')::int > 0 THEN RETURN usage || '{"error":"ACCOUNT_BUSY"}'::jsonb; END IF;
  IF usage->'monthly' IS NOT NULL AND (usage->'monthly'->>'remaining')::int=0 THEN RETURN usage || '{"error":"MONTHLY_LIMIT"}'::jsonb; END IF;
  IF (usage->>'remaining')::int=0 THEN RETURN usage || '{"error":"DAILY_LIMIT"}'::jsonb; END IF;
  INSERT INTO reviews(id,user_id,status) VALUES(p_id,p_user,'pending');
  RETURN usage || jsonb_build_object('reservation',p_id);
END;
$$;
