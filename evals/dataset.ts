import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildReviewContext, CONTEXT_LIMITS, byteLength, type ReviewContext } from "../src/lib/context";
import type { PullRequest } from "../src/lib/github";
import { datasetSchema, type EvaluationCase } from "./schema";

export type PreparedCase = { fixture: EvaluationCase; context: ReviewContext };

function patchSources(patch: string): string[] {
  return patch.split(/^@@[^\n]*$/m).flatMap(hunk => ["-", "+"].map(side =>
    hunk.split(/\r?\n/).filter(line => (line.startsWith(side) || line.startsWith(" ")) &&
      !line.startsWith("---") && !line.startsWith("+++"))
      .map(line => line.slice(1)).join("\n")));
}

function sourceContainsMarker(source: string, marker: string, location: "comment" | "string", hashComments: boolean): boolean {
  for (let index = 0; index < source.length;) {
    const char = source[index];
    if (char === '"' || char === "'") {
      const start = ++index;
      while (index < source.length && source[index] !== char && source[index] !== "\n") {
        if (source[index] === "\\") index++;
        index++;
      }
      if (source[index] === char && location === "string" && source.slice(start, index).includes(marker)) return true;
      index++;
    } else if (!hashComments && source.startsWith("//", index) || hashComments && char === "#") {
      const end = source.indexOf("\n", index);
      const boundary = end === -1 ? source.length : end;
      if (location === "comment" && source.slice(index, boundary).includes(marker)) return true;
      index = boundary;
    } else if (!hashComments && source.startsWith("/*", index)) {
      const end = source.indexOf("*/", index + 2);
      const boundary = end === -1 ? source.length : end;
      if (location === "comment" && source.slice(index + 2, boundary).includes(marker)) return true;
      index = end === -1 ? source.length : end + 2;
    } else index++;
  }
  return false;
}

function attackIsLocated(fixture: EvaluationCase): boolean {
  if (!fixture.attack) return true;
  const { location, marker } = fixture.attack;
  const { title, description, files } = fixture.pullRequest;
  if (location === "title") return title.includes(marker);
  if (location === "description") return description.includes(marker);
  if (location === "filename") return files.some(file => file.filename.includes(marker));
  if (location === "documentation")
    return files.some(file => /\.(?:md|mdx|txt)$/i.test(file.filename) && file.patch?.includes(marker));
  return files.some(file => {
    const hashComments = /\.(?:py|sh|bash|rb|ya?ml|toml)$/i.test(file.filename);
    if (!hashComments && !/\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts)$/i.test(file.filename)) return false;
    return patchSources(file.patch ?? "").some(source => sourceContainsMarker(source, marker, location, hashComments));
  });
}

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
  if (!attackIsLocated(fixture))
    throw new Error(`Attack marker is absent from the declared location: ${fixture.id}`);
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
