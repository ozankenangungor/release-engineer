import { metricNames } from "./grader";
import { compareRuns, type RunArtifact } from "./artifacts";

const percent = (value: number | null) => value === null ? "N/A" : `${(value * 100).toFixed(1)}%`;

export function renderReport(run: RunArtifact): string {
  const { metadata, summary } = run;
  const rows = metricNames.map(name => {
    const raw = summary.modelMetrics[name], delivered = summary.deliveredMetrics[name];
    return `| ${name} | ${percent(raw.value)} (${raw.numerator}/${raw.denominator}) | ${percent(delivered.value)} (${delivered.numerator}/${delivered.denominator}) |`;
  });
  const failures = run.cases.filter(record => record.status !== "PASS").map(record => {
    const reasons = [
      ...(record.modelGrade?.failures ?? []).map(failure => `- Model ${failure.critical ? "CRITICAL " : ""}${failure.code}: ${failure.description}`),
      ...(record.deliveredGrade?.failures ?? []).map(failure => `- Delivered ${failure.critical ? "CRITICAL " : ""}${failure.code}: ${failure.description}`),
    ];
    if (record.errorCode) reasons.push(`- ${record.errorCode}; provider details withheld.`);
    if (record.status === "NOT_RUN") reasons.push("- Not attempted; remains in the selected-case count.");
    return `### ${record.id} — ${record.status}\n\n${reasons.join("\n")}`;
  });
  return [
    "# Release Engineer Evaluation", "",
    `Mode: ${metadata.kind}; requested model: ${metadata.requestedModel}`,
    `Dataset: ${metadata.datasetVersion}; evaluator: ${metadata.evaluatorVersion}`,
    `Prompt fingerprint: ${metadata.promptFingerprint}`,
    `Timestamp: ${metadata.timestamp}`,
    `Cases: ${summary.caseCount}; PASS: ${summary.statuses.pass}; FAIL: ${summary.statuses.fail}; INFRASTRUCTURE_ERROR: ${summary.statuses.infrastructureError}; NOT_RUN: ${summary.statuses.notRun}`,
    `Completed model cases: ${summary.completedModelCases}/${summary.caseCount}`, "",
    "| Metric | Validated model response | Delivered report |", "| --- | --- | --- |", ...rows, "",
    `Weighted diagnostic score: model ${percent(summary.modelScore)}; delivered ${percent(summary.deliveredScore)}.`,
    `Critical failures: model ${summary.modelCriticalFailures}; delivered ${summary.deliveredCriticalFailures}.`,
    `Known input/output tokens: ${summary.usage.inputTokens ?? "unavailable"}/${summary.usage.outputTokens ?? "unavailable"}; responses with usage: ${summary.usage.responsesWithUsage}.`,
    `Known cache creation/read tokens: ${summary.usage.cacheCreationInputTokens ?? "unavailable"}/${summary.usage.cacheReadInputTokens ?? "unavailable"}.`, "",
    summary.passed ? "PASS" : "FAIL — a high average cannot override failed rubrics, critical failures or incomplete execution.", "",
    "Lower materialFalsePositiveRate is better. N/A means no eligible observations, not a perfect score. Infrastructure/NOT_RUN cases remain visible and prevent success; output-quality fractions show their actual denominators.", "",
    "Deterministic concept/evidence checks are proxies. An evaluation score is evidence about the tested dataset and rubric, not proof that Release Engineer is correct on arbitrary real-world pull requests.", "",
    ...failures,
  ].join("\n") + "\n";
}

export function renderComparison(baseline: RunArtifact, candidate: RunArtifact): string {
  const comparison = compareRuns(baseline, candidate);
  return [
    "# Release Engineer Evaluation Comparison", "",
    `Baseline model/prompt: ${baseline.metadata.requestedModel} / ${baseline.metadata.promptFingerprint}`,
    `Candidate model/prompt: ${candidate.metadata.requestedModel} / ${candidate.metadata.promptFingerprint}`,
    `Pipeline changed: ${baseline.metadata.pipelineFingerprint !== candidate.metadata.pipelineFingerprint}`, "",
    "| Stage / metric | Baseline | Candidate | Delta (percentage points) |", "| --- | --- | --- | --- |",
    ...[["Model", comparison.deltas], ["Delivered", comparison.deliveredDeltas]].flatMap(([stage, deltas]) =>
      (deltas as typeof comparison.deltas).map(row => `| ${stage} / ${row.name} | ${percent(row.baseline)} | ${percent(row.candidate)} | ${row.delta === null ? "N/A" : (row.delta * 100).toFixed(1)}${row.regressed ? " REGRESSION" : ""} |`)), "",
    `New failed cases: ${comparison.newFailures.join(", ") || "none"}`,
    `New critical failures: ${comparison.newCriticalFailures.length}`,
    comparison.regressed ? "REGRESSION" : "NO MEASURED REGRESSION",
    "Single-run deltas describe this dataset; they do not establish statistical significance or causality.",
  ].join("\n") + "\n";
}
