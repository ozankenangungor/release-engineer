# Startup evidence workflow — release preflight

Checked **9 October 2026** on `feat/startup-evidence-workflow`, starting from main/production `1d4207371349a0d66a91c73b1c8192e60fd0b934`. This documents software verification, not an external pilot, a new live Claude evaluation or program acceptance.

## Delivered scope

- Pinned text-report downloads and strict local human-verification JSON, with unchecked defaults, evidence requirements, no annotation upload/storage and reset on a new report.
- Server-rendered `/pilot`, a blank downloadable worksheet, consistent footer/About/Evidence links and a privacy notice for voluntary exports/email.
- Offline, explicitly admitted pilot aggregation with hash checks, consent/source attestations, duplicate handling and separate founder/scripted/external totals.
- English [application drafts](claude-startups-application.md), [reviewer brief](claude-startups-reviewer-brief.md), [pilot workflow](pilot-validation.md) and [integrity limits](review-integrity.md).
- Narrow output rejection for unavailable finding files and selected explicit execution/access assertions. Prompt, API contracts, retrieval, context limits, admission/origin boundaries and grading rules remain intact. Pipeline provenance includes the new module; historical/new evaluator source hashes differ, so existing strict comparison compatibility still applies.
- The previously removed homepage historical-evaluation band remains removed. Historical evidence and approved feedback are preserved on their dedicated pages.
- Footer wording now says **PUBLIC SOURCE**. No OSI license was found; no license was invented or added.

## Required local checks

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed; no dependency/lockfile changes |
| `pnpm lint` | Passed |
| `pnpm typecheck` | Passed |
| `pnpm test` | 403 tests passed across 24 files |
| `pnpm build` | Passed; `/pilot` prerendered |
| `pnpm eval:validate` | 32 synthetic fixtures validated; no model called/scored |
| `pnpm test:browser` | 28 passed, Chromium, including axe checks |
| `git diff --check` | Passed |

Browser analysis routes are intercepted before navigation, including when the suite targets production. Report/export tests use clearly authored offline fixtures, not real Claude output or external feedback. The installed local Chromium 1243 executable was supplied explicitly; CI installs the browser revision selected by its pinned Playwright package.

New download tests read the actual downloaded text/JSON, validate the record schema, check exact PR head and coverage, exercise required evidence, verify no extra POST/local/session storage, and check reset on a subsequent report. A no-findings case preserves missing-concern feedback. The beta route/worksheet works without JavaScript. All public routes remain covered at desktop and 360 px with metadata, overflow, links and WCAG rule checks.

The first browser pass exposed an ambiguous alert locator because Next also renders a route announcer. The export alert now has a specific accessible name and the test targets it; the required error assertion remains. No checks were removed or weakened.

## Visual and React review

Actual browser captures cover all six established homepage viewports: 1920×1080, 1440×900, 1366×768, 768×1024, 390×844 and 360×800. New expanded verification screenshots at 1440/360 px and the mobile beta guide were manually inspected. Labels, controls, wrapping and buttons remain readable and usable, with no horizontal overflow. The existing light editorial hero, visible desktop WebGL topology, dark illustrative workspace and mobile static graph remain consistent.

The React review checked hook ordering, lazy initializers, updater state, report-specific reset, native labeled controls/required validation, named errors/live status, memory-only data, blob URL revocation and lazy loading of the export component. Essential analysis remains independent of WebGL. Browser checks still exercise real canvas readiness/movement/pause, offscreen suspension, context loss/retry, reduced motion and forced-color fallback.

## Lab observations and limits

One current-production baseline pass measured 186,857 encoded JavaScript bytes before the graph request and 245,254 deferred bytes on desktop; tablet/mobile deferred graph bytes were zero. A local built-server pass measured 184,375 initial and 240,951 deferred bytes respectively, with zero deferred graph bytes on tablet/mobile. All six passes observed CLS 0 and no overflow. Desktop canvas rendered; tablet/mobile stayed static. Local 1440 px LCP was 168 ms; baseline production was 448 ms.

These are single unthrottled lab observations. Local and production transport differ, so they are **not** evidence of a speed improvement or Core Web Vitals for real users. Production must be measured again after exact-SHA deployment. The lazy export code is requested with a returned report, rather than rendered into the initial hero. No Lighthouse score is claimed.

## Historical preservation

Both recorded complete model-run artifacts were downloaded privately and their SHA-256 result hashes matched the published record. The offline comparison still returns exit 1 **REGRESSION**, including verdict/task-retention regressions; this is the expected historical comparison outcome, not a failed new CI gate. The latest historical result remains 22 PASS / 10 FAIL / one critical flag. Original review text is absent, and no new live measurement establishes its resolution.

## Release evidence handling

The PR must pass CI and its Vercel preview check before merge. After merge, verify main and production deployment metadata against the exact merged SHA, then run the intercepted production browser suite, route/export smoke checks and screenshots. Store deployment identifiers, measurements and screenshots outside the public checkout in the delivery artifacts. These post-merge actions cannot be proved by local build results and must be reported separately.

No production secrets, paid test calls, application submission, terms acceptance, outreach, manufactured feedback or incorporation were performed. Program eligibility and actual external observations remain separate from a software release.
