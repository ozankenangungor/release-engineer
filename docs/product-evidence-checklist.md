# Private product evidence checklist

**Blank dossier workflow, not completed traction evidence.** Copy this checklist outside the checkout or into ignored `.private-evidence/`. Complete it with dated sources before answering a technical review. Never commit tester identities, private correspondence, API/account details or raw reports.

## Public identity and product sources

These are founder-provided facts, published consistently in the [About page](https://releaseengineer.tech/about), [README](../README.md) and structured metadata. Public consistency is verifiable. The founder has confirmed that no legal company is incorporated or registered; October 2026 is the project launch month.

| Field | Public value / source |
| --- | --- |
| Startup/product | Release Engineer |
| Domain / live product | https://releaseengineer.tech |
| Founder | Ozan Kenan Güngör |
| Contact | founder@releaseengineer.tech |
| Location / launched | Ankara, Türkiye / October 2026, no specific day asserted |
| Stage / funding | Early beta / bootstrapped, no external funding raised; founder-provided |
| Source repository | https://github.com/ozankenangungor/release-engineer |
| Founder GitHub | https://github.com/ozankenangungor |
| Founder LinkedIn | https://linkedin.com/in/ozan-kenan-gungor |
| Privacy / Terms | https://releaseengineer.tech/privacy / https://releaseengineer.tech/terms |
| Security/contact policy | [SECURITY.md](../SECURITY.md) / founder@releaseengineer.tech |

Claude is the core reasoning engine: the [server review client](../src/lib/claude.ts) uses the official SDK and production prompt, structured output and Zod validation; [coverage enforcement](../src/lib/review-policy.ts) applies deterministic limitations. The model default is centralized in [config](../src/lib/config.ts), not fixed by this checklist. The product reviews bounded public PR metadata/patches, not full repositories, and does not run tests. Reports support human decisions.

## Fill from actual observations

For **each** entry, record classification, date, source URL/private reference, exact commit and observer. Use **Verified** for direct observation, **Inferred** for source-supported conclusions without execution, and **Not yet verified** when evidence is absent or inaccessible.

- Current production commit: `[verify deployment SHA and successful production status; main HEAD alone is insufficient]`
- Production URL/status/screens and observation date: `[record actual response/rendered behavior]`
- Current offline verification: `[commit, command exits, test count, CI run URL and check name]`
- Preview deployment/runtime: `[build status and authenticated runtime inspection; a login page is not application verification]`
- Historical live runs: [baseline 37673686412](https://github.com/ozankenangungor/release-engineer/actions/runs/37673686412), commit `cac977a1f7d3452609e3619540b1a3dbbae51d8d`; [candidate 37675952752](https://github.com/ozankenangungor/release-engineer/actions/runs/37675952752), commit `1890f2e112fb2193c602b8471aebb3e312043a35`. Use the [checked synthetic summary](live-evaluation-evidence.md), including failures and the original private artifacts; do not relabel these as real-world accuracy.
- External tester records count: `[derive only from retained, consented, deduplicated external records; otherwise not established]`
- Founder test records: `[separate from external records; no invented completed record]`
- Users/customers/revenue: **not established** unless separately evidenced; do not infer from feedback, deployments or model requests.
- Public case studies: `[only existing, reviewed URLs; otherwise not established]`
- Founder-domain email delivery and public profile consistency: `[record actual manual verification; a mailto link does not prove delivery]`
- Account protections: `[record verified settings or leave unverified; do not copy secrets/account identifiers]`

## Before sharing

1. Preserve existing Actions artifacts privately before their seven-day expiry; record hashes and source run IDs. Share a manually sanitized summary, not raw outputs.
2. Confirm current production and repository facts agree. Date historical evaluations rather than claiming later commits were measured.
3. Attach only real [beta records](beta-feedback-template.md) or reviewed [case studies](public-pr-case-study-template.md) with their publication permissions.
4. Clearly separate technical validation from traction, offline tests from live Claude runs, and founder testing from external participation.
5. Keep unsupported fields “not established.” Do not invent stronger evidence to fill a checklist.
6. Review every attachment for secrets, personal data, private vulnerabilities and excessive third-party code.

Account hygiene is secondary to real product evidence: verify main rulesets/required checks, private vulnerability reporting, Dependabot, secret scanning/push protection, CodeQL, hosting request protection and Anthropic spending limits through their account interfaces. Missing or inaccessible settings remain explicit founder actions, not claims in public copy.
