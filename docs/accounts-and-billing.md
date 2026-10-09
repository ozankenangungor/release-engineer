# Accounts and billing

## Boundaries

Clerk authenticates users. Next.js resource handlers require an active, verified
session; they never trust a user ID or plan sent in a request body. Neon stores
account IDs, usage reservations/completions and provider subscription/transaction
IDs. PR contents, findings, reports, card details and billing addresses are not
persisted in this database.

The public analyzer still works without an account. Its device-local guest counter
is separate from server-enforced signed-in quotas and is not a spending boundary.
Existing origin, admission, retrieval, prompt and validation safeguards remain.

## Setup

1. Connect the existing Clerk and Neon resources to the Vercel project. Use their
   provisioned environment variables; do not create replacement applications or
   put server credentials in client code.
2. Configure the five production CNAME records shown in Clerk's domain setup at
   the domain's **authoritative** DNS provider. Verify the production domain and
   certificate in Clerk before enabling a production sign-in UI. Vercel DNS
   records alone do not help when external nameservers are authoritative.
3. Apply the additive migration to the intended database:

   ```sh
   node scripts/migrate-accounts.mjs /private/path/to/environment
   ```

   The script uses `DATABASE_URL_UNPOOLED`, runs statements in a transaction and
   can be rerun. Deployment does not automatically run migrations.

4. Create a Paddle sandbox API key with price/transaction/subscription read,
   transaction write and customer-portal session write permissions. Store
   `PADDLE_API_KEY` in Vercel environment settings. Do not paste it in chat or git.
   A server key already saved under the Secret name `a` is also supported. The
   alias must have the Paddle server-key prefix for the configured environment;
   `PADDLE_API_KEY` takes precedence. It remains server-only.
5. Create a Paddle notification destination at
   `https://releaseengineer.tech/api/billing/webhook`. Subscribe to
   `subscription.created`, `subscription.updated`, `subscription.activated`,
   `subscription.canceled`, `subscription.paused`, `subscription.resumed`,
   `subscription.past_due` and **`transaction.completed`**. Store its secret as
   `PADDLE_WEBHOOK_SECRET`. This last transaction event also reconciles an initial
   subscription when its earlier notification arrived before payment completed.
6. Set Paddle's default payment link to `https://releaseengineer.tech/pricing`.
   Redeploy after changing environment variables. Check a signed-in account:
   `/api/account` must say billing is ready and environment is sandbox.

Missing auth configuration leaves public pages/analyzer available. Missing billing
configuration disables account billing; it does not manufacture a subscription.

## Allowance and payment state

Free signed-in accounts have 10 completed reviews per UTC day. An active verified
**live** subscription with the configured price and a future paid period has 100.
Sandbox subscription records never buy real inference allowance. A row lock
serializes per-account review reservations across instances. One account has at
most one pending review. Failures release their reservation; a crash reservation
expires after three minutes. Completion is idempotent and bound to the same user.
Only validated, durably completed reports count. Downloads consume no allowance.

Account checkout creates a transaction on the server, persists its association and
then returns its ID to Paddle.js. Checkout creation has an expiring account lock
and reuses unfinished transactions. Client callbacks cannot set a plan. Webhooks
verify raw bytes and timestamp, fetch current provider state, validate ownership
and plan details and reject stale subscription updates. Cancellation, pause,
past-due status, price/quantity changes and paid-period expiry remove Pro allowance.
The account's subscription is managed through Paddle's authenticated customer
portal; the browser cannot choose another customer's ID.

## Live activation

Complete Paddle's business/domain approval before accepting live payment. Configure
`PADDLE_ENVIRONMENT=live`, a **live** server API key and notification secret,
`PADDLE_PRICE_ID` for the active USD 9 monthly price and
`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` beginning `live_`. The sandbox IDs cannot be reused
in live mode. Update the public pricing copy when live checkout is actually
available; the public sandbox preview is intentionally a separate demonstration.
Verify payment, notification, entitlement, cancellation and portal flows against
the intended environment. Do not claim live billing solely from a client event.

## Verification without paid inference

Offline CI runs unit/browser tests with explicit upstream mocks. No paid Claude
call or payment is required. Optional real-service checks:

```sh
node scripts/verify-account-database.mjs /private/path/to/development-environment
node scripts/verify-auth.mjs /private/path/to/development-environment http://localhost:3105 /private/artifact-directory
node scripts/run-auth-browser-tests.mjs /private/path/to/development-environment http://localhost:3106
```

Database verification uses a temporary, isolated schema on the configured Neon
database and drops it in `finally`. It is not an isolated Neon branch. Auth
verification requires **development** keys, signs up via the real UI with a
unique Clerk test address, verifies sign-in/session/usage/sign-out and deletes
only that invocation's temporary test user and account rows. It intercepts all
analysis requests. It saves screenshots, not session cookies or authentication
traces. Keep environment files private and outside git.

The optional browser runner uses Clerk-issued development testing tokens to bypass
bot detection in automation; it does not sign in a user or bypass resource
authorization. Its traces are disabled and token query parameters are redacted.
The general UI suite still verifies all public routes, analysis interactions,
downloads, accessibility and WebGL behavior. Provider security connection probes
and canceled account reads during development-cookie initialization are separate
from essential request failures; a canceled read requires a completed account
response. Report/verification content must remain absent from provider requests
and browser storage.

## Retention and removal

Old per-account review accounting rows are purged after 31 days on the account's
next review. Old webhook IDs and checkout associations are purged after 90 days
when a billing event is processed. These are activity-based cleanup boundaries,
not promises of a background deletion job. Account deletion requests go to the
founder. Cancel the provider subscription first, then remove that exact account
and its Clerk identity; deleting app rows alone cannot stop a provider charge.
Provider backup/legal retention follows their policies. Account IDs are personal
data and must not be included in public operational evidence.

## Recorded sandbox verification — 11 October 2026

A temporary development Clerk account completed the real Paddle sandbox checkout
for the configured USD 9 monthly price. Signed notifications reached the production
webhook and persisted the verified sandbox subscription in Neon. The account
portal opened successfully, a second subscription attempt returned 409, and the
test subscription's renewal was canceled in the customer portal before the owned
Clerk identity and Neon account were removed. The mobile account view had no
horizontal overflow at 390 × 844.

The sandbox account retained its Free allowance of 10 reviews/day. No real payment
or paid Claude call was made. This is integration verification, not customer
traction or verification of live payment processing. Production signup/signin
forms and the production Clerk SDK were checked; production signup email delivery
was not exercised by this development-account test.
