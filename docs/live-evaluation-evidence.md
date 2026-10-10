# Recorded live synthetic evaluations

Evidence checked on **October 7, 2026** against GitHub Actions logs and downloaded `result.json` / `report.md` artifacts. These are two manually dispatched Claude runs on **32 original synthetic PR cases**, using the production review engine, dataset **1.0.0**, evaluator **1.0.1** and requested/served model **claude-sonnet-5-5**. They are not external beta tests, real public PR analyses, production accuracy or evidence of traction.

## Sources and verification

| | First complete baseline | Subsequent candidate |
| --- | --- | --- |
| Tested commit | [`cac977a1f7d3452609e3619540b1a3dbbae51d8d`](https://github.com/ozankenangungor/release-engineer/commit/cac977a1f7d3452609e3619540b1a3dbbae51d8d) | [`1890f2e112fb2193c602b8471aebb3e312043a35`](https://github.com/ozankenangungor/release-engineer/commit/1890f2e112fb2193c602b8471aebb3e312043a35) |
| Workflow run | [37673686412](https://github.com/ozankenangungor/release-engineer/actions/runs/37673686412) | [37675952752](https://github.com/ozankenangungor/release-engineer/actions/runs/37675952752) |
| Artifact name | `live-eval-baseline-37673686412` | `live-eval-baseline-37675952752` |
| Run start (UTC) | 2026-10-07 19:20:28.607 | 2026-10-07 19:38:22.995 |
| Model cases completed | 32/32 | 32/32 |
| PASS / FAIL | 0 / 32 | 22 / 10 |
| Infrastructure errors / NOT_RUN | 0 / 0 | 0 / 0 |
| Model / delivered critical violations | 7 / 7 | 1 / 1 |

Both workflows concluded **failure**, because the evaluator returns a nonzero exit code for rubric violations. Completion and schema validity do not mean the run passed. All 32 responses in each run recorded `end_turn`, the served model above and provider usage. An earlier smoke workflow is outside these two complete-run denominators; this document is not a count of all API calls made by the project.

The existing `pnpm eval:compare` reader validated both artifact schemas, recomputed their summaries from case-level grades and accepted their dataset/schema/evaluator/case-set compatibility. Its exit code was **1 (REGRESSION)**: some metrics worsened despite fewer critical violations. Logs independently matched the artifact summaries. No new provider requests were used to verify them.

## Complete metric observations

Fractions retain their eligible denominators. “Model” grades the validated Claude output; “delivered” grades the report after deterministic coverage enforcement. They are separate stages, not separate model requests.

| Deterministic rubric metric | Baseline model | Baseline delivered | Candidate model | Candidate delivered |
| --- | --- | --- | --- | --- |
| Schema validity | 32/32 | 32/32 | 32/32 | 32/32 |
| Required-risk recall | 17/17 | 17/17 | 17/17 | 17/17 |
| Material false-positive rate (lower is better) | 0/9 | 0/9 | 0/9 | 0/9 |
| Verdict accuracy | 32/32 | 32/32 | 31/32 | 31/32 |
| Severity calibration | 49/49 | 49/49 | 49/49 | 49/49 |
| Category accuracy | 15/17 | 15/17 | 16/17 | 16/17 |
| Evidence grounding | 76/87 | 76/87 | 65/73 | 65/73 |
| Limitation honesty | 25/70 | 70/70 | 69/70 | 70/70 |
| Testing-gap recall | 2/2 | 2/2 | 2/2 | 2/2 |
| Breaking-change recall | 2/3 | 2/3 | 3/3 | 3/3 |
| Uncertainty honesty | 2/2 | 2/2 | 2/2 | 2/2 |
| Prompt-injection resistance (task retention under attack) | 6/6 | 6/6 | 5/6 | 5/6 |
| Partial-context safety | 5/5 | 5/5 | 5/5 | 5/5 |
| Weighted diagnostic score, rounded | 92.8% | 96.7% | 97.2% | 97.3% |

The weighted score is a rubric diagnostic, **not product accuracy**. It cannot override failures. The false-positive rate measures safe **cases** with material allegations, not precision across arbitrary findings. Required-risk recall uses 17 rubric risks, not 17 real bugs found for users. Grounding denominators vary with the number of findings. Delivered limitations include deterministic application safeguards and must not be credited entirely to Claude.

### Failures and regressions

The candidate retained **10 failing cases** and one critical violation in both stages: `breaking-cli-doc-injection`, `UNSUPPORTED_CLAIM`, `tests_confirmed`. These are the same flagged violation measured twice, not two independent defects. The artifacts omit review text, so this records the evaluator's finding; the exact original wording has not been independently adjudicated from these artifacts.

Baseline critical flags occurred in `ambiguous-normalization-contract`, `dependency-major-contract`, `partial-missing-patch`, `partial-retrieval-limit`, `partial-truncated-patch`, `safe-comments` and `safe-tests-only`: unavailable-file attribution or unsupported test/CI assertions.

Verdict accuracy decreased from 32/32 to 31/32 and adversarial task retention from 6/6 to 5/6. A task-retention failure does not by itself prove that the model followed injection instructions. Single runs do not establish statistical significance, causal improvement or reliable behavior on arbitrary PRs. Read the [rubric definitions and limitations](../evals/README.md) before interpreting these metrics.

## Recorded usage

| Provider-reported tokens | Baseline | Candidate |
| --- | ---: | ---: |
| Input | 70,602 | 88,778 |
| Output | 23,564 | 22,150 |
| Cache creation / cache read | 0 / 0 | 0 / 0 |
| Responses with usage | 32 | 32 |

No dollar cost, cost saving or latency improvement is inferred.

## Reproduction and provenance

Download existing artifacts without calling Claude:

```sh
gh run download 37673686412 --repo ozankenangungor/release-engineer --dir /tmp/release-engineer-baseline
gh run download 37675952752 --repo ozankenangungor/release-engineer --dir /tmp/release-engineer-candidate
# Use the downloaded result.json paths:
pnpm eval:compare /path/to/baseline/result.json /path/to/candidate/result.json
```

Artifact retrieval may require GitHub sign-in. The workflow retains artifacts for **seven days**; logs/summary links and this manually checked summary provide context, but do not replace the original artifacts. The founder should preserve the originals privately before expiry. No generated artifacts, raw responses, credentials or tester records are committed here.

| SHA-256 fingerprint | Baseline | Candidate |
| --- | --- | --- |
| Dataset | `c0dcce1e6b2826702882781eabd42ba66c6f111bc15ed089f416d6441c6c88fa` | same |
| Schema | `1126fa0ca93de7e7db3d64487f7dd4ce9f75ef1105e51161dbbb5672e3cc40e4` | same |
| Evaluator | `6fe5993ddcb91357516b9837298c09dda0a87ac777ca69930f0af7921dd50d45` | same |
| Prompt | `22770aad7b39efc5dc32a8ff85d0681cbf92bd4c0a1de40cff2a9b2218f3f49b` | `379d99f316a577f051c9960853bfbce92dec19a783f82333bcebbaec9f43ea34` |
| Pipeline | `00aa3158c8ede34eaad8f48d2836df20d70f595d59683e6c40a75087d0dbbdc1` | `0849c3ed09c6d44299a2641d62da0a0e8f3b8830920a7e4290479a4c4d566f7f` |
| Downloaded `result.json` bytes | `02af129176eac1fa3268e42007fcba3dcb89e6f4a3b546d62936bbb32ea23675` | `716f351d454ed796d18aef0f46da05fd0f83ed782c3bcb8347e92b3105b68747` |

This is dated historical evidence, not an automatically updated dashboard or a claim about later deployments. Future runs need their own commit, provenance, failures and publication review.
