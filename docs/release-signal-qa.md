# RELEASE / SIGNAL — visual and release verification

Date: October 9, 2026. The design direction is in [release-signal-design.md](release-signal-design.md).

## Baseline and scope

Local HEAD, fetched GitHub main and Vercel's READY production deployment were all `52384face5a5edffec7d6e05104a7216dabe1e7b` before editing. Baseline deployment: `https://release-engineer-id0v3psak-ozankenangungors-projects.vercel.app` (`dpl_A6aTk81tCL8zMxGkh1fBTnTsZxcP`), project `release-engineer`; the custom domain was an alias of that deployment. Work uses `feat/cinematic-enterprise-redesign`.

The frontend, authored example, navigation, visual system, public-document presentation, logo and social image change. There are **no changes to `src/lib/`, `src/app/api/`, package dependencies, lockfile, evaluation dataset, publication-approved feedback or case-study records**. Production credentials are not read or modified. The request parser, response schema, timeout, single-attempt behavior and operational errors remain in the real form.

## Structural design review

The six comparisons below show a new composition: oversized ink/cobalt typography on a light editorial foundation; a compact real analyzer underneath the copy; an immediately visible dark Release Graph; one cohesive source-to-finding software workspace; a vertical process sequence; and a ruled engineering evidence ledger. The old full-page navy background, right-hand form card, purple gradient actions, card-grid narrative and collapsed 3D section are removed.

Reviewed as a skeptical design pass, including full-page captures and actual browser views. Corrections made before release: text arrows replaced emoji rendering; the floor grid was subdued; tablet graph labels and geometry were separated from the heading; mobile graph labels were simplified; technical label/link contrast was corrected after axe failures; and the authored diff title was aligned with its actual response-shape change. No independent external reviewer or customer validation is claimed.

| Viewport | Before / after comparison |
| --- | --- |
| 1920 × 1080 | [Comparison](release-signal/comparison-1920x1080.jpg) |
| 1440 × 900 | [Comparison](release-signal/comparison-1440x900.jpg) |
| 1366 × 768 | [Comparison](release-signal/comparison-1366x768.jpg) |
| 768 × 1024 | [Comparison](release-signal/comparison-768x1024.jpg) |
| 390 × 844 | [Comparison](release-signal/comparison-390x844.jpg) |
| 360 × 800 | [Comparison](release-signal/comparison-360x800.jpg) |

Additional rendered views: [workspace](release-signal/workspace-1440.jpg), [full mobile narrative](release-signal/full-390x844.jpg), [About](release-signal/about-1440.jpg), [Evidence](release-signal/evidence-390.jpg), [mobile menu](release-signal/mobile-menu.jpg), [stubbed error](release-signal/error-390.jpg). Full-resolution PNGs, Privacy/Terms/case-study screenshots, a schema-valid report fixture and reduced-motion captures are preserved in the delivery artifact directory outside the source checkout.

## Local gates

- `pnpm install --frozen-lockfile`: passed; dependencies and lockfile unchanged.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: **369 passed / 21 files**.
- `pnpm build`: passed; all public pages and social image generated successfully; analysis route remains dynamic.
- `pnpm eval:validate`: **32 original synthetic fixtures validated**; no model called or scored.
- `pnpm test:browser`: **24 passed**, including all six viewport gates, axe WCAG 2 A/AA and 2.1 AA checks, public routes and metadata, report focus/partial warnings, validation, network/non-JSON errors, timeout without retry, keyboard navigation and JavaScript-disabled content.
- `git diff --check`: passed.

The new browser coverage exercises changed-line selection, keyboard navigation between Risk/Evidence/Next steps, mobile menu dismissal/navigation, real WebGL pixel changes, pointer movement, pause with identical subsequent canvas captures, offscreen suspension/resume, reduced motion, real `WEBGL_lose_context` loss and recovery, and constrained/forced-colors fallback. CI's dedicated capable-desktop fixture allows software GL and supplies eligible device capability values. **Normal browser visual captures do not override production capability checks** and rendered WebGL automatically on all three desktop viewports.

Every browser analysis request is intercepted before navigation. The authored workspace never sends a request. Example prefill never submits. Schema-valid report and error fixtures are clearly labeled; none is a new live Claude result.

## Measured lab observations

One unthrottled desktop Chromium run per viewport against current production before editing, and one against the optimized local build after editing. Same installed browser executable. Raw observations: [before](release-signal/before-measurements.json), [after](release-signal/after-measurements.json). JavaScript sizes are encoded resource body bytes, not source size. The graph request performance mark distinguishes initial scripts from deferred renderer scripts.

| Viewport | Before LCP (ms) | Local after LCP (ms) | After submit bottom (px) | Graph |
| --- | ---: | ---: | ---: | --- |
| 1920 × 1080 | 404 | 216 | 736 | WebGL |
| 1440 × 900 | 724 | 176 | 692 | WebGL |
| 1366 × 768 | 388 | 188 | 591 | WebGL |
| 768 × 1024 | 432 | 172 | 607 | Static |
| 390 × 844 | 356 | 164 | 576 | Static |
| 360 × 800 | 340 | 172 | 564 | Static |

Before: 184,000 encoded JavaScript bytes. Local after: 183,407 initial bytes, plus **240,951 deferred bytes on eligible desktops**; **zero deferred graph bytes on tablet/mobile**. Observed CLS was 0.0000 at all six sizes before and after; no viewport overflow, uncaught browser errors or failed resource requests were observed. The local after run saw two long tasks on each desktop and one on each smaller viewport.

Production and localhost have different latency and compression conditions. These timings **do not establish a production speedup** or real-user Core Web Vitals. INP, Lighthouse and field metrics are not measured. The production release is measured separately during delivery.

## Graph behavior and limitations

The graph shares deterministic node/route data between its SSR SVG and procedural WebGL scene. Layered metallic frames and glass surfaces mark a release boundary; bounded signal instances trace source/dependency paths, with a coral output branch representing a possible risk. There are no external models/textures, postprocessing passes or invented telemetry. The stage explicitly says it is conceptual.

WebGL is lazy-loaded after initial paint/capability checks. Mobile, low-memory/low-concurrency/save-data devices, reduced motion and forced colors use the static graph. DPR is capped at 1.5; the demand clock is bounded at 30fps and can lower DPR to 1 and cadence to 20fps after slow-frame sampling. Offscreen/hidden/paused scenes stop scheduling motion. Context loss retains the static graph and allows an explicit renderer retry. The analyzer is independent of the canvas.

The independent operator, October 2026 launch, lack of legal incorporation, approved quotes and pinned founder observation retain their factual meaning. Historical **22 PASS / 10 FAIL and one critical violation** remain visible. This redesign does not resolve or replace that historical model-quality evidence. No paid live inference was used for verification.

## Release gate

Open the PR with these artifacts, wait for application CI and Vercel checks, review the staged diff, then merge. Verify the exact merged main SHA in Vercel's READY production deployment and in the deployed Evidence page's commit link. Run the browser smoke suite against the custom domain with all analysis requests intercepted; make only invalid-input/unconfigured-method API smoke requests that cannot call Claude. Capture all six production viewports and preserve the final deployment metadata/measurements in the delivery artifacts.
