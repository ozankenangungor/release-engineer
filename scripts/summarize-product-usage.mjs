import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { neon } from "@neondatabase/serverless";
const [file,from,to] = process.argv.slice(2);
const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
if (!file || !iso.test(from ?? "") || !iso.test(to ?? "") || !Number.isFinite(Date.parse(from)) || !Number.isFinite(Date.parse(to)) || Date.parse(from)>=Date.parse(to) || Date.parse(to)>Date.now() || Date.parse(to)-Date.parse(from)>89*86400000) throw new Error("Usage: node scripts/summarize-product-usage.mjs /private/env FROM_UTC_ISO TO_UTC_ISO; window must be in the past and <=89 days.");
const env=parseEnv(readFileSync(file,"utf8"));
if (!env.DATABASE_URL_UNPOOLED) throw new Error("A private direct database connection is required.");
const sql=neon(env.DATABASE_URL_UNPOOLED,{fetchOptions:{signal:AbortSignal.timeout(20000)}});
try {
  const rows=await sql`WITH filtered AS (
    SELECT u.* FROM release_engineer.inference_usage u LEFT JOIN release_engineer.accounts a ON a.user_id=u.user_id
    WHERE u.scope='production' AND u.created_at>=${from}::timestamptz AND u.created_at<${to}::timestamptz AND coalesce(a.is_operator,false)=false
  ), first_use AS (SELECT user_id,min(created_at) AS first_at FROM filtered WHERE user_id IS NOT NULL AND status='succeeded' GROUP BY user_id)
  SELECT count(*)::int AS admitted_inference_attempts,
    count(*) FILTER(WHERE status='succeeded')::int AS completed_server_reports,
    count(*) FILTER(WHERE status='failed')::int AS failed_inference_attempts,
    count(*) FILTER(WHERE status='reserved')::int AS unresolved_reservations,
    count(*) FILTER(WHERE user_id IS NULL AND status='succeeded')::int AS guest_reports,
    count(DISTINCT user_id) FILTER(WHERE status='succeeded')::int AS accounts_with_completed_reports,
    count(*) FILTER(WHERE cost_known)::int AS attempts_with_known_tariff_estimate,
    coalesce(sum(cost_micros) FILTER(WHERE cost_known),0)::text AS known_cost_micros,
    coalesce(sum(cost_micros) FILTER(WHERE NOT cost_known),0)::text AS conservative_unknown_cost_micros,
    count(*) FILTER(WHERE usefulness IS NOT NULL)::int AS feedback_responses,
    count(*) FILTER(WHERE usefulness='useful')::int AS useful_responses,
    count(*) FILTER(WHERE usefulness='mixed')::int AS mixed_responses,
    count(*) FILTER(WHERE action IN ('changed_code','added_or_changed_tests'))::int AS reported_code_or_test_actions,
    (SELECT count(*)::int FROM first_use WHERE first_at<=${to}::timestamptz-interval '7 days') AS eligible_seven_day_accounts,
    (SELECT count(*)::int FROM first_use f WHERE first_at<=${to}::timestamptz-interval '7 days' AND EXISTS(
      SELECT 1 FROM filtered r WHERE r.user_id=f.user_id AND r.status='succeeded' AND r.created_at>=f.first_at+interval '1 day' AND r.created_at<=f.first_at+interval '7 days'
    )) AS returned_within_seven_days FROM filtered`;
  const data=rows[0];
  console.log(JSON.stringify({fromInclusiveUtc:from,toExclusiveUtc:to,...data,
    estimatedApiCostUsd:Number(data.known_cost_micros)/1e6,
    qualification:"Post-instrumentation server observations; not retroactive usage, browser delivery, unique people, paid customers or accuracy. Operator accounts must be privately marked; guest operator checks cannot be identified. Feedback is self-reported. Estimates use the documented standard tariff, not provider invoices. Records older than 90 days are removed on subsequent admission; dormant records can persist longer."},null,2));
} catch { console.error("Usage summary unavailable. Check the private database configuration and measurement migration."); process.exitCode=1; }
