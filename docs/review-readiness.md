# Reproducible review evidence

This is a verification procedure, not a record of completed beta tests or model scores. Record observations at the exact commit tested; a passing build or mock response does not prove model quality or production security.

## Evidence classes

| Class | Meaning | Examples |
| --- | --- | --- |
| Verified | Directly observed, with a source and date | Command exit/status at a commit, workflow run, a parsed live artifact, consented tester record |
| Inferred | Supported by source inspection, not external execution | A fixed GitHub host prevents caller-selected hosts in this fetch path; application code has no persistence sink |
| Not yet verified | No adequate observation or source | Live quality baseline, actual provider retention, external testing without records, hosting WAF configuration without account inspection |

Keep technical evidence separate from traction. A deployed page, valid structured response or passing CI job does not establish user/customer counts, accuracy or release safety.

## Offline verification

From a clean checkout, record `git rev-parse HEAD`, Node/pnpm versions and each exit code:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
NEXT_TELEMETRY_DISABLED=1 pnpm build
pnpm eval:validate
git diff --check
pnpm eval:live --help
```

Tests mock upstream services and block unmocked `fetch`. Fixture validation exercises the actual context builder. Neither command measures Claude's quality, latency or token usage. The CLI artifact tests use a scripted executor and temporary directories; their outputs are not live evidence.

To check the CLI's opt-in gate without credentials or a request:

```sh
env -u EVAL_LIVE -u ANTHROPIC_API_KEY -u GITHUB_TOKEN pnpm eval:live
```

Expected: exit `2`, with `Live evaluation requires EVAL_LIVE=1. No provider request was sent.` This is a successful rejection check, not a live run. The CLI does not load `.env.local`.

After `pnpm start`, inspect `/`, `/about`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, the logo and icon. Check status codes, route-specific canonicals, the Google verification tag, one parseable JSON-LD graph with resolving IDs, visible identity without JavaScript, mobile overflow and console errors. Use mocked reports for browser states. Do not submit a valid PR during offline verification.

## Optional one-request provider smoke

Only after explicit spending authorization, supply the key through a secret manager/process environment without printing it. Keep the production prompt, model, schema, context selection and grader unchanged:

```sh
EVAL_LIVE=1 pnpm eval:live --cases correctness-null-dereference --max-cases 1 --label smoke --include-reviews
```

This uses one local synthetic case and the production engine/model configuration. There are no GitHub requests, automatic retries or automatic full-dataset continuation. A single case is an integration check, not a 32-case quality baseline. A rubric failure is useful evidence; do not repair its labels to obtain a pass.

Inspect `evals/results/smoke-*/result.json` and `report.md` locally:

- Commit, dataset/evaluator versions and fingerprints; requested/served model and selected case IDs.
- Complete status counts, including `FAIL`, `INFRASTRUCTURE_ERROR` and `NOT_RUN`; never omit unavailable cases.
- Both `modelReview` and delivered-review grades, including critical failures. A raw partial-context `merge` remains a failure even if production corrects it.
- Stop reason, actual usage and duration when available. Unknown values stay unknown; no dollar cost or improvement is invented.
- Validated outputs and evidence grounding, including false positives and limitations. An integration/rubric pass on one case is not production accuracy.

If the provider fails or output is invalid, retain the failure artifact and stop; do not retry automatically. A full baseline needs separate spending authorization, a planned case cap and manual adjudication. See [evaluation commands and comparisons](../evals/README.md).

## Handling and publishing evidence

Live artifacts are ignored and private by default. Optional responses are validated, not necessarily free of sensitive content. Never force-add `evals/results/` or copy raw responses into fixtures. Redaction is supplementary, not a privacy guarantee.

Keep completed feedback notes outside the checkout or in ignored `.private-evidence/`; use the [blank feedback template](beta-feedback-template.md). Ignore rules do not prevent deliberate force-adds, copied files, backups or screenshots.

A publishable summary should be separately prepared and reviewed. Include the tested commit, reproducible commands, workflow/deployment links, fingerprints, selected cases, complete denominators and actual observations. Remove secrets, personal identifiers, private context and unnecessary third-party code. Obtain specific consent for quotes or identity disclosure. Do not describe synthetic or scripted outputs as developer/customer evidence.

## Account-level checks

Source code cannot establish GitHub or Vercel account settings. Inspect and record private vulnerability reporting, Dependabot alerts/security updates, code scanning, secret scanning/push protection, main-branch rules and required `verify` checks. Treat inaccessible settings as unverified.

Independently confirm Vercel request protection for `/api/analyze`, early-beta deployment access and Anthropic spending limits. A successful page request or invalid-input rejection cannot prove distributed rate limiting. Do not load-test the paid endpoint or introduce an in-memory substitute.

Use [SECURITY.md](../SECURITY.md) for private vulnerability disclosure. The application, GitHub, Anthropic and hosting provider have distinct retention and disclosure boundaries.
