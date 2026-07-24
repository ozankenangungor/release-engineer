# Release Engineer

Live product: [releaseengineer.tech](https://releaseengineer.tech)

Your AI Release Engineer. Paste a public GitHub pull-request URL to get a structured release-readiness review powered by Claude: regressions, correctness risks, testing gaps, breaking changes, security concerns, and visible dependency, configuration and operational risks.

Reports support human release decisions. They do not guarantee safe code or replace review and testing. An empty findings list is a valid result.

## Startup

Release Engineer is an early-stage, bootstrapped developer-tool startup founded in 2026 in Ankara, Türkiye by Ozan Kenan Güngör. Learn more on the [About page](https://releaseengineer.tech/about) or contact [founder@releaseengineer.tech](mailto:founder@releaseengineer.tech).

## MVP scope

One responsive landing page and analysis interface, public PR retrieval, bounded change context, validated Claude reviews, and brief Privacy and Terms pages. There are no accounts, database, persistence, OAuth, billing, queues, analytics or telemetry vendors. PR contents and reports are held in memory for the request and browser session.

## Architecture

```text
Browser: PR input → POST /api/analyze → validated report
                        │
                        ├─ GitHub URL parser (fixed github.com URL format)
                        ├─ GitHub REST client (fixed api.github.com host)
                        ├─ deterministic context budgeting
                        └─ official Anthropic SDK → Zod validation
```

- `src/lib/github-url.ts`: shared pure URL parser. Only HTTPS PR URLs are accepted; query strings, fragments, credentials, ports, other hosts and extra path segments are rejected. Whitespace and one trailing slash are normalized.
- `src/lib/github.ts`: server-only GitHub client, runtime response validation, public visibility enforcement, paginated changed files, response size/time limits and a final check that head/base did not change during retrieval.
- `src/lib/context.ts`: pure context selection with deterministic prioritization and explicit coverage metadata.
- `src/lib/config.ts`, `prompt.ts`, `claude.ts`: server configuration, injection-aware system prompt, official SDK structured output and safe errors. Model output and deterministic limitations are validated before return. Partial coverage cannot receive a merge verdict.
- `src/lib/review-schema.ts`: strict Zod review and API-response contracts, shared with the browser.
- `src/app/api/analyze/route.ts`: bounded JSON request, orchestration and uncached responses.
- `src/components/`: accessible form/loading/error states and readable report sections. React renders plain text; raw model output is never rendered as a report.

Built with current stable Next.js 16.4 App Router, React, strict TypeScript, Tailwind CSS, Zod and Vitest. All GitHub and Anthropic requests happen on the server. `server-only` imports guard credential-bearing modules.

## Local setup

Use Node.js 24 or later and pnpm 12.9.1 (recorded in `packageManager`). Install pnpm with `npm install --global pnpm@12.9.1` if needed.

```sh
git clone https://github.com/ozankenangungor/release-engineer.git
cd release-engineer
pnpm install --frozen-lockfile
cp .env.example .env.local
# Edit .env.local with your own Anthropic API key.
pnpm dev
```

Open http://localhost:3000 and paste a real public PR URL, for example `https://github.com/owner/repository/pull/123`. Examples here are URL shapes, not fixture PRs. No API keys are required to build or run the unit tests. Analysis requires an Anthropic API key with API access/credits.

| Environment variable | Purpose                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`  | Required for analysis. Server-only Anthropic API key.                                                         |
| `ANTHROPIC_MODEL`    | Optional model override. Default is centralized in `src/lib/config.ts`. Must support structured JSON outputs. |
| `GITHUB_TOKEN`       | Optional server-only token to improve GitHub API limits. Public PRs work without it where GitHub allows.      |

Never prefix these with `NEXT_PUBLIC_`. `.env.local` and all real environment files are ignored; `.env.example` contains no credentials. The endpoint returns an actionable 503 if Claude is unconfigured.

## Context limits

Limits are explicit constants, not a token estimator:

| Limit                            | Value                                           |
| -------------------------------- | ----------------------------------------------- |
| GitHub changed-file retrieval    | 500 files, pages of 100                         |
| GitHub response body             | 4 MB per response                               |
| GitHub retrieval time            | 30 seconds total                                |
| Serialized Claude change context | 60,000 UTF-8 bytes, including JSON overhead     |
| Files included in Claude context | 40                                              |
| Each included patch              | 8,000 UTF-8 bytes                               |
| PR description                   | 6,000 UTF-8 bytes                               |
| Claude output / request          | 6,000 tokens / 90 seconds, no automatic retries |
| Endpoint duration                | 120 seconds; pipeline aborts after 115 seconds  |

Security, authentication, migrations and configuration paths come first, followed by ordinary source, tests, documentation and generated files/lockfiles. Paths break ties deterministically. A file that does not fit the serialized budget is skipped so later smaller files can contribute. Missing patches are represented explicitly. Omitted files, shortened patches/descriptions and unavailable patches produce user-visible warnings and deterministic report limitations.

## Verification

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test:watch` runs Vitest interactively. Tests cover safe URL parsing, exact serialized context budgets and Unicode, deterministic selection, structured result validation, GitHub pagination/visibility/errors, official SDK request/response handling, injection separation, partial-verdict enforcement and endpoint failures. Upstream services are mocked; tests never consume API credits. CI runs all commands above on pull requests and main.

For a production preview, run `pnpm build` then `pnpm start`. Deploy to a Node.js host that permits a 120-second route and set the server environment variables. No hosting infrastructure is included in this MVP.

## Evaluation

The [evaluation harness](evals/README.md) includes 32 versioned, original synthetic PR cases, evidence-based rubrics, separate risk-recall/false-positive/safety metrics and compatible baseline comparisons. `pnpm test` tests the evaluator offline; `pnpm eval:validate` validates fixtures against the real context builder without a key or network. These checks are not a Claude quality baseline.

`pnpm eval:live` is separate and fails closed unless `EVAL_LIVE=1` and `ANTHROPIC_API_KEY` are explicitly supplied in the process environment. It defaults to one small case, uses the production review engine without automatic retries, and writes ignored local artifacts. It never runs in CI or automatically loads environment files. See the evaluation documentation for spend caps, comparison commands, dataset versioning and grading limitations.

## Deployment safety

The analysis endpoint is unauthenticated and each analysis can consume the operator's Claude credits. Before broad public exposure, configure:

- Hosting/platform request protection or rate limiting for `/api/analyze`.
- Anthropic organization spending limits.
- Appropriate deployment access controls during the early beta.

These protections must be configured outside the application. This MVP does not include authentication or distributed rate limiting.

## Current limitations

- Public GitHub pull requests only. No GitHub Enterprise or arbitrary remote fetches.
- Claude sees selected PR metadata and exposed patches, not the full repository, unchanged code, PR comments, linked issues, CI output or runtime behavior. GitHub can omit binary or large patches. GitHub's files endpoint itself has a 3,000-file ceiling; this application stops at 500.
- Size caps mean large PRs are analyzed in part; lockfiles have low priority and dependency risk may be missed. Coverage warnings describe what was omitted.
- A PR can change after retrieval. The report displays the retrieved head SHA and is not a persistent or live review.
- No application-level persistence or centralized rate limiting. An unauthenticated deployment can consume the operator's Claude credits. Choose the deployment audience and API spending limits accordingly; no rate-limit infrastructure is added here.
- API availability, rate limits, model support, credits and host request timeouts can prevent analysis. Reports can be wrong; verify findings and use human review.
- The application does not log PR contents or provider responses. Hosting providers, GitHub and Anthropic have their own processing/retention policies. Privacy and Terms are brief MVP notices and have not received custom legal review.

Official API references: [GitHub pull requests](https://docs.github.com/en/rest/pulls/pulls), [Claude structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
