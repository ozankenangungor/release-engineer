import { cp, mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { main } from "../evals/cli";
import { runArtifactSchema } from "../evals/artifacts";
import { reviewPullRequestWithMetadata } from "../src/lib/claude";
import { correctNullReview, scriptedExecution } from "./eval-helpers";

vi.mock("../src/lib/claude", () => ({ reviewPullRequestWithMetadata: vi.fn() }));
const execute = vi.mocked(reviewPullRequestWithMetadata);
const project = fileURLToPath(new URL("../", import.meta.url));
const credential = "offline-test-credential-only";
const env = { EVAL_LIVE: "1", ANTHROPIC_API_KEY: credential, EVAL_MODEL: "scripted-test-model" };
let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "release-engineer-cli-test-"));
  await cp(join(project, "src"), join(root, "src"), { recursive: true });
  await cp(join(project, "evals"), join(root, "evals"), {
    recursive: true,
    filter: source => source !== join(project, "evals", "results"),
  });
  vi.spyOn(console, "log").mockImplementation(() => {});
  execute.mockReset();
  const output = correctNullReview();
  output.summary += ` Offline test value: ${credential}.`;
  execute.mockResolvedValue(scriptedExecution(output, "correctness-null-dereference"));
});
afterEach(async () => {
  vi.restoreAllMocks();
  await rm(root, { recursive: true, force: true });
});

async function artifact() {
  const results = join(root, "evals", "results");
  const runs = await readdir(results);
  expect(runs).toHaveLength(1);
  const directory = join(results, runs[0]!);
  expect((await readdir(directory)).sort()).toEqual(["report.md", "result.json"]);
  const json = await readFile(join(directory, "result.json"), "utf8");
  const report = await readFile(join(directory, "report.md"), "utf8");
  expect(json + report).not.toContain(credential);
  expect(vi.mocked(console.log).mock.calls.flat().join("\n")).not.toContain(credential);
  if (process.platform !== "win32") {
    expect((await stat(directory)).mode & 0o777).toBe(0o700);
    for (const name of ["result.json", "report.md"])
      expect((await stat(join(directory, name))).mode & 0o777).toBe(0o600);
  }
  return runArtifactSchema.parse(JSON.parse(json));
}

describe("evaluation CLI artifact security with a scripted executor", () => {
  it("writes valid, private checkpoints without retaining reviews by default", async () => {
    expect(await main(["live", "--label", "scripted-default"], env, root)).toBe(0);
    expect(execute).toHaveBeenCalledTimes(1);
    const run = await artifact();
    expect(run.cases[0]).not.toHaveProperty("modelReview");
    expect(run.cases[0]).not.toHaveProperty("deliveredReview");
    expect(run.summary.completion).toBe(1);
  });

  it("redacts credentials in opted-in validated reviews and leaves no temporary files", async () => {
    expect(await main(["live", "--label", "scripted-reviews", "--include-reviews"], env, root)).toBe(0);
    expect(execute).toHaveBeenCalledTimes(1);
    const run = await artifact();
    expect(run.cases[0]?.modelReview?.summary).toContain("[REDACTED]");
    expect(run.cases[0]?.deliveredReview?.summary).toContain("[REDACTED]");
    expect(run.summary.statuses).toMatchObject({ pass: 1, notRun: 0 });
  });
});
