# Startup reviewer clarity — implementation and QA

> Historical QA for an earlier revision. The [October 9 product and trust audit](product-trust-release.md) supersedes current homepage and identity descriptions. Release Engineer is an independently operated project; no legal company has been incorporated or registered.


Date: October 8, 2026. Branch: `review/startup-reviewer-clarity`.

Fetched baseline: `628d2f65affc2ad85e26fb8889e5993204c9b01b` (`main`). The worktree was clean before creating the branch. The production homepage, About, Evidence and Rails observation were inspected in Chromium before editing; all four returned HTTP 200 without application errors.

## Scope

This pass changes public copy, content hierarchy, the presentation of existing evidence and deployment revision provenance. The hero composition, Release Intelligence Reactor, report interface, approved quote records, case-study record and publication schema are preserved. Model configuration, prompts, evaluation behavior, API behavior and privacy-safe instrumentation are unchanged. No new dependencies or services were added.

Anthropic's [published Startup Program terms](https://www.anthropic.com/startup-program-official-terms), inspected on October 8, explicitly include business traction, investment/funding and Claude integration/usage among evaluation factors. The site explains the existing record; it makes no program membership, endorsement, acceptance or eligibility claim.

## Reviewer story: before → after

Before: a polished release-readiness headline, an engineering pipeline, quotes, then a small Rails observation. Intended users were implicit. Evidence introduced synthetic evaluation before external feedback.

After: a concrete input and outcome; intended users beside an explanation of Claude's reasoning role; a featured, pinned founder-run Rails observation before testimonials; and an evidence index starting with live software and public source. Company identity remains visible, and synthetic failures remain inspectable.

### 60-second reviewer scan — self-review

| Reviewer question                  | First useful entry point                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| What does it do?                   | Homepage hero: paste a public GitHub PR, receive a structured second review and human-verification next steps     |
| Who is it for?                     | “Built for teams that ship through pull requests,” explicitly labeled intended users/use cases                    |
| Why Claude?                        | “Why Claude / The reasoning layer” beside the intended-user section; production integration source linked         |
| Is it live?                        | Functional review workspace; “Open the product” in Evidence; “Try the live beta” in About                         |
| Have external developers tried it? | Three unchanged approved quotes, labeled external beta feedback with publication provenance                       |
| Is there a real public PR record?  | Hero link and featured `rails/rails #58968` observation before testimonials                                       |
| Is there engineering discipline?   | Source, CI history, coverage safeguards, dated evaluation evidence and complete failures                          |
| Are limitations honest?            | Public-only and decision-support labels; prominent founder-test label; retained coverage and artifact limitations |
| Who is the founder?                | Homepage founder strip and About: Ozan Kenan Güngör, Ankara, October 2026, early beta, domain contact             |
| Can I inspect deployed source?     | First Evidence entry: deployment SHA when available, exact commit link and public repository                      |

This is an information-hierarchy self-review, not a measured study of visitor comprehension.

## Public claim changes

- Hero: “Paste a public GitHub PR. Get a structured second review of release risks, missing tests, breaking changes and what still needs human verification.” This describes the existing product, not guaranteed detection or accuracy.
- Intended users: open-source maintainers; engineering leads; developers reviewing unfamiliar changes; small product teams without dedicated release engineering staff. Explicitly prospective audiences, not current customers.
- Intended uses: pre-merge release-risk second pass; testing-gap and breaking-change review; closer human verification; configuration, migration and operational-risk review.
- Claude: reasoning across changed files, evidence versus inference, structured findings with uncertainty and coverage boundaries. Deterministic code handles GitHub retrieval, bounded context selection, schema validation and coverage enforcement.
- Founder strip: “Real founder. Open engineering.” becomes “Founder-led. Built in public.” “Bootstrapped. No external funding raised.” becomes “Shipping a Claude-native product in early beta.” The founding month, location, name and contact remain. Funding facts remain unchanged in About/Evidence and the existing footer.
- Featured observation: one-file +1/−1 Rails documentation correction; low-risk classification, no findings, explicit limitations, pinned head and later upstream merge. Prominent “Founder test — not external validation.” Original report and exact product revision are absent from the public record; merging does not establish accuracy or Rails endorsement.
- Testimonial provenance: “Exact quotes published with permission. Display aliases are publication-approved; private identities and PR links are not disclosed.” All quote text, aliases and roles remain unchanged.
- About adds five beta questions: usefulness on real public PRs; false-positive noise; context-selection quality; usefulness of uncertainty/coverage limits; effect on what maintainers verify. These are questions, not outcomes.
- Evidence's usage heading becomes “How live usage is measured.” Existing measurement limits and absence of a verified count remain.

