# Immersive beta sprint verification

Observed October 8, 2026. Baseline: `6a5e80e4d1667f5569b9d747d07977ae07086cd8` (current main at sprint start). These are implementation/QA observations, not traction or a new Claude evaluation. No paid provider call was made. Browser reports used explicitly synthetic, intercepted API responses outside the repository; they are not product-use case studies.

## Local verification

All required gates passed: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (351 tests, 18 files), `NEXT_TELEMETRY_DISABLED=1 pnpm build`, `pnpm eval:validate` (32 synthetic fixtures; no model call), `git diff --check`. `pnpm audit --prod` reported no known vulnerabilities. CI now also validates evaluation fixtures and checks diff whitespace.

The build prerenders homepage, About, Evidence, Privacy, Terms and the generated OpenGraph image. Case routes return 404 with no records and are absent from the sitemap/navigation. Supported future case slugs use `generateStaticParams` from typed content. Form HTML, CTA, headings, founder identity, evidence links and approved quotes are present without JavaScript.

## Browser matrix

Production `next start`, Playwright Chromium, actual WebGL rendering using headless SwiftShader. No real `/api/analyze` request was sent by browser tests. API interactions were intercepted with synthetic responses.

| Check | 320 | 390 | 768 | 1024 | 1440 | 1920 |
| --- | --- | --- | --- | --- | --- | --- |
| Home, About, Evidence, Privacy, Terms | Pass | Pass | Pass | Pass | Pass | Pass |
| No horizontal overflow; canonical/anchors | Pass | Pass | Pass | Pass | Pass | Pass |
| Long findings, file paths and branch names | Pass | Pass | Pass | Pass | Pass | Pass |
| No canvas at mobile/tablet widths | Pass | Pass | Pass | — | — | — |

Also checked: invalid URL, loading/disabled input, error/retry, rejected malformed report, completed full and partial context, empty findings, escaped HTML-like model text, full reviewed head SHA, visible limitations and result focus. A direct mobile analysis link stays in the first screen even at 320×568; it uses a native anchor to the form. Mobile console spacing is tighter and the static illustration follows the form. Three exact feedback records render with no tester PR links.

Additional Firefox checks passed at 390/1440 on all five public pages, with WebGL at desktop. WebKit was unavailable locally (browser binary missing), so Safari rendering is not asserted.

## Accessibility and failure modes

- Axe WCAG 2/2.1 A/AA rules: zero detected violations on five public pages and a rendered partial-context report fixture. This is an automated check, not a complete accessibility certification.
- Keyboard skip link, input, CTA and links remain reachable with visible focus. A completed report receives focus after React commits it.
- Reduced motion: no canvas or decorative animation. Forced colors: no canvas; form/CTA remain usable with system colors.
- JavaScript disabled: all five public pages render; quotes, identity and evidence remain visible. Homepage explains that analysis submission requires JavaScript.
- WebGL unavailable: premium static illustration; usable form. Simulated context loss: canvas unmounts and static fallback becomes visible.
- Offscreen rendering stops. A fresh 390px / DPR 3 visit requested no scene chunk and instantiated no canvas.
- No application console errors, uncaught page errors or hydration warnings in the successful Chromium matrix. Expected mocked HTTP 429 and intentional case-page 404 messages were classified separately. SwiftShader screenshot readback warnings and the simulated context-loss disposal warning were observed; no hardware GPU performance is inferred from them.

## Bundle and rendering measurements

Method: build current main and the sprint with the same local Node/pnpm toolchain; sum JavaScript bytes for chunks referenced by initial homepage SSR HTML, and gzip each file with Node `gzipSync`. These are build-size comparisons, not transferred bytes or Lighthouse scores. Route-wide totals include other pages.

| JavaScript measure | Baseline | Sprint | Difference |
| --- | ---: | ---: | ---: |
| Initial homepage raw bytes | 695,330 | 707,324 | +11,994 |
| Initial homepage gzip bytes | 214,131 | 218,711 | +4,580 |
| All build chunks, raw bytes | 709,156 | 1,601,828 | +892,672 |
| All build chunks, gzip bytes | 217,656 | 459,124 | +241,468 |

