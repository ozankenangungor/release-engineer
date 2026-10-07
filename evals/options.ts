import type { PreparedCase } from "./dataset";

export function liveOptions(args: string[], env: Readonly<Record<string, string | undefined>>, cases: PreparedCase[]) {
  if (env.EVAL_LIVE !== "1") throw new Error("Live evaluation requires EVAL_LIVE=1. No provider request was sent.");
  const apiKey = env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || !/^[A-Za-z0-9_-]{16,}$/.test(apiKey))
    throw new Error("Live evaluation requires a nonempty, valid-format ANTHROPIC_API_KEY in the process environment. No provider request was sent.");
  let selection = "correctness-null-dereference", maxCases = 3, label = "run", includeReviews = false;
  const seen = new Set<string>();
  for (let index = 0; index < args.length; index++) {
    const flag = args[index]!;
    if (seen.has(flag)) throw new Error("Duplicate live-evaluation option.");
    seen.add(flag);
    if (flag === "--include-reviews") { includeReviews = true; continue; }
    if (!["--cases", "--max-cases", "--label"].includes(flag)) throw new Error("Unknown live-evaluation option.");
    const value = args[++index];
    if (!value || value.startsWith("--")) throw new Error("An evaluation option is missing its value.");
    if (flag === "--cases") selection = value;
    if (flag === "--max-cases") {
      if (!/^[1-9][0-9]*$/.test(value) || Number(value) > 100) throw new Error("--max-cases must be an integer from 1 to 100.");
      maxCases = Number(value);
    }
    if (flag === "--label") {
      if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(value)) throw new Error("--label must be a short lowercase identifier.");
      label = value;
    }
  }
  const ids = selection === "all" ? cases.map(test => test.fixture.id) : selection.split(",");
  if (!ids.length || new Set(ids).size !== ids.length || ids.some(id => !cases.some(test => test.fixture.id === id)))
    throw new Error("Unknown, empty or duplicate evaluation case selection.");
  if (ids.length > maxCases) throw new Error("The case selection exceeds --max-cases. Increase the cap explicitly before spending credits.");
  const model = env.EVAL_MODEL?.trim();
  if (env.EVAL_MODEL !== undefined && (!model || !/^[a-zA-Z0-9._-]{1,200}$/.test(model)))
    throw new Error("EVAL_MODEL must be a nonempty model identifier.");
  const selected = cases.filter(test => ids.includes(test.fixture.id));
  return { selected, model, label, includeReviews };
}

export function redact(value: string, secrets: (string | undefined)[] = []): string {
  let output = value;
  for (const secret of secrets) if (secret?.trim()) output = output.split(secret.trim()).join("[REDACTED]");
  return output.replace(/sk-ant-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/g, "[REDACTED]");
}
