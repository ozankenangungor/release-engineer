# Real-world PR evaluation plan

**Proposal only.** The current dataset remains 32 original synthetic cases. No real-PR fixtures, human labels or live results are added by this document. Synthetic fixtures isolate known failure modes; they do not represent arbitrary repository context, patch complexity or developer behavior.

For individual observations before a labeled dataset exists, use the [public-PR case-study workflow and blank template](public-pr-case-study-template.md). A case study needs independent adjudication and explicit source/participant attribution; it is not automatically a benchmark case or external validation.

## Admission requirements

A future real-PR set should use small, public changes with enough supplied evidence for a defensible rubric. Admit a labeled case only when a reviewer can explain its expected behavior independently of Claude's response:

- A documented defect and fix, a regression test, a public advisory, or an explicit compatibility/migration contract can establish a positive risk.
- A merged PR, positive author description or absence of reported bugs does not establish a safe negative control.
- Ambiguous context needs qualified human-review expectations, not invented certainty.
- A confirmed issue outside the supplied patches cannot be a required finding unless the relevant evidence is actually supplied.

If the evidence cannot support a label, retain it privately as an **unlabeled observation**, excluded from quality metrics with that exclusion disclosed. Do not assign `high`, `security`, `hold` or another label because the model said so. Do not remove difficult cases because they fail.

## Source and rights record

For every proposed case, record:

- Canonical public PR URL, repository and source author/project attribution.
- Base/head SHAs, retrieval date and source identifiers for evidence supporting the rubric.
- License at the pinned revision, applicable permissions and redistribution decision.
- Exact selected filenames, minimal patches, coverage flags and normalized context hash.
- Human rubric rationale, reviewer/adjudication status and known uncertainty.

Public visibility alone is not permission to redistribute source. Prefer owned or explicitly permitted public PRs; preserve required attribution/license notices and avoid large third-party excerpts. Exclude secrets, personal data and undisclosed vulnerabilities. If permission or evidence is unclear, do not commit the snapshot.

## Reproducible snapshots

Capture metadata and minimal patches once in a separately authorized retrieval step. Confirm the base/head have not changed during capture. Pin the snapshot rather than relying on the current PR page, and preserve truthful missing/truncated-file/description flags.

Use the production context builder on the local snapshot; do not expand production context or include golden labels in model input. Record both original source IDs and the final context fingerprint. A later unavailable/deleted/changed source is an explicit unavailable case, not a silently dropped successful denominator.

The existing injected review executor, strict schema, separate model/delivered grades and fingerprinted artifacts can support such local cases later. No live GitHub dependency, new runner mode, batch system or production behavior change is needed in CI now.

## Rubrics and comparison

Write evidence-backed expectations before the live run. Use acceptable verdicts, severity bounds, categories, evidence paths and uncertainty/limitations; do not require exact prose. Have another reviewer inspect ambiguous labels when available, and record disagreement rather than inventing consensus.

Version the real-world set separately from the synthetic set and report their denominators separately. Changes to snapshots, labels or grading invalidate comparisons unless both configurations are rerun on the common version. Preserve critical safety checks and never let an aggregate score hide partial merges, injection compliance or fabricated execution claims.

## Execution and publication gates

1. Rights, privacy and label-evidence review.
2. Offline schema/fixture/context validation, with fingerprints and explicit unavailable cases.
3. Separate approval for a tiny live smoke run; inspect artifacts before further spending.
4. Additional approval for a capped baseline/candidate experiment with the same pinned cases and rubric.
5. Human adjudication of misses, false positives and representative passes, including uncertainty.
6. Publication review of a sanitized summary only; raw artifacts remain private and ignored.

Report actual completion, failures, usage and timing without claiming production accuracy or statistical significance from a small convenience sample. A real-world snapshot dataset can improve evidence breadth; it cannot prove safety on arbitrary future PRs.
