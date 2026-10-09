# Product and trust release audit — October 9, 2026

## Baseline and scope

Main and successful GitHub/Vercel Production deployment both identified `9c498db13c89ce50249a779b59dc1a5855d1a3e1`. Clean tree; feature branch `feat/product-trust-review`. Existing PRs use squash merges. Local Node 26.10.0 / pnpm 12.9.1; CI uses Node 24. Frozen install, lint, typecheck, 357 tests, build, 32 offline evaluation fixtures and diff whitespace checks passed before edits. No Claude requests authorized or made.

Inspected production and the local optimized build in real Chromium at 1440×900, 1920×1080, 1366×768, 768×1024, 390×844 and 360×800. BEFORE screenshots and measured browser observations are stored outside Git in `../release-audit-artifacts/before/`. Unthrottled single navigations on this machine are lab observations, not field Web Vitals or Lighthouse scores.

## Findings

| Priority | Finding | Release disposition |
| --- | --- | --- |
| P1 | Home explicitly says independent product company; About says the company; JSON-LD connects an Organization, foundingDate and worksFor, contrary to the founder's unincorporated status. | Correct public copy, operator notices, README and schema relationships; test consistency. Organization alone does not imply incorporation, but the combined presentation is misleading here. |
| P1 | Analyzer begins at y=494 on 1366×768, with submit bottom at y=882. Submit is also below the first viewport on both phone sizes (849 and 889). Dramatic headline and pipeline sculpture compete with functionality. | Compact concrete hero, visible form and direct report preview. |
| P1 | No report is inspectable without an explicit paid request; Rails observation has no retained report and is a documentation correction with no findings. | Add a clearly labeled authored illustrative preview; retain the real observation's limits. |
| P1 | Non-JSON platform errors expose a JSON parsing exception; service failures incorrectly mark the PR input invalid. | Separate validation errors from service errors, safe fallback messages and keyboard/screen-reader recovery. |
| P1 | Unauthenticated endpoint has no application admission bound. Platform rate protection and provider spending limits are unverified. | Add bounded per-instance admission and browser origin checks with upstream-call regression tests. Distributed protection remains an operator limitation; no account settings changed. |
| P2 | Tiny navigation/metadata and hidden mobile header links; 24px example button. | Readable controls, 44px primary targets and mobile About/Evidence navigation. |
| P2 | Automatic desktop WebGL activation loads additional JS and occupies the first viewport. Existing mobile/reduced-motion/failure/offscreen guards are good. | Keep the visual below the tool; require explicit animation activation. Preserve guards. |
| P2 | Dominant generic pseudonymous quotes add little evidence of report quality. | Move the exact approved quotes to Evidence, preserve consent and provenance. |
| P2 | Child route Twitter metadata inherits homepage title/description in case studies. | Explicit descriptions and social metadata; browser checks. |

No confirmed P0 found. Security strengths to preserve: server-only credentials, fixed GitHub hosts with manual redirects, private-repository rejection, bounded request/response/context sizes, retrieval consistency check, prompt isolation, strict report schema, partial-context verdict policy, safe logs and offline evaluation gates. Reports already include empty-findings caveats and explicit limitations. Historical synthetic evaluation failures and founder-run provenance are candid and must remain visible.

## Independent first impression

The baseline names public PR input and structured review in supporting copy, but its largest text does not explain Claude or the input/output. The form is partly visible on desktop, with the actionable button below the fold on laptop and phones. The CTA works directly and the example only prefills; neither requires signup. There is no free output preview. The scene is conceptual, correctly disclaims live telemetry, and is visually dominant. Branding suggests a company that the founder has not registered. Integration can be verified through public source links. Claims about synthetic evaluations are supported by dated records with failures disclosed; feedback comes from founder-supplied approved records, not independently verified identities. The Rails case establishes a reported workflow, not bug detection or maintainer influence. Example failures currently share generic form errors. No baseline page errors or overflow appeared at the six sizes.

Confirmed defects are distinguished from design judgments above. No causal claim about the Claude Startups rejection is established. Program acceptance is outside release criteria.

## Validation and final review

All required local gates passed after implementation: frozen install, lint, typecheck, **369 tests in 21 files**, build, 32 offline evaluation fixtures and diff whitespace checks. **19 Chromium browser checks** passed, including six viewport sizes; desktop/mobile public routes; invalid URLs; example prefill without submission; non-JSON 429/502/504 responses; network failure; timeout without retry; rejected invalid report; validated stubbed partial report; keyboard operation; reduced motion; WebGL-unavailable fallback; JavaScript-disabled content; canonical/Open Graph/Twitter metadata; robots/sitemap/social image; internal links and fragments. Axe found zero WCAG A/AA violations in the scanned pages and stubbed report. This does not establish complete accessibility compliance or replace assistive-technology testing.

