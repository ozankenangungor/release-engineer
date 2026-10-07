import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const directories: string[] = [];
afterEach(() =>
  directories
    .splice(0)
    .forEach((path) => rmSync(path, { recursive: true, force: true })),
);
const ids = [
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
];
function event(
  id: string,
  type = "analysis_succeeded",
  environment = "production",
  timestamp = "2026-10-08T12:00:00Z",
) {
  return {
    namespace: "release_engineer_usage",
    schemaVersion: 1,
    analysisId: id,
    environment,
    timestamp,
    event: type,
    ...(type === "analysis_started" ? {} : { durationMs: 1 }),
    ...(type === "analysis_succeeded"
      ? { changedFileCount: 2, includedFileCount: 1, partialContext: true }
      : type === "analysis_failed"
        ? { errorCode: "PR_NOT_FOUND" }
        : {}),
  };
}
function args(events: unknown[], excluded: string[] = []) {
  const dir = mkdtempSync(join(tmpdir(), "usage-evidence-test-"));
  directories.push(dir);
  const input = join(dir, "events.ndjson"),
    exclusions = join(dir, "excluded.json");
  writeFileSync(input, events.map((x) => JSON.stringify(x)).join("\n"));
  writeFileSync(exclusions, JSON.stringify(excluded));
  return [
    "scripts/summarize-live-usage.mjs",
    input,
    "--from",
    "2026-10-08T00:00:00Z",
    "--to",
    "2026-10-09T00:00:00Z",
    "--exclude-ids",
    exclusions,
  ];
}
describe("preserved usage aggregation", () => {
  it("deduplicates overlapping exports, excludes operator and preview records and uses a half-open UTC window", () => {
    const result = JSON.parse(
      execFileSync(
        process.execPath,
        args(
          [
            event(ids[0]!, "analysis_started"),
            event(ids[0]!),
            event(ids[0]!),
            event(ids[1]!),
            event(ids[2]!, "analysis_succeeded", "preview"),
            event(
              ids[2]!,
              "analysis_succeeded",
              "production",
              "2026-10-09T00:00:00Z",
            ),
          ],
          [ids[1]!],
        ),
        { encoding: "utf8" },
      ),
    );
    expect(result.successfulAnalyses).toBe(1);
    expect(result.startedAnalyses).toBe(1);
    expect(result.duplicateEventsDiscarded).toBe(1);
    expect(result.excludedOperatorAttempts).toBe(1);
    expect(result.successesWithoutStart).toBe(0);
    expect(result.successfulPartialContextAnalyses).toBe(1);
  });
  it("reports orphan successes and failures separately without treating starts as successes", () => {
    const result = JSON.parse(
      execFileSync(
        process.execPath,
        args([
          event(ids[0]!),
          event(ids[1]!, "analysis_failed"),
          event(ids[2]!, "analysis_started"),
        ]),
        { encoding: "utf8" },
      ),
    );
    expect(result.successfulAnalyses).toBe(1);
    expect(result.successesWithoutStart).toBe(1);
    expect(result.failedAnalyses).toBe(1);
    expect(result.startedAnalyses).toBe(1);
  });
  it.each([
    [{ ...event(ids[0]!), prUrl: "private-content-must-not-appear" }],
    [event(ids[0]!), event(ids[0]!, "analysis_failed")],
    [event(ids[0]!), { ...event(ids[0]!), changedFileCount: 99 }],
  ])(
    "fails closed for unsanitized or conflicting records without echoing content",
    (...records) => {
      const result = spawnSync(process.execPath, args(records), {
        encoding: "utf8",
      });
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).not.toContain("private-content-must-not-appear");
    },
  );
});
