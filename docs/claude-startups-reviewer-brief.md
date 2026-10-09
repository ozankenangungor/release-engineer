# Release Engineer

**Claude Startups reviewer brief · 9 October 2026**

## A second review, with evidence to check

Release Engineer uses Claude to review public GitHub pull requests for potential breaking changes, regressions, security concerns and testing gaps. It connects a release-oriented report to file evidence, coverage limits and a human verification handoff.

**Product:** https://releaseengineer.tech
**Source:** https://github.com/ozankenangungor/release-engineer
**Operator:** Ozan Kenan Güngör · Ankara, Türkiye
**Stage:** self-funded early beta · launched October 2026 · no incorporated legal company

## Implemented today

- Functional public-PR analysis through the official server-only Anthropic SDK, with structured output and strict Zod validation.
- Deterministic serialized context limits: 60,000 bytes, up to 40 selected files, 8,000 bytes per patch. Partial context cannot receive a final merge recommendation.
- A narrow integrity gate rejects selected explicit unsupported execution/access claims and finding-file references outside visible supplied patches. It is not semantic verification or a complete injection defense.
- Reports show the reviewed PR head and can be downloaded. Browser-local verification records let a reviewer mark findings only after checking evidence and record actual follow-through.
- Public source, dated evaluation evidence, an authored interactive example, and a beta verification guide at https://releaseengineer.tech/pilot.

## Evidence and gaps

The Evidence page contains three founder-supplied, publication-approved qualitative external quotes. They are not a verified unique-user/customer count. One published real-PR observation is explicitly founder-run and covers a one-file Rails documentation correction; it does not demonstrate material risk detection.

The latest published complete synthetic Claude run, 7 October 2026, recorded **22 PASS / 10 FAIL and one critical unsupported-test-claim flag** across 32 cases. Original review text is absent from the artifacts. New deterministic checks have offline regression coverage; no new live evaluation or resolution of that historical flag is claimed. Synthetic metrics are not production accuracy.

Repeat use, verified useful findings, customers and revenue are not established by the available records. The product does not inspect the full repository or execute tests. Human verification remains necessary.

## The next validation milestone

The proposed initial audience is maintainers reviewing public API and behavior changes. A consented pilot will preserve the PR head, report, checked evidence, wrong/inconclusive findings and actual actions. Local feedback remains private unless the participant chooses to share it; retained and published records need distinct permission. Operator-admitted summaries distinguish external, founder and scripted observations. This is a planned pilot, not completed traction.

Applied AI support would help improve evidence grounding and adversarial task retention. If available, credits would support separately budgeted evaluation and pilot analyses through the first-party API. Program eligibility and benefits, including unincorporated-founder eligibility, remain for Anthropic to determine.

## Inspect in three minutes

1. Explore the product's interactive **illustrative example — not a live analysis** without initiating inference.
2. Read the beta guide and https://releaseengineer.tech/evidence for qualifications and source links.
3. Inspect `src/lib/claude.ts`, `context.ts`, `review-integrity.ts` and the application/pilot documents in the public repository.

**Contact:** founder@releaseengineer.tech
This brief is prepared material, not a submitted application, award or Anthropic endorsement.