No new traction, user/customer counts, PR counts, revenue, funding, partnership, endorsement, accuracy or model-performance claims were added.

## Evidence ordering

1. Live product and public source, including revision provenance when available.
2. External beta feedback.
3. Pinned public PR observation.
4. Claude integration and coverage safeguards.
5. Synthetic evaluation, including 22 PASS / 10 FAIL and one critical violation in the recorded candidate; complete source metrics/failures remain linked.
6. Live usage measurement methodology.
7. Founder/company identity and boundaries.

About places product, intended users, Claude and real-world records ahead of beta participation details and evaluation. Its concrete hero summary and live-product link supplement the existing founder card. Company/funding facts, privacy of beta feedback and separate publication consent are preserved.

## Deployment provenance

`VERCEL_GIT_COMMIT_SHA` is read only in server-rendered presentation code. It must be exactly 40 hexadecimal characters; uppercase is normalized. No repository lookup or API call is needed to render the block.

- Production environment: “Current production revision.” “Deployed from main” appears only when `VERCEL_ENV=production` and `VERCEL_GIT_COMMIT_REF=main`.
- Preview environment: “Current preview revision,” with the supplied source branch; never labeled production or deployed from main.
- Unknown/local environment: “Current build revision,” with supplied branch or an explicit unavailable-branch label.
- Valid revision: show 12 characters, preserve the full SHA in the title and exact GitHub commit URL. Claude integration, coverage policy and usage methodology links on Evidence are pinned to that revision.
- Missing/invalid revision: omit the block. General source links can use `main`; `main` is never treated as a deployment SHA.

Five focused tests cover valid production metadata, preview/main distinction, absent environment/branch, missing/malformed SHA (including newline/path-like input), uppercase normalization and the Evidence integration. Test identifiers are synthetic and never public product content.

## Verification

| Required command                       | Result                                                 |
| -------------------------------------- | ------------------------------------------------------ |
| `pnpm install --frozen-lockfile`       | PASS, lockfile unchanged                               |
| `pnpm lint`                            | PASS                                                   |
| `pnpm typecheck`                       | PASS                                                   |
| `pnpm test`                            | PASS, 19 test files / 357 tests                        |
| `NEXT_TELEMETRY_DISABLED=1 pnpm build` | PASS, public pages remain statically generated         |
| `pnpm eval:validate`                   | PASS, 32 synthetic fixtures; no model called or scored |
| `git diff --check`                     | PASS                                                   |

### Browser QA

Chromium against a local production build, with every analysis endpoint request blocked. No analysis request occurred.

| Page             | 320  | 390  | 768  | 1024 | 1440 | 1920 |
| ---------------- | ---- | ---- | ---- | ---- | ---- | ---- |
| Homepage         | PASS | PASS | PASS | PASS | PASS | PASS |
| About            | PASS | PASS | PASS | PASS | PASS | PASS |
| Evidence         | PASS | PASS | PASS | PASS | PASS | PASS |
| Rails case study | PASS | PASS | PASS | PASS | PASS | PASS |
| Privacy          | PASS | PASS | PASS | PASS | PASS | PASS |
| Terms            | PASS | PASS | PASS | PASS | PASS | PASS |

