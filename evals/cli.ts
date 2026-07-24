import { mkdir, mkdtemp, readFile, rename, stat, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { loadDataset } from "./dataset";
import { EVALUATOR_VERSION, fingerprints } from "./fingerprint";
import { liveOptions, redact } from "./options";
import { runEvaluation, runExitCode } from "./runner";
import { runArtifactSchema, compareRuns, type RunArtifact } from "./artifacts";
import { renderReport, renderComparison } from "./report";

async function readArtifact(path: string): Promise<RunArtifact> {
  if (!path.endsWith(".json") || (await stat(path)).size > 5_000_000)
    throw new Error("Comparison requires bounded evaluation JSON artifacts.");
  let input: unknown;
  try { input = JSON.parse(await readFile(path, "utf8")); }
  catch { throw new Error("An evaluation artifact could not be parsed as JSON."); }
  const parsed = runArtifactSchema.safeParse(input);
  if (!parsed.success) throw new Error("An evaluation artifact failed validation; check its schema, case records and summary.");
  return parsed.data;
}

export async function main(args: string[], env: Readonly<Record<string, string | undefined>>, root = process.cwd()): Promise<number> {
  const [command, ...flags] = args;
  if (flags.includes("--help")) {
    console.log("eval:validate | eval:live [--cases id,id|all] [--max-cases N] [--label name] [--include-reviews] | eval:compare baseline.json candidate.json\nLive requires EVAL_LIVE=1 and ANTHROPIC_API_KEY; optional EVAL_MODEL. Default: one case, cap three; no .env files are loaded.");
    return 0;
  }
  if (command === "compare") {
    if (flags.length !== 2) throw new Error("Comparison requires exactly two result JSON paths.");
    const baseline = await readArtifact(resolve(root, flags[0]!));
    const candidate = await readArtifact(resolve(root, flags[1]!));
    console.log(renderComparison(baseline, candidate));
    return compareRuns(baseline, candidate).regressed ? 1 : 0;
  }
  if (!["validate", "live"].includes(command ?? "")) throw new Error("Unknown evaluation command.");
  if (command === "validate" && flags.length) throw new Error("Fixture validation accepts no options.");
  const { dataset, prepared } = loadDataset(root);
  if (command === "validate") {
    const counts = new Map<string, number>();
    for (const test of prepared) for (const tag of test.fixture.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    console.log(`Validated ${prepared.length} synthetic fixtures, dataset ${dataset.version}.\n${[...counts].sort(([a], [b]) => a < b ? -1 : 1).map(([tag, count]) => `${tag}: ${count}`).join("; ")}\nNo model was called or scored; this is fixture/context validation, not a quality baseline.`);
    return 0;
  }
  const options = liveOptions(flags, env, prepared);
  const { getClaudeConfig } = await import("../src/lib/config");
  const { reviewPullRequestWithMetadata } = await import("../src/lib/claude");
  const model = options.model ?? getClaudeConfig().model;
  const metadata = {
    kind: "live" as const, evaluatorVersion: EVALUATOR_VERSION, datasetVersion: dataset.version,
    ...fingerprints(dataset, root), requestedModel: model, timestamp: new Date().toISOString(),
    nodeVersion: process.versions.node, caseIds: options.selected.map(test => test.fixture.id),
  };
  const outputRoot = resolve(root, "evals/results");
  await mkdir(outputRoot, { recursive: true });
  const output = await mkdtemp(join(outputRoot, `${options.label}-${metadata.timestamp.replace(/[:.]/g, "-")}-`));
  const secrets = [env.ANTHROPIC_API_KEY, env.GITHUB_TOKEN];
  const checkpoint = async (run: RunArtifact) => {
    for (const [name, body] of [["result.json", JSON.stringify(run, null, 2) + "\n"], ["report.md", renderReport(run)]]) {
      const temporary = join(output, `${name}.tmp`);
      await writeFile(temporary, redact(body!, secrets), { mode: 0o600 });
      await rename(temporary, join(output, name!));
    }
  };
  console.log(`Opt-in live evaluation: ${options.selected.length} request(s), model ${model}. No automatic retries. Artifacts: ${output}`);
  const controller = new AbortController();
  const abort = () => controller.abort();
  process.once("SIGINT", abort);
  process.once("SIGTERM", abort);
  try {
    const run = await runEvaluation(options.selected, metadata,
      (test, onResponse) => reviewPullRequestWithMetadata(test.context, controller.signal, { model, onResponse }),
      { includeReviews: options.includeReviews, checkpoint, signal: controller.signal });
    console.log(redact(renderReport(run), secrets));
    return runExitCode(run);
  } finally {
    process.removeListener("SIGINT", abort);
    process.removeListener("SIGTERM", abort);
  }
}
