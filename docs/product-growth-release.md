# Product, evidence and sustainability release

11 October 2026. The first customer focus is maintainers and small teams changing public APIs, SDKs and webhook/security behavior. Other public PRs remain supported. The product's positioning is release-risk review with a pinned commit, visible evidence, bounded context and human follow-through.

## Implemented

- Restored missing public evidence documents; added `pnpm evidence:check` to CI.
- Published Daniel's developer-reported outcome using the supplied feedback and approved attribution, without exposing private correspondence or inventing a complete SHA/PR source.
- Added local revision comparison, validated JSON export/import, same-PR checks, file bounds and same-revision/partial-context warnings. Absence is never called a fix. The comparator is also available on Free to make the workflow testable; paid differentiation is review capacity.
- Free: 10/calendar UTC month. Pro: $9/month, up to 100/calendar UTC month, daily ceiling 100. Both support public PRs only. Calendar quotas are separate from subscription billing dates. Failed analysis releases review allowance; it may still incur a provider charge.
- Added shared, transactional admission against a $5 estimated daily API budget per environment, configurable with `ANALYSIS_DAILY_BUDGET_USD`. A worst-case input/output reservation precedes inference; known usage settles it. Unknown charges/crashed reservations stay conservatively charged for their UTC day.
- Recorded content-free inference metadata and explicit account-owned usefulness/action choices. No PR content, report text or free-text feedback is persisted.
- Signed-in request processing leaves 25 seconds within the 120-second route deadline for durable completion/rollback. Account rollback precedes optional failure-cost settlement; uncertain provider costs keep their conservative reservation.
- Prepared an up-to-500-character application packet and founder bio. No application or social profile submission was made.

## Cost model

The standard Sonnet 5.5 tariff checked on 11 October 2026 is $2/M input tokens, $10/M output tokens, $2.50/M 5-minute cache-write tokens and $0.10/M cache-read tokens. Source: [official model reference](https://platform.claude.com/docs/en/models/sonnet-5-5/overview). Production currently does not request prompt caching. Only this model has a configured tariff; another configured model fails closed before inference until its tariff is supported.

The historical candidate's 88,778 input and 22,150 output tokens imply $0.399056 at that tariff across 32 small synthetic cases. This is a tariff calculation, not an invoice or a production cost estimate. A hypothetical 8,000-input/1,500-output review costs $0.031 before infrastructure and payment fees. At 100 reviews/month that example implies $3.10 inference cost. Actual margins require the measured mix, failure costs, infrastructure, taxes and payment fees; no margin is promised.

The monthly change removes the previous 3,000-review monthly exposure at $9. Guest device quotas remain bypassable; shared server budget admission applies to guests and accounts. The budget is conservative estimated API admission, not a provider invoice cap, a currency reconciliation service, a traffic firewall or a paid availability guarantee.

## Quality and evaluation

Historical 22 PASS / 10 FAIL and the documented critical evaluator flag remain dated records. The original raw review was not retained, so no exact wording or current resolution is inferred. The current integrity layer rejects explicit test-execution claims; this release extends tense coverage (e.g. "tests confirmed") and adds targeted deterministic regression checks. Unit/CI success is not a new live model evaluation. No paid Claude requests were used to prepare this release.

Real-world evaluation should preserve licensed public snapshots, reviewed SHA, exact product/prompt version, human adjudication, safe cases and adversarial cases. [Dataset plan](evaluation-real-world-plan.md). Existing developer feedback can guide original synthetic fixtures without redistributing private code. A paid live run remains an explicitly budgeted operation, separate from ordinary CI.

## External boundaries

Paddle live activation depends on provider business/domain approval and matching live server key, client token, price and webhook secret. Sandbox cannot grant a live entitlement. No fabricated payment, customer, legal registration or outside investment is introduced. An incorporation-field answer cannot be supplied truthfully as a date while no entity is incorporated. Production usage and seven-day returns cannot be manufactured before the observation window elapses.