Checks: HTTP 200, canonical URLs, semantic main/h1, existing internal anchors, no horizontal overflow, unchanged three quotes, visible intended-user/Claude sections, featured observation before quotes, pinned SHA/source link, founder-test labels, public-record limitations, Evidence ordering, retained synthetic failures, About funding facts and testimonial provenance.

- At 320×568, the direct analysis CTA ends at approximately 465px and moves keyboard focus to the analysis form.
- Reduced motion: no running animations or WebGL canvas; content remains visible.
- Keyboard: visible focus on the new Claude integration link; native mobile analysis anchor works.
- Forced colors: Homepage, About and Evidence at 390 and 1440, no overflow and no canvas.
- No JavaScript: all six pages at 390; public copy, quotes, source/identity and Claude explanation remain readable.
- Axe WCAG 2 A/AA and 2.1 A/AA: zero violations on the six pages at 1440.
- Existing lazy WebGL scene: desktop canvas mounts, bounded DPR, product button usable, pause/play works, reduced-motion change removes the canvas.
- Missing deployment metadata: the local production build correctly omits provenance. Valid metadata rendering and exact commit URLs are covered by the focused tests; deployment preview verification is recorded in the PR/final report.
- No application console errors or hydration errors in the completed matrix.

### Real-world source check

A read-only GitHub API check of [Rails PR #58968](https://github.com/rails/rails/pull/58968) on October 8 confirmed one changed file, +1/−1, head `08dacc7fed6bd69e864ce66e00a5616f117c6427`, merged at `2026-10-07T21:55:09Z`. This verifies public PR facts, not the original generated report or model accuracy. No new PR analysis was run.

## Four-perspective self-review

| Perspective                | Review and outcome                                                                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anthropic startup reviewer | Product, intended users, Claude, founder and real-world records have direct entry points. Funding and measurement limits remain inspectable; no acceptance/endorsement claim.                |
| Skeptical developer        | Founder testing is explicit, pinned source is linked, missing report/product revision are disclosed and the merge is not accuracy evidence. Complete synthetic failures remain visible.      |
| Product marketer           | Concrete outcome replaces vague support copy; intended audiences are explicit; founder narrative is direct; the engineering/evaluation detail follows product and real-world signals.        |
| Privacy/security reviewer  | No private testimonial identities or PR links exposed; separate consent preserved; revision metadata is public source metadata and escaped by React; no vendor, tracking or backend changes. |

## Evidence classification and limits

**Verified in this pass:** baseline SHA; live production pages at inspection time; source/content consistency; unchanged approved public quote and case-study records; GitHub Rails diff identity/outcome; offline gates; local production browser checks; correct provenance rendering/omission under tested metadata.

**Inferred / product hypotheses:** fit for the intended audiences, usefulness of the proposed use cases and improved reviewer comprehension. The five beta questions explicitly leave outcomes open.

**Not yet verified:** general real-world accuracy, bugs found, unique developers/customers, revenue, verified production usage totals, the original Rails generated report/product commit, independent identity/funding verification and production runtime of this unmerged change. Historical recorded synthetic runs were not repeated.

## Performance, accessibility and intentionally excluded scope

New content and provenance are server-rendered; no new client component, fetch loop, dependency, animation framework, texture or 3D code was introduced. Existing reduced-motion, lazy loading, mobile fallback, DPR/visibility protections and motion system remain. New sections reuse the palette and surface language and adapt to one column on small screens; full hashes wrap. Existing focus behavior, forced-color rules and no-JS public content remain.

No paid Claude calls, model/prompt/evaluator/API/report changes, benchmark optimization, new testimonials/metrics, reactor redesign, auth, billing, analytics vendors, database, blog or newsletter. The PR is intended to remain unmerged for founder review.
