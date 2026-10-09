# Claude Startups application packet

Prepared **9 October 2026**. These are reviewable English drafts, not a submitted application, an Anthropic endorsement or a claim of program eligibility. The signed-in Console form and its current field limits have not been inspected; adapt the answers to the actual questions without dropping their qualifications.

## Decision and positioning

The strongest defensible application presents an operating Claude product, its inspectable implementation and a specific plan to validate usefulness. It should acknowledge that commercial demand and repeat use remain unproven. Another visual redesign cannot supply those missing observations.

**Positioning:** a focused second review for public GitHub changes, connecting potential release risks to file evidence, coverage limits and a human verification record. The intended initial audience is maintainers and developers reviewing API contracts or behavior changes. This audience is a hypothesis to test, not an established customer segment.

### Current program constraints

The [official program FAQ](https://claude.com/programs/startups) accepts bootstrapped startups, but currently reports capacity pressure on free Team/$1,000 credit offers and re-review of applications. Membership resources and credits are separate outcomes; no award is assumed. The [official terms](https://www.anthropic.com/startup-program-official-terms) consider traction, funding and Claude integration/usage, with selection at Anthropic's discretion. [Türkiye is supported](https://www.anthropic.com/supported-countries), which does not independently establish startup eligibility. Unincorporated-founder eligibility is unresolved.

Recheck these pages immediately before applying. Use the existing application/account if one exists; first determine its status rather than creating duplicate submissions.

## Ready-to-adapt answers

### Product name, website and category

- Product: Release Engineer
- Website: https://releaseengineer.tech
- Public source: https://github.com/ozankenangungor/release-engineer
- Suggested category, if available: Developer tools / software engineering
- Operator: Ozan Kenan Güngör, Ankara, Türkiye
- Stage: self-funded early beta, launched October 2026
- Legal status: independently operated; no legal company incorporated or registered
- Funding: no external investment

The product name must not be supplied as a registered company name. Console organization ID, authorized account, legal-entity fields, prior application status and any non-public business metrics require the founder's actual information. Do not infer them from the repository or logs.

### One sentence

Release Engineer uses Claude to review public GitHub pull requests for potential release risks, with file evidence, explicit coverage limits and a human verification handoff.

### Product description

Release Engineer gives maintainers and developers a structured second review before merging a public GitHub pull request. A user submits a PR URL; the server retrieves bounded metadata and changed-file patches, selects context deterministically and asks Claude to surface potential breaking changes, regressions, security concerns and testing gaps. The report identifies file evidence, recommended checks and what was not inspected. Users can download the report with its reviewed PR head SHA and record their own assessment of each finding and the action they took. Reports support human judgment: the product does not inspect the full repository, run tests or establish that a release is safe.

### Problem and initial user

Reviewers need to connect a changed API or behavior to its release implications and the tests that would resolve uncertainty. A review can miss affected callers, while an AI finding can be difficult to act on when its evidence or scope is unclear. We are testing a focused workflow for maintainers and developers reviewing public API and behavior changes: inspect the potential concern, check the supplied evidence and preserve the decision context for another reviewer. We have not established that this workflow outperforms existing review tools, saves time or attracts paying teams. The next milestone is documented developer use on changes they can independently verify.

### How Claude is used

Claude is the core reasoning engine, called server-side through the official Anthropic TypeScript SDK. Each request supplies untrusted PR artifacts within a 60,000-byte serialized context budget, with up to 40 selected files and 8,000 bytes per patch. Structured output is validated against a strict Zod schema. Deterministic coverage enforcement adds limitations and prevents a partial-context review from receiving a final merge recommendation. A bounded output-integrity gate rejects exact finding-file references outside visible patches and selected explicit unsupported execution/access claims. It is an additional constraint, not a complete prompt-injection defense. The API key remains server-only; the application has no autonomous code execution or repository write capability.

The checked-in model default is `claude-sonnet-5-5`, with a server-only configuration override. The served model for a particular production response is not exposed in the public API and must not be inferred from the browser. Historical evaluations record their actual requested/served model separately.

### Why Claude

This workflow needs reasoning across code changes, risk categories, evidence and uncertainty, together with structured output the application can validate. Claude is already integrated into the live product through Anthropic's SDK, rather than appearing only in a roadmap or marketing page. We use a shared review path for application and evaluation and retain coverage constraints independently of model wording. We are seeking technical guidance on evidence grounding and adversarial task retention, not claiming that our model choice has been proved superior by a comparative benchmark.

### Current progress and traction

The public early beta is deployed and the implementation is inspectable. Published evidence includes three founder-supplied, publication-approved qualitative external feedback quotes and one clearly labeled founder-run observation on Rails PR #58968. The Rails change was a one-file documentation correction; it does not validate detection of a material release risk. We have no established unique-user, customer, revenue, retention or independently verified useful-finding metric to report from the available records. The new local verification workflow is intended to gather more specific observations with permission and pinned PR evidence. It has not itself created a completed external pilot.

### Evaluation and limitations

We maintain 32 original synthetic PR cases and a deterministic evaluation harness. The latest published complete Claude run, dated 7 October 2026, recorded 22 PASS and 10 FAIL with one critical unsupported-test-claim flag. A previous run recorded 0 PASS and 32 FAIL with seven critical flags; the comparison also reported regressions. These are historical synthetic observations, not real-world accuracy or external validation. The artifacts do not contain original review text for independent adjudication of the remaining critical flag. We added narrowly scoped deterministic rejection checks and offline regression tests, but have not run a new live evaluation or claimed that the historical failure is resolved. Human review and real tests remain necessary.

### Differentiation and business hypothesis

Our current scope is an installation-free public-PR review with explicit context bounds, a release-oriented report and a portable human verification handoff. It trades repository-wide context and workflow automation for a simple way to try a second review. That tradeoff can miss cross-file risks; it is not a claim of better detection. We are testing whether maintainers value a consistent contract-risk and follow-through workflow enough to use it repeatedly. Team collaboration or repository integration could become a paid offering after that is demonstrated. There is no billing implementation, validated pricing or established commercial moat today.

### What program support would enable

We would use Applied AI guidance to improve grounding, uncertainty handling and resistance to adversarial PR text. A small, consented pilot would connect reports to human checks and actual follow-through. If credits are available, we would use them for explicitly budgeted, reproducible evaluation and pilot analyses through the first-party Claude API, preserving failures as well as useful findings. Program membership would also provide founder feedback on the initial user problem and route to repeat use. We understand that membership, resource access and credits may have different availability and that none is guaranteed.

### Founder statement

I am Ozan Kenan Güngör, an independent founder in Ankara, Türkiye. I built and operate Release Engineer, a self-funded early-beta developer tool launched in October 2026. Claude powers its PR reasoning through a real server-side integration. I have focused on bounded retrieval, validated reports and honest limitations, while making the implementation and dated evaluation failures inspectable. My next challenge is validating whether developers act on the reports and return for another review. I am seeking technical and founder support to improve that validation loop. The project is not incorporated, and I will provide any account or legal information required to establish eligibility accurately.

## Reviewer path: approximately three minutes

1. Open the [product](https://releaseengineer.tech). The public PR input is functional; submitting it initiates paid inference funded by the operator. A fresh analysis is unnecessary to inspect the illustrative workspace.
2. Open the illustrative report and select its changed line, evidence and next steps. It is authored demonstration content, explicitly not a live analysis.
3. Read [how to verify a beta report](https://releaseengineer.tech/pilot) and download the blank worksheet. Local exports require an actual returned report; an offline browser fixture is only software verification.
4. Inspect the [evidence index](https://releaseengineer.tech/evidence), [Rails observation](https://releaseengineer.tech/case-studies/rails-doc-typo-58968) and [historical evaluation record](live-evaluation-evidence.md).
5. Inspect the [SDK integration](../src/lib/claude.ts), [context builder](../src/lib/context.ts), [strict schema](../src/lib/review-schema.ts), [integrity gate](../src/lib/review-integrity.ts) and [pilot runbook](pilot-validation.md).

## Claim-to-source map

| Defensible statement | Source | Necessary qualification |
| --- | --- | --- |
| Public beta exists | Website and production deployment; release QA | Availability is not traction or live model-quality proof |
| Claude is integrated | `src/lib/claude.ts`, SDK dependency, recorded workflows | Do not infer served model from the frontend revision |
| Context is bounded | `src/lib/context.ts`, unit tests | Byte budget, not a promise of complete repository coverage |
| Output is strictly validated | `src/lib/review-schema.ts`, SDK/output tests | Valid shape does not establish correct reasoning |
| Qualitative external feedback exists | `src/content/testimonials.ts` and private consent records | Three quotes are not three verified unique users or customers |
| One real PR observation is published | `src/content/case-studies.ts` | Founder-run, docs-only, original report/product SHA unavailable |
| Synthetic model runs were completed | Source Actions runs and artifact hashes in historical evaluation document | Latest 22/10, one critical flag; no current accuracy claim |
| Verification exports are implemented | `src/components/review-handoff.tsx`, browser download tests | User-recorded data, not independent adjudication or a completed pilot |
| Source is publicly inspectable | Public repository | No OSI license is present; do not describe it as licensed open source |
| Funding/legal identity is disclosed | About, Privacy, Terms, README | Self-funded and unincorporated; no invented legal entity |

## Prepared correspondence — drafts only

### Eligibility question

Subject: Claude Startups eligibility — independently operated early-beta product in Türkiye

Hello Claude Startups team,

I independently build and operate Release Engineer (https://releaseengineer.tech), a self-funded developer tool using the Claude API to review public GitHub pull requests. I am based in Ankara, Türkiye, and no legal company has been incorporated or registered. The product and source are live, with dated evaluation evidence and clearly disclosed limitations.

Can an independently operated, unincorporated project apply under the current program, and how should the applicant/legal-entity and Console organization fields be completed? I understand that current program benefits and credits have capacity constraints and that eligibility is determined by Anthropic.

Thank you,
Ozan Kenan Güngör

Use an official contact path available in the founder's account; no support address or private recipient is guessed. This message has not been sent.

### Update to an existing application, if updates are permitted

Release Engineer now supports pinned report downloads and local human-verification records, with a public beta guide at https://releaseengineer.tech/pilot. Its implementation remains publicly inspectable. The aim is to gather specific developer observations about evidence, false positives, missing context and actions taken. No new external pilot results or revenue metrics are claimed. We also added narrowly scoped output-integrity checks and offline tests; the published 7 October synthetic result remains 22 PASS / 10 FAIL with one critical flag, and no new live evaluation has been performed. Please attach this update to my existing application if your current workflow permits it.

## Submission dependencies

The founder needs to establish the correct signed-in Console organization, existing application status, required legal identity and authority to accept the terms. No credentials, terms acceptance, company registration, correspondence or application submission is performed by preparing this packet. Do not add a selection badge or claim an Anthropic partnership unless it actually occurs.
