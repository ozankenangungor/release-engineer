import { describe, expect, it } from "vitest";
import {
  createVerificationRecord, EMPTY_FEEDBACK, handoffFilename, reportText,
  verificationRecordSchema, VERIFICATION_QUALIFICATION,
  type FindingAssessment,
} from "@/lib/verification-record";
import { handoffResponse } from "./verification-fixtures";

const identity = { recordId: "73fae4a6-f918-4b41-b18b-9bcf272ebaf1", recordedAt: "2026-10-09T12:00:00.000Z" };
const receipt = { receivedAt: "2026-10-09T11:00:00.000Z", interfaceRevision: "b".repeat(40) };
const assessment: FindingAssessment = {
  findingIndex: 0, title: "Will be replaced", file: "untrusted.ts", assessment: "not_checked", note: "",
};
const record = () => createVerificationRecord(handoffResponse(), receipt, { ...EMPTY_FEEDBACK }, [assessment], identity);

describe("local human-verification record", () => {
  it("pins the public PR, head, coverage and browser receipt without inventing an API revision", () => {
    const result = record();
    expect(result.reviewReference).toEqual({
      publicPrUrl: "https://github.com/octocat/hello-world/pull/1",
      reviewedHeadSha: "a".repeat(40), responseReceivedAt: receipt.receivedAt,
      interfaceRevision: receipt.interfaceRevision, includedFiles: 1, totalChangedFiles: 2, partialContext: true,
    });
    expect(result.qualification).toBe(VERIFICATION_QUALIFICATION);
    expect(result.findings[0]).toMatchObject({ title: "Response contract may change", file: "src/app.ts", assessment: "not_checked" });
    expect(JSON.stringify(result)).not.toMatch(/model|executionRevision|patch|email|response shape/);
  });
  it("preserves unknown receipt and interface fields as null", () => {
    const result = createVerificationRecord(handoffResponse(), { receivedAt: null, interfaceRevision: null }, EMPTY_FEEDBACK, [assessment], identity);
    expect(result.reviewReference.responseReceivedAt).toBeNull();
    expect(result.reviewReference.interfaceRevision).toBeNull();
  });
  it("starts unverified and requires evidence for an assessment, rating or recorded action", () => {
    expect(record().feedback).toEqual(EMPTY_FEEDBACK);
    expect(() => createVerificationRecord(handoffResponse(), receipt, EMPTY_FEEDBACK, [{ ...assessment, assessment: "supported", note: "  " }], identity)).toThrow();
    for (const feedback of [{ ...EMPTY_FEEDBACK, usefulness: "useful" as const }, { ...EMPTY_FEEDBACK, actionTaken: "changed_code" as const }])
      expect(() => createVerificationRecord(handoffResponse(), receipt, feedback, [assessment], identity)).toThrow();
    const result = createVerificationRecord(handoffResponse(), receipt, { ...EMPTY_FEEDBACK, usefulness: "mixed", note: "  Caller evidence was missing.  " }, [{ ...assessment, assessment: "needs_context", note: "  Check the caller contract.  " }], identity);
    expect(result.feedback.note).toBe("Caller evidence was missing.");
    expect(result.findings[0]?.note).toBe("Check the caller contract.");
  });
  it("supports no-findings feedback and rejects missing or duplicate finding references", () => {
    const response = handoffResponse();
    expect(() => createVerificationRecord(response, receipt, EMPTY_FEEDBACK, [], identity)).toThrow(/Every generated finding/);
    response.review.findings = [];
    const noFindings = createVerificationRecord(response, receipt, { ...EMPTY_FEEDBACK, note: "A concern was missed in this offline fixture." }, [], identity);
    expect(noFindings.findings).toEqual([]);
    const duplicate = record();
    duplicate.findings.push({ ...duplicate.findings[0]! });
    expect(verificationRecordSchema.safeParse(duplicate).success).toBe(false);
  });
  it("rejects added identity fields, forged qualification, unsafe URLs and impossible coverage", () => {
    const original = record();
    for (const value of [
      { ...original, email: "private@example.test" },
      { ...original, qualification: "Independently verified" },
      { ...original, reviewReference: { ...original.reviewReference, publicPrUrl: "https://github.com@evil.test/a/b/pull/1" } },
      { ...original, reviewReference: { ...original.reviewReference, reviewedHeadSha: "main" } },
      { ...original, reviewReference: { ...original.reviewReference, includedFiles: 3 } },
      { ...original, feedback: { ...original.feedback, note: "x".repeat(2_001) } },
    ]) expect(verificationRecordSchema.safeParse(value).success).toBe(false);
  });
  it("exports a readable report with full limitations and no execution or model provenance claim", () => {
    const response = handoffResponse();
    response.review.summary += "\u0000\u001b";
    const text = reportText(response, receipt);
    expect(text).toContain("Reviewed head: " + "a".repeat(40));
    expect(text).toContain("Changed files in context: 1/2");
    expect(text).toContain("Context: Partial");
    expect(text).toContain("One changed-file patch is unavailable");
    expect(text).toContain("API does not provide its execution revision or served model");
    expect(text).toContain("Tests were not run by Release Engineer");
    expect(text).toContain("Check the callers and run a compatibility test");
    expect(text).not.toMatch(/[\u0000\u001b]/);
    expect(handoffFilename(response, "review")).toBe("octocat-hello-world-pr-1-aaaaaaaa-review.txt");
    expect(handoffFilename(response, "verification")).toBe("octocat-hello-world-pr-1-aaaaaaaa-verification.json");
  });
});
