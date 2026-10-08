CREATE SCHEMA IF NOT EXISTS release_engineer;
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS release_engineer.accounts (
  user_id text PRIMARY KEY CHECK (length(user_id) BETWEEN 1 AND 128),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
ALTER TABLE release_engineer.accounts ADD COLUMN IF NOT EXISTS checkout_lock_id uuid;
-- statement-breakpoint
ALTER TABLE release_engineer.accounts ADD COLUMN IF NOT EXISTS checkout_lock_until timestamptz;
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS release_engineer.checkouts (
  transaction_id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES release_engineer.accounts ON DELETE CASCADE,
  environment text NOT NULL CHECK (environment IN ('sandbox', 'live')),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS release_engineer.subscriptions (
  subscription_id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES release_engineer.accounts ON DELETE CASCADE,
  customer_id text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('sandbox', 'live')),
  status text NOT NULL,
  price_id text NOT NULL,
  valid_until timestamptz,
  provider_updated_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS release_engineer.reviews (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES release_engineer.accounts ON DELETE CASCADE,
  utc_day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'released')),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '3 minutes'
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS reviews_user_day ON release_engineer.reviews(user_id, utc_day);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS subscriptions_user ON release_engineer.subscriptions(user_id);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS release_engineer.webhook_events (
  event_id text PRIMARY KEY,
  environment text NOT NULL CHECK (environment IN ('sandbox', 'live')),
  processed_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE OR REPLACE FUNCTION release_engineer.account_usage(p_user text, p_live_price text)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = release_engineer, pg_temp AS $$
  WITH entitlement AS (
    SELECT EXISTS (
      SELECT 1 FROM subscriptions WHERE user_id = p_user AND environment = 'live'
        AND status = 'active' AND price_id = p_live_price AND valid_until > now()
    ) AS pro
  ), counts AS (
    SELECT count(*) FILTER (WHERE status = 'completed' AND utc_day = (now() AT TIME ZONE 'UTC')::date)::int AS used,
      count(*) FILTER (WHERE status = 'pending' AND expires_at > now())::int AS pending
    FROM reviews WHERE user_id = p_user
  )
  SELECT jsonb_build_object('plan', CASE WHEN pro THEN 'pro' ELSE 'free' END,
    'limit', CASE WHEN pro THEN 100 ELSE 10 END, 'used', used, 'pending', pending,
    'remaining', greatest(0, (CASE WHEN pro THEN 100 ELSE 10 END) - used - pending),
    'resetsAt', (((now() AT TIME ZONE 'UTC')::date + 1)::timestamp AT TIME ZONE 'UTC'))
  FROM entitlement, counts;
$$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION release_engineer.reserve_review(p_user text, p_id uuid, p_live_price text)
RETURNS jsonb LANGUAGE plpgsql SET search_path = release_engineer, pg_temp AS $$
DECLARE usage jsonb;
BEGIN
  INSERT INTO accounts(user_id) VALUES (p_user) ON CONFLICT DO NOTHING;
  -- All concurrent requests for this account serialize here, across instances.
  PERFORM user_id FROM accounts WHERE user_id = p_user FOR UPDATE;
  DELETE FROM reviews WHERE user_id = p_user AND utc_day < (now() AT TIME ZONE 'UTC')::date - 31;
  usage := account_usage(p_user, p_live_price);
  IF (usage->>'pending')::int > 0 THEN RETURN usage || '{"error":"ACCOUNT_BUSY"}'::jsonb; END IF;
  IF (usage->>'remaining')::int = 0 THEN RETURN usage || '{"error":"DAILY_LIMIT"}'::jsonb; END IF;
  INSERT INTO reviews(id, user_id, status) VALUES (p_id, p_user, 'pending');
  RETURN usage || jsonb_build_object('reservation', p_id);
END;
$$;
-- statement-breakpoint
CREATE OR REPLACE FUNCTION release_engineer.finish_review(p_user text, p_id uuid, p_success boolean)
RETURNS boolean LANGUAGE plpgsql SET search_path = release_engineer, pg_temp AS $$
BEGIN
  PERFORM user_id FROM accounts WHERE user_id = p_user FOR UPDATE;
  UPDATE reviews SET status = CASE WHEN p_success THEN 'completed' ELSE 'released' END
    WHERE id = p_id AND user_id = p_user
      AND ((p_success AND status = 'pending' AND expires_at > now())
        OR (NOT p_success AND status IN ('pending', 'completed')));
  RETURN FOUND;
END;
$$;
