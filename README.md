# Release Engineer

Release Engineer is a Claude-native release-readiness review tool for public GitHub pull requests.

Live product: [releaseengineer.tech](https://releaseengineer.tech)

Reports support human release decisions. They do not guarantee safe code or replace review and testing. An empty findings list is a valid result.

## Project and operator

Release Engineer is an independent, founder-built developer tool launched in **October 2026** in **Ankara, Türkiye**, built and operated by **Ozan Kenan Güngör**. It is a self-funded **early beta** with no external investment. **No legal company has been incorporated or registered.** See the [About page](https://releaseengineer.tech/about) and the founder's [GitHub](https://github.com/ozankenangungor) and [LinkedIn](https://linkedin.com/in/ozan-kenan-gungor) profiles.

## What it does

Paste a public GitHub pull-request URL. The server retrieves bounded PR metadata and changed-file patches, selects context within explicit byte limits, and asks Claude for a structured review of regressions, correctness risks, testing gaps, breaking changes, security concerns and visible dependency, configuration and operational risks. The report includes findings, recommended actions and coverage limitations.

## Claude integration

Claude is the core reasoning engine. The server uses the official Anthropic TypeScript SDK with structured output, validates the response against a strict Zod schema, then enforces coverage limitations. An incomplete context cannot receive a final `merge` recommendation. The production prompt and model configuration live in [src/lib/prompt.ts](src/lib/prompt.ts) and [src/lib/config.ts](src/lib/config.ts); evaluation uses the same review engine.

## Early beta evidence

The early beta is available for testing on public GitHub pull requests. [Try the beta](https://releaseengineer.tech/about#beta): analyze a public PR, then email [founder@releaseengineer.tech](mailto:founder@releaseengineer.tech) with what was useful, wrong or missing. Do not send private code, secrets or sensitive vulnerability details. Three exact, founder-supplied, publication-approved external beta quotes appear on the Evidence page, rendered from [the public feedback content](src/content/testimonials.ts), using approved display names and roles. No tester PR links were approved. This is informal qualitative feedback, not accuracy, verified findings or a unique developer/customer count. Consent records remain private. Use the [private feedback workflow](docs/beta-feedback-template.md).

The [evidence index](https://releaseengineer.tech/evidence) links source, limitations and dated evaluations. One [founder-run public PR observation](https://releaseengineer.tech/case-studies/rails-doc-typo-58968) is published for Rails PR #58968 with its reviewed head SHA, public verification sources, upstream outcome and explicit limitations. It is labeled founder testing, not external validation. No verified production analysis count is published. [Case-study content](src/content/case-studies.ts) continues to fail closed for incomplete records.

The [evaluation harness](evals/README.md) contains **32 original synthetic PR cases**. Two manually dispatched complete 32-case synthetic runs used the production Claude review path. In the latest recorded run (October 7, 2026), 32/32 cases completed with 0 infrastructure errors. [Full metrics, failures and regressions](docs/live-evaluation-evidence.md) are transparently documented with source runs and limitations. **Synthetic evaluation is not real-world accuracy, traction or external validation.**

## MVP scope

An editorial RELEASE / SIGNAL homepage, cinematic Release Graph, interactive illustrative diff-to-finding workspace and real analysis interface, public PR retrieval, bounded change context, validated Claude reviews, About and Evidence pages, and brief [Privacy](https://releaseengineer.tech/privacy) and [Terms](https://releaseengineer.tech/terms) pages. There are no accounts, database, OAuth, billing, queues, analytics or telemetry vendors. PR contents and reports are held in memory for the request and browser session. Content-free operational events are written to hosting logs; [the usage evidence runbook](docs/live-usage-evidence.md) explains retention, private preservation, deduplication and the distinction between analyses and people. No public usage counter is displayed.

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
- `src/components/three/`: procedural Release Graph in the desktop hero, enhanced automatically after initial paint and a device/WebGL capability check. A server-rendered SVG of the same source/dependency topology is immediate. The renderer is lazy loaded; DPR is capped at 1.5, with a bounded demand clock at 30fps that adapts to DPR 1/20fps on slow frames. It pauses when offscreen, the document is hidden or the user pauses motion. Mobile, constrained devices, reduced motion, forced colors and unavailable WebGL retain the static composition. Context loss preserves the fallback and offers a renderer retry. The graph is conceptual, not live analysis telemetry. Product copy, form and example remain independent of WebGL.
- `src/lib/live-usage.ts`: allowlisted, content-free operational events; no browser/session identity or PR content. `scripts/summarize-live-usage.mjs` counts preserved, sanitized production outcomes without network calls.

Built with Next.js 16.4 App Router, React 19, strict TypeScript, Tailwind CSS, Zod and Vitest. All GitHub and Anthropic requests happen on the server. `server-only` imports guard credential-bearing modules.

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
pnpm eval:validate
pnpm exec playwright install chromium
pnpm test:browser
git diff --check
```

`pnpm test:watch` runs Vitest interactively. Tests cover safe URL parsing, exact serialized context budgets and Unicode, deterministic selection, structured result validation, GitHub pagination/visibility/errors, official SDK request/response handling, injection separation, partial-verdict enforcement and endpoint failures. Upstream services are mocked; tests never consume API credits. CI runs these checks on pull requests and main, with Chromium and axe accessibility checks. Browser tests intercept all analysis requests, even when PLAYWRIGHT_BASE_URL targets production; mocked responses are not live inference.

For a production preview, run `pnpm build` then `pnpm start`. Deploy to a Node.js host that permits a 120-second route and set the server environment variables. No hosting infrastructure is included in this MVP.

## Evaluation

The [evaluation harness](evals/README.md) includes 32 versioned, original synthetic PR cases, evidence-based rubrics, separate risk-recall/false-positive/safety metrics and compatible baseline comparisons. `pnpm test` tests the evaluator offline; `pnpm eval:validate` validates fixtures against the real context builder without a key or network. These checks are not a Claude quality baseline.

`pnpm eval:live` is separate and fails closed unless `EVAL_LIVE=1` and `ANTHROPIC_API_KEY` are explicitly supplied in the process environment. It defaults to one small case with a three-case cap, uses the production review engine without automatic retries, and writes ignored local artifacts. Pull-request/push CI is offline. The separate [live workflow](.github/workflows/live-eval.yml) runs only when manually dispatched on main with a configured repository secret and an explicitly selected scope. Neither path automatically loads environment files. See the evaluation documentation for spend caps, comparison commands, dataset versioning and grading limitations.

The [review evidence runbook](docs/review-readiness.md) explains reproducible offline checks and evidence handling. The [real-world evaluation plan](docs/evaluation-real-world-plan.md) describes how pinned public PR cases could be admitted using defensible labels; no such dataset or results are included yet. The [case-study workflow](docs/public-pr-case-study-template.md) and [private evidence checklist](docs/product-evidence-checklist.md) help prepare human-adjudicated evidence without inventing completed records.

## Reporting security issues

Report suspected vulnerabilities privately to [founder@releaseengineer.tech](mailto:founder@releaseengineer.tech). See [SECURITY.md](SECURITY.md) for scope, responsible disclosure and third-party boundaries. Do not include secrets or personal data in public issues or pull requests.

## Deployment safety

The analysis endpoint is unauthenticated and each analysis can consume the operator's Claude credits. Before broad public exposure, configure:

- Hosting/platform request protection or rate limiting for `/api/analyze`.
- Anthropic organization spending limits.
- Appropriate deployment access controls during the early beta.

These protections must be configured outside the application. The endpoint rejects cross-origin browser submissions and bounds each warm server instance to two concurrent analyses and six starts per rolling minute. This does not include authentication or distributed rate limiting; serverless instances have independent budgets. Platform protection and provider spending limits remain necessary.

## Current limitations

- Public GitHub pull requests only. No GitHub Enterprise or arbitrary remote fetches.
- Claude sees selected PR metadata and exposed patches, not the full repository, unchanged code, PR comments, linked issues, CI output or runtime behavior. GitHub can omit binary or large patches. GitHub's files endpoint itself has a 3,000-file ceiling; this application stops at 500.
- Size caps mean large PRs are analyzed in part; lockfiles have low priority and dependency risk may be missed. Coverage warnings describe what was omitted.
- A PR can change after retrieval. The report displays the retrieved head SHA and is not a persistent or live review.
- No application-level persistence or centralized rate limiting. An unauthenticated deployment can consume the operator's Claude credits. Choose the deployment audience and API spending limits accordingly; the per-instance admission bound does not provide a global spending cap.
- API availability, rate limits, model support, credits and host request timeouts can prevent analysis. Reports can be wrong; verify findings and use human review.
- The application does not log PR contents or provider responses. Hosting providers, GitHub and Anthropic have their own processing/retention policies. Privacy and Terms are brief MVP notices and have not received custom legal review.

Official API references: [GitHub pull requests](https://docs.github.com/en/rest/pulls/pulls), [Claude structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).

## Contact

Contact [founder@releaseengineer.tech](mailto:founder@releaseengineer.tech). Source code and issues are available in the [public GitHub repository](https://github.com/ozankenangungor/release-engineer).

## RELEASE / SIGNAL design and verification

The visual system and component architecture are documented in [the design direction](docs/release-signal-design.md), with [six visual comparisons and verification evidence](docs/release-signal-qa.md). `scripts/visual-audit.mjs` captures all six required viewports, full pages, document routes, mobile navigation and a stubbed error, with raw lab observations for LCP, CLS and initial/deferred JavaScript. It intercepts analysis requests before navigation; no paid Claude call is made. The WebGL browser fixture allows software GL in CI while production capability checks stay intact. Browser coverage includes source-to-finding interaction, keyboard tabs, real renderer movement/pause, offscreen suspension, context loss/retry and reduced motion.