The separate scene/renderer chunk is 894,504 raw / 240,413 gzip bytes. It is absent from initial SSR script references and loaded only on eligible visible desktop screens after a 650ms deferral. The locally served variable Inter subset adds 48,256 font bytes with `display: swap`; there is no runtime Google Fonts request. No Drei, postprocessing library, texture downloads, shadow maps or external 3D CDN were added.

Chromium draw-call instrumentation observed at most **47 draws / 1,766 triangles per frame**. Desktop DPR is capped at 1.5 (DPR 1 observed at the 790×445 CSS-pixel test canvas); there is no continuous idle renderer. The five-second pipeline entrance targets at most 30 scheduled frames/second, then settles; pointer motion invalidates the demand renderer. Draw counts stopped across sampled idle and offscreen intervals. The form was enabled before the scene became ready. Local cached LCP entries were observed, but they are not a calibrated production or device measurement; no Lighthouse score or production LCP claim is made.

Three.js is pinned to `0.182.0`, the supported release preceding the Clock deprecation used by the current Fiber renderer. Fiber `9.8.1` is pinned; `@types/three` matches `0.182.0`. Production audit passed for these versions. Renderer failures have no effect on analysis semantics.

## Evidence, identity and privacy review

- Founder/company fields agree across homepage, About, README, JSON-LD, metadata, public profiles linked by the founder, contact, Security, Privacy and Terms. Page canonical/OpenGraph URLs are explicit; page social titles and a 1200×630 branded card are provided. Existing icon/logo and Google verification token are preserved.
- JSON-LD contains connected Organization, Person, WebSite and SoftwareApplication nodes with stable IDs. No legal entity, incorporation, ratings, customer logos or funding amount is asserted.
- Exact public feedback aliases/roles/quotes match founder-supplied approvals. Consent, tester identities, emails, raw feedback, PR references and reported actions are not published as case evidence.
- No public case study exists: PR URLs, reviewed SHAs, human checks and permission were blank. Typed publishing gates and no-record 404s are tested.
- Usage events use an explicit operational field allowlist and a random per-attempt ID; no personal/session/PR identity, content or secrets. Unknown errors are normalized. Tests cover endpoint success only after validation, failed validation, rejected input, event terminal deduplication, redaction boundaries and aggregate export validation.
- Searches for traction/accuracy language were reviewed. Legitimate evaluator metric names, synthetic fixtures, schema-validation language and explicit evidence limitations were retained. No unsupported social-proof or usage counter was introduced.

Founder-provided funding/location/founding facts and publication permission were not independently re-established. Email delivery, LinkedIn ownership/access, Vercel log retention/export capability, actual production operational counts and hardware GPU performance remain outside local QA. Existing historical synthetic workflow SHAs/conclusions were checked read-only; both complete workflows concluded failure, consistent with the published evaluator limitations.

## Four-persona self-review

| Reviewer | Finding / resolution |
| --- | --- |
| Anthropic startup reviewer | Real product and founder are visible, Claude is central, approved qualitative feedback is published, and missing case/usage evidence is explicit. No traction inferred from synthetic evaluations. |
| Senior frontend engineer | Actual lazy WebGL, bounded geometry/DPR, demand rendering, renderer failure isolation, static/mobile fallback and production-browser checks. Replaced emoji arrows and the initial jewel-like core with an integrated engineering module. |
| Skeptical developer | Inspectable source, dated failures, pinned head SHA in reports, no invented case study or count. The new usage-runbook link pins the Vercel deployment commit when available, so it remains inspectable before merge; local builds fall back to main. |
| Privacy/security reviewer | No private tester data or provider output committed; explicit event allowlist and strict private-export aggregation. Hosting retention is a founder account action, not a durable-count claim. |

Remote CI/deployment outcomes and final PR-head verification are recorded in the PR, because they occur after this document's commit. A successful protected Vercel build is not proof of authenticated runtime inspection.
