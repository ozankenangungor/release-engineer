# Live-product usage and cost measurement

Updated 11 October 2026. This document defines post-instrumentation measurement; it does not publish a verified production user/customer count.

## Durable records

The server reserves an inference budget immediately before a Claude request. Neon stores a random inference ID, environment, UTC date/time, requested model, product commit, optional authenticated account ID, server outcome, token counts, duration and partial-context flag. No PR identifier, source patch, report content or free-text note is stored. Known token costs are standard-tariff estimates, not invoices. Unknown or interrupted charges retain a conservative reservation. The daily global row lock serializes admission across instances, including guests. See [product release](product-growth-release.md) for tariff and budget limits.

Completed reports and unique authenticated accounts are separate metrics. Guest reports cannot identify distinct people. Operator accounts can be excluded with the server-side `is_operator` flag; no client can set it. Guest operator checks cannot be identified and require separate exclusion/disclosure. No records before this migration are reconstructed as measured production inference. Missing telemetry must never be assumed successful.

## Optional user feedback

Signed-in users may explicitly submit a usefulness choice and action choice for their own completed production review. The authenticated route enforces origin, a 1 KiB streamed body limit, strict allowed fields, ownership and successful status. Repeated submissions update the one record, not extra feedback counts. These choices are self-reports, not verified fixes or accuracy ground truth. Local verification worksheet notes remain local and are never sent through this endpoint.

## Private summary

```sh
node scripts/summarize-product-usage.mjs /private/production-env 2026-10-11T00:00:00Z 2026-10-12T00:00:00Z
```

Use a completed past window <=89 days. The script prints aggregate numbers only, never account IDs, PRs or credentials. It separates admitted inference attempts, completed server reports, failed attempts, unresolved reservations, guests, authenticated accounts, known/unknown cost and self-reported feedback. A seven-day eligible cohort needs a full seven-day observation window; return means a successful server report between day 1 and day 7 after first observed success in that window. This is observed account activity, not lifetime retention or unique human users.

Retention is activity-based: records older than 90 days are removed on later admission; account deletion removes linked records. Do not promise background deletion or provider backup removal. Store private exports outside Git. Do not publish a number until its window, coverage and operator exclusions have been reviewed.

## Existing operational logs

`src/lib/live-usage.ts` continues to emit content-free start/success/failure events. `scripts/summarize-live-usage.mjs` can read preserved sanitized version-1 logs with explicit windows and operator attempt exclusions. These logs cover retrieval failures as well as inference; durable inference rows begin later in the request lifecycle. A server success does not prove delivery, correctness, a customer or a distinct person. Hosting logs follow Vercel retention; no browser tracker or session replay is installed.
