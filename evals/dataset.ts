import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildReviewContext, CONTEXT_LIMITS, byteLength, type ReviewContext } from "../src/lib/context";
import type { PullRequest } from "../src/lib/github";
import { datasetSchema, type EvaluationCase } from "./schema";

export type PreparedCase = { fixture: EvaluationCase; context: ReviewContext };

export function fixturePullRequest(fixture: EvaluationCase): PullRequest {
  const files = fixture.pullRequest.files;
  return {
    owner: "synthetic",
    repository: "release-review-evals",
    number: 1,
    url: "https://github.com/synthetic/release-review-evals/pull/1",
    title: fixture.pullRequest.title,
    body: fixture.pullRequest.description,
    baseBranch: "main",
    headBranch: "update-behavior",
    headSha: "0".repeat(40),
    additions: files.reduce((sum, file) => sum + file.additions, 0),
    deletions: files.reduce((sum, file) => sum + file.deletions, 0),
    changedFileCount: fixture.pullRequest.changedFileCount ?? files.length,
    files,
    filesTruncated: fixture.pullRequest.filesTruncated,
  };
}

export function prepareCase(fixture: EvaluationCase): PreparedCase {
  const pr = fixturePullRequest(fixture);
  if (pr.changedFileCount < pr.files.length || pr.filesTruncated !== (pr.changedFileCount > pr.files.length))
    throw new Error(`Inconsistent retrieval metadata: ${fixture.id}`);
  const limits = { ...CONTEXT_LIMITS, ...fixture.limits };
  const context = buildReviewContext(pr, limits);
  for (const [key, expected] of Object.entries(fixture.expected.coverage)) {
    if (context.coverage[key as keyof typeof context.coverage] !== expected)
      throw new Error(`Coverage expectation failed: ${fixture.id}/${key}`);
  }
  if (byteLength(context.json) > limits.maxBytes)
    throw new Error(`Context budget exceeded: ${fixture.id}`);
  for (const risk of fixture.expected.requiredRisks) {
    for (const evidence of risk.evidence) {
      const source = pr.files.find(file => file.filename === evidence.path);
      if (!source?.patch || !evidence.anchors.some(anchor => source.patch?.includes(anchor)))
        throw new Error(`Evidence not present in fixture: ${fixture.id}/${risk.id}`);
    }
  }
  if (fixture.attack) {
    const { location, marker } = fixture.attack;
    const inputs = location === "title" ? [pr.title]
      : location === "description" ? [pr.body]
      : location === "filename" ? pr.files.map(file => file.filename)
      : pr.files.map(file => file.patch ?? "");
    if (!inputs.some(value => value.includes(marker)))
      throw new Error(`Attack marker is missing: ${fixture.id}`);
  }
  return { fixture, context };
}

export function loadDataset(root = process.cwd()) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(resolve(root, "evals/fixtures/cases.json"), "utf8"));
  } catch {
    throw new Error("The evaluation dataset could not be read as JSON.");
  }
  const result = datasetSchema.safeParse(parsed);
  if (!result.success) {
    const paths = result.error.issues.map(issue => issue.path.join(".")).join(", ");
    throw new Error(`Invalid evaluation dataset at: ${paths}`);
  }
  const dataset = result.data;
  dataset.cases.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const prepared = dataset.cases.map(prepareCase);
  return { dataset, prepared };
}
