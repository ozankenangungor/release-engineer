-- Preserve completed usage; change only the Free calendar-month allowance.
-- The daily field remains a safety ceiling for API compatibility.
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
    'remaining',greatest(0,CASE WHEN pro THEN least(100-used-pending,100-month_used-pending) ELSE least(10-used-pending,10-month_used-pending) END),
    'resetsAt',(((now() AT TIME ZONE 'UTC')::date+1)::timestamp AT TIME ZONE 'UTC'),
    'monthly',jsonb_build_object('limit',CASE WHEN pro THEN 100 ELSE 10 END,'used',month_used,'remaining',greatest(0,(CASE WHEN pro THEN 100 ELSE 10 END)-month_used-pending),
      'resetsAt',((date_trunc('month',now() AT TIME ZONE 'UTC')+interval '1 month') AT TIME ZONE 'UTC')))
  FROM entitlement,counts;
$$;
