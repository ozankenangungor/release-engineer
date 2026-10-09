import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import { verificationRecordSchema, type VerificationRecord } from "../src/lib/verification-record";

const usage = "Use: pnpm pilot:summarize /private/records --admissions /private/admissions.json --from UTC_ISO --to UTC_ISO";
const admissionSchema = z.strictObject({
  recordId: z.uuid(),
  fileSha256: z.string().regex(/^[a-f0-9]{64}$/),
  observationSource: z.enum(["external_tester", "founder_test", "scripted_check"]),
  participantPseudonym: z.string().regex(/^[a-z][a-z0-9_-]{2,63}$/),
  sourceCheckedByOperator: z.literal(true),
  consentToRetain: z.literal(true),
  retentionUntil: z.iso.datetime(),
});

class PilotInputError extends Error {}
function fail(message: string): never { throw new PilotInputError(message); }
function boundedFile(path: string): Buffer {
  const stat = statSync(path);
  if (!stat.isFile() || stat.size > 1_000_000) fail("A record or admission file exceeded the allowed file size.");
  return readFileSync(path);
}

export function summarizePilot(args: string[]) {
  if (args.length === 1 && args[0] === "--help") return { usage };
  const [directory, ...options] = args;
  if (!directory || options.length !== 6) fail(usage);
  const parameters = new Map<string, string>();
  for (let i = 0; i < options.length; i += 2) {
    const key = options[i]!;
    if (!["--admissions", "--from", "--to"].includes(key) || parameters.has(key)) fail(usage);
    parameters.set(key, options[i + 1]!);
  }
  const from = z.iso.datetime().parse(parameters.get("--from"));
  const to = z.iso.datetime().parse(parameters.get("--to"));
  if (Date.parse(from) >= Date.parse(to)) fail("The observation window must have a start before its end.");
  const admissions = z.array(admissionSchema).max(500).parse(JSON.parse(boundedFile(parameters.get("--admissions")!).toString("utf8")));
  const admitted = new Map<string, z.infer<typeof admissionSchema>>();
  for (const admission of admissions) {
    if (admitted.has(admission.recordId)) fail("The admission manifest contains a duplicate record ID.");
    if (Date.parse(admission.retentionUntil) <= Date.now()) fail("An admission's agreed retention has expired; review or remove that record before proceeding.");
    admitted.set(admission.recordId, admission);
  }
  const filenames = readdirSync(directory).filter((name) => name.endsWith(".json"));
  if (filenames.length > 500) fail("Too many feedback files; use a bounded observation window.");
  const records = new Map<string, { hash: string; data: VerificationRecord }>();
  let duplicates = 0;
  for (const filename of filenames) {
    const bytes = boundedFile(join(directory, filename));
    const data = verificationRecordSchema.parse(JSON.parse(bytes.toString("utf8")));
    const hash = createHash("sha256").update(bytes).digest("hex");
    const previous = records.get(data.recordId);
    if (previous) {
      if (previous.hash !== hash) fail("Conflicting versions of one record were supplied; choose the final version and update its admission hash.");
      duplicates++;
      continue;
    }
    records.set(data.recordId, { hash, data });
  }
  for (const id of admitted.keys()) if (!records.has(id)) fail("The admission manifest references a missing feedback file.");
  const sources = { external_tester: 0, founder_test: 0, scripted_check: 0 };
  const usefulness = { useful: 0, mixed: 0, not_useful: 0, not_assessed: 0 };
  const assessments = { not_checked: 0, supported: 0, incorrect: 0, needs_context: 0 };
  const actions = { none_recorded: 0, checked_evidence: 0, changed_code: 0, added_or_changed_tests: 0, requested_human_review: 0, other: 0 };
  const pseudonyms = new Set<string>();
  let unadmitted = 0, outsideWindow = 0, partial = 0, returning = 0, eligibleExternal = 0;
  for (const [id, { hash, data }] of records) {
    const admission = admitted.get(id);
    if (!admission) { unadmitted++; continue; }
    if (admission.fileSha256 !== hash) fail("A feedback file does not match its operator-reviewed admission hash.");
    if (Date.parse(data.recordedAt) < Date.parse(from) || Date.parse(data.recordedAt) >= Date.parse(to)) { outsideWindow++; continue; }
    sources[admission.observationSource]++;
    // Founder and scripted records stay out of external usefulness/outcome totals.
    if (admission.observationSource !== "external_tester") continue;
    eligibleExternal++;
    pseudonyms.add(admission.participantPseudonym);
    if (data.reviewReference.partialContext) partial++;
    if (data.feedback.priorUse === "used_before") returning++;
    usefulness[data.feedback.usefulness]++;
    actions[data.feedback.actionTaken]++;
    for (const finding of data.findings) assessments[finding.assessment]++;
  }
  return {
    fromInclusiveUtc: from, toExclusiveUtc: to,
    uniqueRecordIdsObserved: records.size, duplicateFilesDiscarded: duplicates,
    unadmittedRecordsExcluded: unadmitted, admittedRecordsOutsideWindow: outsideWindow,
    admittedRecordsBySource: sources,
    externalFeedbackRecords: eligibleExternal,
    distinctExternalParticipantPseudonyms: pseudonyms.size,
    externalPartialContextRecords: partial,
    externalRecordsReportingPriorUse: returning,
    externalSelfReportedUsefulness: usefulness,
    externalSelfReportedFindingAssessments: assessments,
    externalSelfReportedActions: actions,
    qualification: "Operator-attested source and consent; user-recorded observations. Pseudonyms do not independently prove unique people. Not customers, accuracy, verified defects or production usage totals. Window uses record creation time, not analysis execution time. No raw notes or identifiers are included.",
  };
}

if (typeof require !== "undefined" && require.main === module) {
  try { console.log(JSON.stringify(summarizePilot(process.argv.slice(2)), null, 2)); }
  catch (error) {
    console.error(error instanceof PilotInputError ? error.message : "Could not summarize private pilot records. Check the schema, files and admission manifest; no input data was printed.");
    process.exitCode = 2;
  }
}
