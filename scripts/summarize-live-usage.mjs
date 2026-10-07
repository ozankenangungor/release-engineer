import { createReadStream, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { z } from "zod";

const common = {
  namespace: z.literal("release_engineer_usage"),
  schemaVersion: z.literal(1),
  timestamp: z.iso.datetime(),
  analysisId: z.uuid(),
  environment: z.enum(["production", "preview", "development", "local"]),
  productCommit: z
    .string()
    .regex(/^[a-f0-9]{40}$/)
    .optional(),
};
const count = z.number().int().min(0).max(1_000_000);
const eventSchema = z.discriminatedUnion("event", [
  z.strictObject({ ...common, event: z.literal("analysis_started") }),
  z.strictObject({
    ...common,
    event: z.literal("analysis_succeeded"),
    durationMs: count,
    changedFileCount: count,
    includedFileCount: count,
    partialContext: z.boolean(),
  }),
  z.strictObject({
    ...common,
    event: z.literal("analysis_failed"),
    durationMs: count,
    errorCode: z.enum([
      "PR_NOT_FOUND",
      "PUBLIC_ONLY",
      "PR_TOO_LARGE",
      "PR_MOVED",
      "GITHUB_RATE_LIMIT",
      "GITHUB_UNAVAILABLE",
      "GITHUB_RESPONSE",
      "GITHUB_CONFIGURATION",
      "ANALYSIS_TIMEOUT",
      "PR_CHANGED",
      "CLAUDE_RATE_LIMIT",
      "CLAUDE_UNAVAILABLE",
      "CLAUDE_CONFIGURATION",
      "INVALID_REVIEW",
      "ANALYSIS_FAILED",
      "REQUEST_ABORTED",
    ]),
  }),
]);

async function main() {
  const [file, ...options] = process.argv.slice(2);
  if (!file || options.length % 2) throw new Error("arguments");
  const values = new Map();
  for (let i = 0; i < options.length; i += 2) {
    const key = options[i];
    if (!["--from", "--to", "--exclude-ids"].includes(key) || values.has(key))
      throw new Error("arguments");
    values.set(key, options[i + 1]);
  }
  const from = z.iso.datetime().parse(values.get("--from"));
  const to = z.iso.datetime().parse(values.get("--to"));
  if (Date.parse(from) >= Date.parse(to)) throw new Error("window");
  const excluded = new Set(
    values.has("--exclude-ids")
      ? z
          .array(z.uuid())
          .parse(JSON.parse(readFileSync(values.get("--exclude-ids"), "utf8")))
      : [],
  );
  const records = new Map();
  let duplicates = 0;
  let lineNumber = 0;
  const lines = createInterface({
    input: createReadStream(file),
    crlfDelay: Infinity,
  });
  for await (const line of lines) {
    lineNumber++;
    if (!line.trim()) continue;
    let event;
    try {
      event = eventSchema.parse(JSON.parse(line));
    } catch {
      throw new Error(
        `Invalid sanitized event at line ${lineNumber}. Export only version 1 application events; no hosting metadata or extra fields.`,
      );
    }
    if (event.environment !== "production") continue;
    const record = records.get(event.analysisId) ?? {};
    const existing = record[event.event];
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(event))
        throw new Error(`Conflicting duplicate event at line ${lineNumber}.`);
      duplicates++;
      continue;
    }
    record[event.event] = event;
    if (record.analysis_failed && record.analysis_succeeded)
      throw new Error(`Conflicting outcomes at line ${lineNumber}.`);
    records.set(event.analysisId, record);
  }
  const inWindow = (event) =>
    event &&
    Date.parse(event.timestamp) >= Date.parse(from) &&
    Date.parse(event.timestamp) < Date.parse(to);
  let started = 0,
    succeeded = 0,
    failed = 0,
    partial = 0,
    missingStarts = 0,
    excludedAttempts = 0;
  for (const [id, record] of records) {
    if (excluded.has(id)) {
      if (Object.values(record).some(inWindow)) excludedAttempts++;
      continue;
    }
    if (inWindow(record.analysis_started)) started++;
    if (inWindow(record.analysis_succeeded)) {
      succeeded++;
      if (record.analysis_succeeded.partialContext) partial++;
      if (!record.analysis_started) missingStarts++;
    }
    if (inWindow(record.analysis_failed)) failed++;
  }
  console.log(
    JSON.stringify(
      {
        fromInclusiveUtc: from,
        toExclusiveUtc: to,
        environment: "production",
        startedAnalyses: started,
        successfulAnalyses: succeeded,
        failedAnalyses: failed,
        successfulPartialContextAnalyses: partial,
        excludedOperatorAttempts: excludedAttempts,
        duplicateEventsDiscarded: duplicates,
        successesWithoutStart: missingStarts,
        operatorExclusionsSupplied: values.has("--exclude-ids"),
        qualification:
          "Observed server outcomes only. Export completeness, real usage and operator exclusions require human verification. Not users or customers.",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  // Never echo raw lines, file contents, provider data or parse error values.
  console.error(
    error.message.startsWith("Invalid sanitized") ||
      error.message.startsWith("Conflicting")
      ? error.message
      : "Could not summarize. Use: node scripts/summarize-live-usage.mjs /private/events.ndjson --from UTC_ISO --to UTC_ISO [--exclude-ids /private/operator-ids.json]",
  );
  process.exitCode = 1;
});
