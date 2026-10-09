import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { summarizePilot } from "../scripts/summarize-pilot";
import { createVerificationRecord, EMPTY_FEEDBACK, type VerificationRecord } from "@/lib/verification-record";
import { handoffResponse } from "./verification-fixtures";

const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });
const makeRecord = () => createVerificationRecord(handoffResponse(), { receivedAt: null, interfaceRevision: null }, {
  ...EMPTY_FEEDBACK, usefulness: "useful", priorUse: "used_before", actionTaken: "checked_evidence",
  note: "PRIVATE-NOTE: self-reported test observation, not product evidence.",
}, [{ findingIndex: 0, title: "Fixture", file: null, assessment: "supported", note: "PRIVATE-EVIDENCE: fixture only." }], {
  recordId: randomUUID(), recordedAt: "2026-10-09T12:00:00.000Z",
});
function setup() {
  const root = mkdtempSync(join(tmpdir(), "release-pilot-"));
  directories.push(root);
  const records = join(root, "records"), manifest = join(root, "admissions.json");
  mkdirSync(records);
  const admissions: Record<string, unknown>[] = [];
  const add = (record: VerificationRecord, source?: "external_tester" | "founder_test" | "scripted_check", pseudonym = "tester_one") => {
    const path = join(records, `${record.recordId}.json`);
    writeFileSync(path, JSON.stringify(record));
    if (source) admissions.push({
      recordId: record.recordId, fileSha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
      observationSource: source, participantPseudonym: pseudonym,
      sourceCheckedByOperator: true, consentToRetain: true, retentionUntil: "2099-01-01T00:00:00.000Z",
    });
    return path;
  };
  const args = () => {
    writeFileSync(manifest, JSON.stringify(admissions));
    return [records, "--admissions", manifest, "--from", "2026-10-09T00:00:00.000Z", "--to", "2026-10-10T00:00:00.000Z"];
  };
  return { records, admissions, add, args };
}

describe("operator-admitted offline pilot summary", () => {
  it("keeps founder/scripted/unadmitted records out of external outcomes and never prints notes", () => {
    const pilot = setup();
    pilot.add(makeRecord(), "external_tester");
    pilot.add(makeRecord(), "external_tester");
    pilot.add(makeRecord(), "founder_test");
    pilot.add(makeRecord(), "scripted_check");
    pilot.add(makeRecord());
    const result = summarizePilot(pilot.args());
    expect(result).toMatchObject({
      admittedRecordsBySource: { external_tester: 2, founder_test: 1, scripted_check: 1 },
      externalFeedbackRecords: 2, distinctExternalParticipantPseudonyms: 1,
      unadmittedRecordsExcluded: 1, externalRecordsReportingPriorUse: 2,
      externalSelfReportedUsefulness: { useful: 2 }, externalSelfReportedFindingAssessments: { supported: 2 },
      externalSelfReportedActions: { checked_evidence: 2 },
    });
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE-|tester_one|github.com|octocat/);
    expect(result).toHaveProperty("qualification", expect.stringContaining("Not customers, accuracy"));
  });
  it("deduplicates identical files and excludes records outside the creation-time window", () => {
    const pilot = setup(), record = makeRecord();
    const path = pilot.add(record, "external_tester");
    writeFileSync(join(pilot.records, "copy.json"), readFileSync(path));
    pilot.add({ ...makeRecord(), recordedAt: "2026-10-10T00:00:00.000Z" }, "external_tester");
    expect(summarizePilot(pilot.args())).toMatchObject({
      uniqueRecordIdsObserved: 2, duplicateFilesDiscarded: 1, admittedRecordsOutsideWindow: 1, externalFeedbackRecords: 1,
    });
  });
  it("rejects conflicting export versions, edited admissions and missing source checks", () => {
    const pilot = setup(), record = makeRecord();
    pilot.add(record, "external_tester");
    const conflict = join(pilot.records, "conflict.json");
    writeFileSync(conflict, JSON.stringify({ ...record, recordedAt: "2026-10-09T13:00:00.000Z" }));
    expect(() => summarizePilot(pilot.args())).toThrow(/Conflicting versions/);
    rmSync(conflict);
    pilot.admissions[0]!.fileSha256 = "a".repeat(64);
    expect(() => summarizePilot(pilot.args())).toThrow(/admission hash/);
    pilot.admissions[0]!.sourceCheckedByOperator = false;
    expect(() => summarizePilot(pilot.args())).toThrow();
  });
  it("rejects expired consent, missing records, additional identity and duplicate admission IDs", () => {
    const pilot = setup();
    const path = pilot.add(makeRecord(), "external_tester");
    pilot.admissions[0]!.retentionUntil = "2000-01-01T00:00:00.000Z";
    expect(() => summarizePilot(pilot.args())).toThrow(/retention has expired/);
    pilot.admissions[0]!.retentionUntil = "2099-01-01T00:00:00.000Z";
    pilot.admissions.push({ ...pilot.admissions[0]! });
    expect(() => summarizePilot(pilot.args())).toThrow(/duplicate record ID/);
    pilot.admissions.pop();
    const original = JSON.parse(readFileSync(path, "utf8"));
    writeFileSync(path, JSON.stringify({ ...original, email: "private@example.test" }));
    expect(() => summarizePilot(pilot.args())).toThrow();
    rmSync(path);
    expect(() => summarizePilot(pilot.args())).toThrow(/missing feedback file/);
  });
  it("runs the real CLI offline and redacts schema errors and private file paths", () => {
    const pilot = setup();
    const path = pilot.add(makeRecord(), "scripted_check");
    const valid = spawnSync(process.execPath, ["scripts/run-pilot.mjs", ...pilot.args()], { encoding: "utf8", timeout: 30_000 });
    expect(valid.status).toBe(0);
    expect(JSON.parse(valid.stdout)).toMatchObject({ admittedRecordsBySource: { scripted_check: 1 }, externalFeedbackRecords: 0 });
    expect(valid.stdout).not.toMatch(/PRIVATE-|tester_one|github.com/);
    writeFileSync(path, JSON.stringify({ ...makeRecord(), email: "PRIVATE-IDENTITY@example.test" }));
    const run = spawnSync(process.execPath, ["scripts/run-pilot.mjs", ...pilot.args()], { encoding: "utf8", timeout: 30_000 });
    expect(run.status).toBe(2);
    expect(run.stderr).toContain("no input data was printed");
    expect(run.stderr).not.toMatch(/PRIVATE-|release-pilot-|example.test/);
    expect(run.stdout).toBe("");
  });
});