The supported optional WebGL scene was also manually activated in Chromium: one canvas, `data-scene=webgl`, no page or console errors, and the pause control stopped motion. Initial navigation has no canvas, even on desktop. The real example only fills the field; the user must choose Analyze PR. Service failures preserve the URL and explain recovery. The generated report receives keyboard focus in a named region.

The complete source diff and a credential-pattern scan were inspected. Only `.env.example` is tracked; no real environment files or credentials were added. Claude prompts, model configuration, review schema/policy, GitHub retrieval, evaluation rules, published testimonial records, case-study records and historical evaluation/usage documents have no diff. The small Playwright/axe dependencies are development tools; runtime dependencies are unchanged. Obsolete hero/company decoration CSS was removed.

The Rails PR was rechecked via GitHub: the published reviewed SHA matches, one file, +1/-1, merged October 7. The historical complete workflows still identify the documented commits and both concluded failure. This review did not re-adjudicate absent original report text or run a paid evaluation.

Mocked reports only exercise UI behavior; they never establish successful live inference or model accuracy. No paid evaluations or production environment mutations were made. CI and production commit verification are separate release gates; final deployment facts are recorded in the delivery handoff.


## Measured before/after observations

Optimized local builds in the same Chromium installation, unthrottled single navigation per viewport, captured after network idle plus 1.5 seconds. Encoded JavaScript resource bytes include lazy scene downloads observed during that window. Each navigation uses a new browser context. They are lab measurements, not device-independent performance estimates or field Web Vitals. Development screenshots were also captured at all six sizes from the original revision in an isolated worktree and from this branch; compilation overhead makes development LCP unsuitable for release comparisons.

| Viewport | Submit bottom before → after (px) | Local LCP before → after (ms) | CLS before → after |
| --- | --- | --- | --- |
| 1440×900 | 882 → 497 | 316 → 216 | 0 → 0 |
| 1920×1080 | 919 → 497 | 264 → 180 | 0 → 0 |
| 1366×768 | 882 → 497 | 196 → 160 | 0 → 0 |
| 768×1024 | 800 → 836 | 212 → 164 | 0 → 0 |
| 390×844 | 849 → 727 | 192 → 156 | 0 → 0 |
| 360×800 | 889 → 717 | 240 → 136 | 0 → 0 |

Initial encoded JS on desktop: **421,725 → 180,657 bytes** in the local optimized builds (about 57% less). Mobile: **180,529 → 180,657 bytes**, essentially unchanged. No overflow, failed requests, page errors or attempted analysis submissions occurred in these measurement captures. The report is now directly inspectable from the first viewport without a provider request. On mobile it follows the analyzer; the primary submit fits in every requested viewport. Tablet submit moves from y=800 to y=836 and remains within the 1024px viewport.

No Lighthouse score, field INP, physical-device GPU utilization, battery measurement or statistical LCP improvement is claimed. Optional GPU work now requires an explicit action.

## Adversarial review and remaining limitations

The public interface and metadata now explain the product, identify the individual operator, show limitations and disclose the provenance of each evidence type. No confirmed P0 or unresolved release-specific P1 was found after corrections. The visual hierarchy is a design judgment; form visibility, prefill behavior, metadata consistency and failure handling are directly tested. Historical review quality remains limited: 10 synthetic failures and a critical violation are still disclosed, not treated as fixed by UI tests. Schema validity cannot prove model correctness.

Per-instance admission bounds limit local concurrency and starts, but **do not cap aggregate serverless spending**. Platform-wide protection, provider spending limits, hosting log retention and production environment configuration were not verified through account settings. No settings were changed. Origin checks prevent cross-site browser submissions and do not authenticate arbitrary scripts. This remains an operational limitation of the public beta.

The Rails observation has no retained original report or exact product commit and establishes no meaningful bug detection or maintainer influence. Approved pseudonymous feedback is founder-supplied; identity, email delivery, legal interpretation, independent customer adoption and real-world accuracy are not independently established. Privacy/Terms remain factual beta notices requiring jurisdiction-specific legal review as the project develops. Physical mobile Safari and real screen-reader hardware were not tested. No claim about Google indexing or Claude Startups acceptance follows from this release.

Next independent review should inspect the deployed evidence revision and integration source, confirm account-level spending/protection settings, and plan a budgeted, pinned public-PR evaluation with retained reports and human adjudication. Preserve historical evaluation artifacts privately before retention expiry.
