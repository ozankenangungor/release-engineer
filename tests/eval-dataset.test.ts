import { describe, expect, it } from "vitest";
import { prepareCase } from "../evals/dataset";
import { datasetSchema, evaluationCaseSchema, tagsSchema } from "../evals/schema";
import { evaluationDataset, evaluationCase } from "./eval-helpers";
import type { EvaluationCase } from "../evals/schema";

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

describe("declared attack locations", () => {
  const attacks = evaluationDataset.prepared.filter(test => test.fixture.attack);
  it.each(attacks.map(test => [test.fixture.attack!.location, test.fixture] as const))(
    "accepts the existing valid %s fixture", (_, fixture) => {
      expect(() => prepareCase(fixture)).not.toThrow();
    },
  );
  it.each(attacks.flatMap(test => attacks.filter(other => other.fixture.attack!.location !== test.fixture.attack!.location)
    .map(other => [test.fixture.attack!.location, other.fixture.attack!.location, test.fixture] as const)))(
    "rejects a %s marker declared as %s", (_, location, source) => {
      const fixture = structuredClone(source);
      fixture.attack!.location = location;
      expect(() => prepareCase(fixture)).toThrow("declared location");
    },
  );

  function withAttack(location: NonNullable<EvaluationCase["attack"]>["location"], lines: string, filename = "src/attack.ts") {
    const fixture = structuredClone(evaluationCase("security-secret-comment-injection").fixture);
    const marker = fixture.attack!.marker;
    fixture.attack!.location = location;
    fixture.pullRequest.files.forEach(file => { file.patch = file.patch?.replaceAll(marker, "REMOVED_SENTINEL"); });
    fixture.pullRequest.files.push({ filename, status: "added", additions: 1, deletions: 0, patch: `@@ -0,0 +1,1 @@\n${lines.replaceAll("MARKER", marker)}` });
    return fixture;
  }

  it.each([
    ["line comment", '+// MARKER', "src/attack.ts"],
    ["inline comment", '+const safe = 1; // MARKER', "src/attack.ts"],
    ["block comment", '+/* MARKER */', "src/attack.ts"],
    ["multiline block comment", '+/*\n+ MARKER\n+ */', "src/attack.ts"],
    ["hash comment", '+# MARKER', "src/attack.py"],
    ["quotes inside a comment", '+// "MARKER"', "src/attack.ts"],
    ["removed comment", '-// MARKER', "src/attack.ts"],
  ])("accepts a marker in a %s", (_, lines, filename) => {
    expect(() => prepareCase(withAttack("comment", lines, filename))).not.toThrow();
  });
  it.each([
    '+const message = "MARKER";', "+const message = 'MARKER';",
    '+const message = "say \\"MARKER\\"";',
    '+const message = "// MARKER";', '+const message = "/* MARKER */";',
  ])("accepts a quoted string marker: %s", lines => {
    expect(() => prepareCase(withAttack("string", lines))).not.toThrow();
  });
  it.each([
    ["comment", '+const MARKER = true;'],
    ["comment", '+const message = "// MARKER";'],
    ["comment", '+const message = "/* MARKER */";'],
    ["comment", '+# MARKER'],
    ["string", '+const MARKER = true;'],
    ["string", '+// "MARKER"'],
    ["string", '+/* "MARKER" */'],
    ["string", '+const message = "MARKER;'],
  ] as const)("rejects %s markers outside that lexical location: %s", (location, lines) => {
    expect(() => prepareCase(withAttack(location, lines))).toThrow("declared location");
  });
  it("does not turn a string's trailing code into a comment", () => {
    const fixture = withAttack("comment", '+const message = "//"; const MARKER = true;');
    expect(() => prepareCase(fixture)).toThrow("declared location");
  });
  it("separates the old and new patch sources", () => {
    const fixture = withAttack("comment", '-const old = "\n+// MARKER');
    expect(() => prepareCase(fixture)).not.toThrow();
  });
  it("does not mistake Python floor division for a comment", () => {
    expect(() => prepareCase(withAttack("comment", '+value = count // MARKER', "src/attack.py"))).toThrow("declared location");
  });
  it.each(["docs/readme.md", "docs/readme.mdx", "docs/notes.txt", "docs/README.MD"])("accepts documentation in %s", filename => {
    expect(() => prepareCase(withAttack("documentation", '+MARKER', filename))).not.toThrow();
  });
  it.each(["src/attack.ts", "src/attack.py", "assets/notes.png", "config.json"])("rejects documentation markers in %s", filename => {
    expect(() => prepareCase(withAttack("documentation", '+MARKER', filename))).toThrow("declared location");
  });
  it("requires the documentation marker inside its patch, not just its filename", () => {
    const fixture = withAttack("documentation", '+No marker here.', "docs/MARKER.md");
    fixture.pullRequest.files.at(-1)!.filename = `docs/${fixture.attack!.marker}.md`;
    expect(() => prepareCase(fixture)).toThrow("declared location");
  });
});
