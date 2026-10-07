# Live-product usage evidence

This is a measurement system and runbook, **not an existing production count**. No count is published by this sprint. The application runs on Vercel with a stateless Next.js server route and no database. First-party structured runtime logs are the smallest mechanism that fits this architecture. Browser page views, synthetic evaluations and CI requests do not produce these events.

## What is recorded

`src/lib/live-usage.ts` emits one JSON line per event through server `console.info`, under namespace `release_engineer_usage`, schema version `1`. Vercel captures application stdout in [Runtime Logs](https://vercel.com/docs/logs/runtime). No analytics client, cookie, session replay, third-party telemetry package or database is added.

| Event | Meaning | Extra fields |
| --- | --- | --- |
| `analysis_started` | The URL/request passed validation and Claude configuration exists, immediately before GitHub retrieval. | None |
| `analysis_succeeded` | GitHub retrieval, bounded context, Claude review, final schema validation and response construction completed. | `durationMs`, `changedFileCount`, `includedFileCount`, `partialContext` |
| `analysis_failed` | A started attempt failed or was aborted before success. | `durationMs`, allowlisted `errorCode` |

Every event contains an ISO timestamp in UTC, environment (`production`, `preview`, `development` or `local`), a random per-attempt `analysisId`, and `productCommit` only when a valid Vercel Git commit SHA is available. The random ID deduplicates overlapping exports and links start/outcome; it identifies no person, browser, session or PR, is not derived from content, and is never returned to the browser. Logging failures cannot fail a report. Invalid requests and missing configuration do not count as started analyses. Process termination or hosting timeout may leave a start with no terminal event.

A success is **a server-prepared schema-valid report**, including partial-context reports. It does not prove browser receipt, model correctness, an action taken, a unique PR, a developer or a customer. Repeated analyses of the same PR are distinct attempts. There is deliberately no PR hash or identity with which to count unique PRs or people.

## Intentionally excluded

Application events never contain PR URLs, owners, repository names, patch/code, descriptions, report/model output, user identity, emails, IP addresses, cookies, headers, API keys, secrets or raw exceptions. Only explicit allowlisted fields are constructed; unknown error codes become `ANALYSIS_FAILED`. Platform access logs may independently contain request metadata under the hosting provider's policy. Do not forward whole platform log envelopes as sanitized application evidence. Privacy and Terms describe these boundaries.

## Activation and preserving a useful window

1. Merge and deploy this change through the normal release process; this PR must not be merged by the implementing agent. Events start automatically in code after deployment. Confirm the production SHA in Vercel and GitHub.
2. In the Release Engineer Vercel project, open **Logs**, select **Production**, route **`/api/analyze`**, and search **`release_engineer_usage`**. Confirm with an already authorized, real beta analysis that one start and one terminal event share an ID. A new Claude request consumes operator credits and needs separate spend authorization. No paid calls were made to activate or test this system in the sprint.
3. Check the account's actual runtime-log retention and export access before starting a measurement window. Vercel retention is plan-dependent and may be short; consult the current [runtime-log limits](https://vercel.com/docs/logs/runtime#limits). **Do not assume logs form durable beta evidence.** Record plan, retention, export cadence and UTC coverage privately.
4. Before logs expire, preserve only the `message` JSON for version 1 application events into a private newline-delimited JSON file. Use the dashboard's available export or an already configured first-party log destination. Keep overlapping exports to avoid boundary loss; deduplication handles exact overlaps. Verify export filters, pagination/row caps and time coverage. Do not claim a complete beta window if samples, expiration or gaps exist.
5. If the current plan cannot preserve the proposed window, use a shorter fully captured window and export before expiry. Configuring a durable drain or changing the hosting plan is an account action and may have a cost; it is not silently enabled here. Restrict any destination to sanitized application messages and access-controlled retention. Never add a large database for a vanity counter.
6. Keep known founder/operator/QA analyses in a private exclusion list of random attempt IDs from hosting logs, or reserve documented time windows for operator tests. The app cannot distinguish operator, external, automated or abusive requests without identity. Exclude known tests; disclose unknown traffic. A browser header or client-supplied label is not trustworthy attribution.

No Vercel account setting or retention capability was verified by this repository change. No environment variable or client activation is required for stdout events. Test environment logging is suppressed; tests explicitly simulate production and mock providers.

## Obtain a count

Create sanitized NDJSON outside Git. Provide a UTC half-open window (start included, end excluded). Include start events just before the window if a request crossed its boundary. Keep an exclusion file containing a JSON array of known operator attempt UUIDs; even an empty array requires a deliberate check of operator activity.

```sh
node scripts/summarize-live-usage.mjs /private/beta-events.ndjson \
  --from 2026-10-08T00:00:00Z --to 2026-10-09T00:00:00Z \
  --exclude-ids /private/operator-analysis-ids.json
```

The script validates the event version and strict field schema, ignores nonproduction events, deduplicates by `(analysisId, event)`, rejects conflicting duplicates/outcomes and excludes specified attempt IDs. It returns only aggregate JSON: starts, successes, failures, partial-context successes, exclusions, duplicate events and successes without captured starts. It refuses unsanitized platform metadata and never prints input lines. There is no network or provider call.

Count unique **`analysis_succeeded` attempt IDs** whose terminal timestamps fall in the window. Missing starts, logging failures and hard timeouts limit completeness. A start/failure is not a successful analysis. CLI totals are observed records, not proof that the export is complete or external participation is established. Compare preserved window coverage, deployment provenance and operator notes before publishing anything. Preserve the sanitized records privately, record their SHA-256 hash and retain a dated aggregate summary with the exact method and exclusions. Do not commit raw logs, tester records or exclusion IDs.

## How to report it

Only after checking real production evidence, a claim may say: “14 successful public-PR analyses were recorded from [start UTC] to [end UTC], excluding [known operator tests], including [partial-context count] partial reviews.” The number 14 is an **illustrative future statement**, not a result. If export coverage has gaps, call it “at least N observed successes in the preserved window” and document the gap. If operator traffic cannot be separated, disclose that it is included. Unknown traffic must not be relabeled external beta use.

Never turn analyses into users, sessions, unique developers, customers, unique PRs or verified bugs. These events cannot establish those metrics. Synthetic Claude evaluations use a separate engine path and must never be mixed into live-product counts.
