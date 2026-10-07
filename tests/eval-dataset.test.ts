import { describe, expect, it } from "vitest";
import { prepareCase } from "../evals/dataset";
import { datasetSchema, evaluationCaseSchema, tagsSchema } from "../evals/schema";
import { evaluationDataset, evaluationCase } from "./eval-helpers";

describe("evaluation fixture integrity", () => {
  it("validates 32 original cases with every declared coverage category", () => {
    expect(evaluationDataset.prepared).toHaveLength(32);
    const tags = new Set(evaluationDataset.dataset.cases.flatMap(test => test.tags));
    for (const tag of tagsSchema.options) expect(tags.has(tag)).toBe(true);
    expect(evaluationDataset.prepared.filter(test => test.fixture.attack)).toHaveLength(6);
    expect(new Set(evaluationDataset.prepared.flatMap(test => test.fixture.attack ? [test.fixture.attack.location] : [])).size).toBe(6);
    expect(evaluationDataset.prepared.filter(test => test.context.coverage.partial)).toHaveLength(5);
  });
  it("uses stable ordering and never supplies the golden rubric to Claude", () => {
    const ids = evaluationDataset.prepared.map(test => test.fixture.id);
    expect(ids).toEqual([...ids].sort());
    for (const test of evaluationDataset.prepared) {
      expect(test.context.json).not.toContain('"requiredRisks"');
      expect(test.context.json).not.toContain('"acceptableVerdicts"');
      expect(test.context.json).not.toContain('"criticalIfMissed"');
      expect(JSON.parse(test.context.json).pullRequest.headBranch).toBe("update-behavior");
    }
  });
  it.each([
    ["unknown category", (value: typeof evaluationDataset.dataset) => { value.cases[0]!.expected.requiredRisks[0]!.categories = ["invented" as never]; }],
    ["duplicate IDs", (value: typeof evaluationDataset.dataset) => { value.cases[1]!.id = value.cases[0]!.id; }],
    ["reverse severity bounds", (value: typeof evaluationDataset.dataset) => { value.cases[0]!.expected.overallRisk = { min: "critical", max: "low" }; }],
    ["unknown field", (value: typeof evaluationDataset.dataset) => { Object.assign(value.cases[0]!, { surprise: true }); }],
  ])("fails before evaluation for %s", (_, mutate) => {
    const value = structuredClone(evaluationDataset.dataset);
    // Choose a case with a risk so the category mutation has an actual target.
    value.cases.sort((a, b) => b.expected.requiredRisks.length - a.expected.requiredRisks.length);
    mutate(value);
    expect(datasetSchema.safeParse(value).success).toBe(false);
  });
  it("rejects permissive partial rubrics and unsafe negative controls", () => {
    const partial = structuredClone(evaluationCase("partial-truncated-patch").fixture);
    partial.expected.acceptableVerdicts = ["merge"];
    expect(evaluationCaseSchema.safeParse(partial).success).toBe(false);
    const safe = structuredClone(evaluationCase("safe-documentation").fixture);
    safe.expected.maxMaterialFindings = 1;
    expect(evaluationCaseSchema.safeParse(safe).success).toBe(false);
  });
  it("rejects invalid limits, missing evidence and inconsistent retrieval data", () => {
    const value = structuredClone(evaluationCase("correctness-null-dereference").fixture);
    expect(evaluationCaseSchema.safeParse({ ...value, limits: { maxBytes: Number.NaN } }).success).toBe(false);
    value.expected.requiredRisks[0]!.evidence[0]!.path = "src/not-supplied.ts";
    expect(() => prepareCase(value)).toThrow("Evidence not present");
    const inconsistent = structuredClone(evaluationCase("partial-retrieval-limit").fixture);
    inconsistent.pullRequest.filesTruncated = false;
    expect(() => prepareCase(inconsistent)).toThrow("Inconsistent retrieval");
  });
  it("detects context changes that invalidate coverage labels", () => {
    const partial = structuredClone(evaluationCase("partial-truncated-patch").fixture);
    partial.limits = { maxPatchBytes: 8_000 };
    expect(() => prepareCase(partial)).toThrow("Coverage expectation failed");
  });
  it("withholds a dropped risk from the context rather than silently repairing selection", () => {
    const value = structuredClone(evaluationCase("partial-omitted-file").fixture);
    value.pullRequest.files.unshift({ filename: ".github/workflows/check.yml", status: "modified", additions: 1, deletions: 0, patch: "+name: Check" });
    const prepared = prepareCase(value);
    expect(JSON.parse(prepared.context.json).files[0].filename).toBe(".github/workflows/check.yml");
    expect(prepared.context.json).not.toContain('"filename":"src/auth.ts"');
    expect(prepared.fixture.expected.requiredRisks).toHaveLength(1);
  });
});
