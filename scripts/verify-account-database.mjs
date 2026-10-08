import fs from "node:fs";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";

// Uses an isolated, temporary schema. Never modifies real accounts or invokes Claude.
if (!process.argv[2]) throw new Error("Pass a private environment file.");
const env = parseEnv(fs.readFileSync(process.argv[2], "utf8"));
const sql = neon(env.DATABASE_URL_UNPOOLED);
const schema = `account_verification_${Date.now()}`;
const source = fs
  .readFileSync(
    new URL("../db/migrations/001_accounts.sql", import.meta.url),
    "utf8",
  )
  .replaceAll("release_engineer", schema);
let assertions = 0;
const check = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions++;
};
const query = (s, args = []) =>
  sql.query(s.replaceAll("$SCHEMA", schema), args);
const reserve = async (user, price = null) =>
  (
    await query("SELECT $SCHEMA.reserve_review($1,$2::uuid,$3) AS usage", [
      user,
      randomUUID(),
      price,
    ])
  )[0].usage;
const finish = async (user, id, success) =>
  (
    await query("SELECT $SCHEMA.finish_review($1,$2::uuid,$3) AS ok", [
      user,
      id,
      success,
    ])
  )[0].ok;
const usage = async (user, price = null) =>
  (
    await query("SELECT $SCHEMA.account_usage($1,$2) AS usage", [user, price])
  )[0].usage;
try {
  await sql.transaction(
    source.split("-- statement-breakpoint").map((s) => sql.query(s)),
  );
  const first = await reserve("free");
  check(first.limit, 10);
  check((await reserve("free")).error, "ACCOUNT_BUSY");
  check(await finish("different-user", first.reservation, true), false);
  check(await finish("free", first.reservation, false), true);
  check((await usage("free")).used, 0);
  for (let i = 0; i < 9; i++) {
    const r = await reserve("free");
    check(await finish("free", r.reservation, true), true);
  }
  const race = await Promise.all(
    Array.from({ length: 8 }, () => reserve("free")),
  );
  const winners = race.filter((r) => r.reservation);
  check(winners.length, 1);
  check(race.filter((r) => r.error === "ACCOUNT_BUSY").length, 7);
  check(await finish("free", winners[0].reservation, true), true);
  check((await reserve("free")).error, "DAILY_LIMIT");
  check((await usage("free")).remaining, 0);
  check(await finish("free", winners[0].reservation, true), false);
  const stale = await reserve("expired");
  await query(
    "UPDATE $SCHEMA.reviews SET expires_at=now()-interval '1 second' WHERE id=$1::uuid",
    [stale.reservation],
  );
  check(await finish("expired", stale.reservation, true), false);
  check(Boolean((await reserve("expired")).reservation), true);
  const crossing = await reserve("midnight");
  await query(
    "UPDATE $SCHEMA.reviews SET utc_day=utc_day-1 WHERE user_id='midnight'",
  );
  check((await usage("midnight")).pending, 1);
  check((await reserve("midnight")).error, "ACCOUNT_BUSY");
  check(await finish("midnight", crossing.reservation, false), true);
  const interrupted = await reserve("interrupted");
  check(await finish("interrupted", interrupted.reservation, true), true);
  check(await finish("interrupted", interrupted.reservation, false), true);
  check((await usage("interrupted")).used, 0);
  await query("INSERT INTO $SCHEMA.accounts(user_id) VALUES ('pro')");
  await query(
    "INSERT INTO $SCHEMA.subscriptions(subscription_id,user_id,customer_id,environment,status,price_id,valid_until,provider_updated_at) VALUES ('sub_test','pro','ctm_test','sandbox','active','pri_test',now()+interval '1 day',now())",
  );
  check((await usage("pro", "pri_test")).limit, 10); // Test subscriptions never grant paid inference.
  await query("UPDATE $SCHEMA.subscriptions SET environment='live'");
  check((await usage("pro", null)).limit, 10); // Deployment must explicitly enable the live price.
  check((await usage("pro", "pri_wrong")).limit, 10);
  check((await usage("pro", "pri_test")).limit, 100);
  for (const status of ["canceled", "past_due", "paused", "trialing"]) {
    await query("UPDATE $SCHEMA.subscriptions SET status=$1", [status]);
    check((await usage("pro", "pri_test")).limit, 10);
  }
  await query(
    "UPDATE $SCHEMA.subscriptions SET status='active',valid_until=now()-interval '1 second'",
  );
  check((await usage("pro", "pri_test")).limit, 10);
  await query(
    "UPDATE $SCHEMA.subscriptions SET valid_until=now()+interval '1 day'",
  );
  await query(
    "INSERT INTO $SCHEMA.reviews(id,user_id,status,utc_day) SELECT gen_random_uuid(),'pro','completed',(now() AT TIME ZONE 'UTC')::date FROM generate_series(1,99)",
  );
  const proRace = await Promise.all(
    Array.from({ length: 5 }, () => reserve("pro", "pri_test")),
  );
  check(proRace.filter((r) => r.reservation).length, 1);
  check(
    await finish("pro", proRace.find((r) => r.reservation).reservation, true),
    true,
  );
  check((await reserve("pro", "pri_test")).error, "DAILY_LIMIT");
  await query(
    "UPDATE $SCHEMA.reviews SET utc_day=utc_day-1 WHERE user_id='pro'",
  );
  check((await usage("pro", "pri_test")).used, 0);
  check((await usage("pro", "pri_test")).remaining, 100);
  const claimCheckout = (id) =>
    query(
      "UPDATE $SCHEMA.accounts SET checkout_lock_id=$2::uuid, checkout_lock_until=now()+interval '90 seconds' WHERE user_id=$1 AND (checkout_lock_until IS NULL OR checkout_lock_until<now()) RETURNING user_id",
      ["pro", id],
    );
  const checkoutRace = await Promise.all(
    Array.from({ length: 6 }, () => claimCheckout(randomUUID())),
  );
  check(checkoutRace.filter((rows) => rows.length).length, 1);
  check(checkoutRace.filter((rows) => !rows.length).length, 5);
  const wrongRelease = await query(
    "UPDATE $SCHEMA.accounts SET checkout_lock_until=NULL WHERE user_id='pro' AND checkout_lock_id=$1::uuid RETURNING user_id",
    [randomUUID()],
  );
  check(wrongRelease.length, 0);
  await query(
    "UPDATE $SCHEMA.accounts SET checkout_lock_until=now()-interval '1 second' WHERE user_id='pro'",
  );
  check((await claimCheckout(randomUUID())).length, 1);
  console.log(
    JSON.stringify({
      assertions,
      result: "passed",
      isolatedSchema: true,
      paidClaudeCalls: 0,
      realPayments: 0,
    }),
  );
} finally {
  await sql.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
}
