# Bounded output-integrity checks

Added **9 October 2026** to address explicit evidence/access claims inconsistent with the product's existing review boundaries. These checks are an additional deterministic rejection gate after strict model-output validation. The request prompt, API response schema, context budget, independent grading rules and synthetic dataset remain unchanged.

The provenance reader now includes the new integrity module in the pipeline source fingerprint. Editing that module changes the pipeline hash. Because the reader itself is part of the evaluator source fingerprint, new-run artifacts have a different evaluator fingerprint from historical runs even though the grading rules/version are unchanged. Existing strict compatibility checks remain intact: old/new artifacts cannot be automatically compared as compatible. Use a new baseline/candidate pair with the same harness snapshot for future automatic comparisons; historical observations remain separately dated evidence.

## Behavior

`src/lib/review-integrity.ts` checks the selected serialized context and the schema-valid report before coverage enforcement:

- A non-null finding `file` must exactly match a selected filename with a non-empty visible patch. Unselected/missing-patch files, alternate paths and appended `:line` references are rejected. A null file remains valid; it does not prove grounding.
- Bounded English patterns reject selected explicit assertions of test/code execution, passed/failed tests or CI, and inspection of the full repository. Release Engineer performs none of those operations.
- Direct negations, bounded conditional/recommended checks and certain attributed unverified statements are preserved. Static descriptions of visible test code are allowed.
- An affected response returns the existing `INVALID_REVIEW` operational error. Raw provider text is not exposed and the SDK does not retry. A rejected response can still consume provider tokens.

This reinforces the existing prompt's exact-file and no-test-execution requirements. It does not certify a finding's interpretation of code. The browser receives the same public schema on successful reviews.

## Limits and tradeoffs

The check is not a semantic verifier, a complete injection defense or a proof of factual correctness. English wording outside the listed patterns, other languages, subtle unsupported claims and wrong interpretations can pass. A qualified statement not recognized by the bounded rules may be rejected; the safer delivered result is an error requiring retry or human review. Quoted PR text is untrusted even when correctly attributed. Rejecting unavailable file references does not establish that the supplied patch proves the claim.

Unit tests distinguish explicit unsupported claims from negations, attributed PR statements, conditional checks and static observations, and cover exact file selection/missing patches. SDK tests prove invalid claims and unavailable-file findings are rejected without an automatic second billed request. These are offline regression checks with authored responses, not measured improvement in Claude quality.

## Historical flag remains historical

The preserved candidate artifact from Actions run `37675952752` records the `breaking-cli-doc-injection` critical flag `UNSUPPORTED_CLAIM / tests_confirmed` and a latest overall result of **22 PASS / 10 FAIL**. The artifact contains grades and provider metadata, **not the original review text**. We cannot independently adjudicate its wording, replay it through this gate or prove that this new gate catches that exact response.

Both historical result files were downloaded before the seven-day retention deadline and checked against their published SHA-256 fingerprints. Private originals are under ignored `.private-evidence/historical/`; no raw reports or private feedback were committed. The [historical record](live-evaluation-evidence.md) retains the full results and comparison limitations. No new live inference was performed for this change. Claims that the remaining model failure is resolved require new measured evidence, including any rejection/availability tradeoff.

## Useful next measurement

When separately authorized and budgeted, run the existing live evaluator at the new exact commit with its unchanged dataset and grader, retain the original artifacts privately and publish failures alongside useful results. Preserve access failures and rejections as outcomes. A new synthetic result would still not establish usefulness for external developers or production accuracy.
