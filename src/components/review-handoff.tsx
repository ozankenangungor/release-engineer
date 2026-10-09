"use client";

import Link from "next/link";
import { useState } from "react";
import type { AnalysisResponse } from "@/lib/review-schema";
import {
  createVerificationRecord, EMPTY_FEEDBACK, handoffFilename, reportText,
  type Feedback, type FindingAssessment, type ReviewReceipt,
} from "@/lib/verification-record";

function download(content: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function ReviewHandoff({ result, receivedAt, interfaceRevision }: {
  result: AnalysisResponse; receivedAt: string | null; interfaceRevision: string | null;
}) {
  const [feedback, setFeedback] = useState<Feedback>({ ...EMPTY_FEEDBACK });
  const [assessments, setAssessments] = useState<FindingAssessment[]>(() =>
    result.review.findings.map((finding, findingIndex) => ({
      findingIndex, title: finding.title, file: finding.file, assessment: "not_checked", note: "",
    })),
  );
  const [recordId] = useState(() => crypto.randomUUID());
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const receipt: ReviewReceipt = { receivedAt, interfaceRevision };
  const hasFeedback = feedback.usefulness !== "not_assessed" || feedback.priorUse !== "not_recorded"
    || feedback.actionTaken !== "none_recorded" || feedback.note.trim() !== ""
    || assessments.some((finding) => finding.assessment !== "not_checked" || finding.note.trim() !== "");

  function updateFeedback<K extends keyof Feedback>(key: K, value: Feedback[K]) {
    setFeedback((current) => ({ ...current, [key]: value }));
    setError("");
    setStatus("");
  }
  function updateAssessment(index: number, update: Partial<FindingAssessment>) {
    setAssessments((current) => current.map((entry, i) => i === index ? { ...entry, ...update } : entry));
    setError("");
    setStatus("");
  }

  return (
    <section id="review-handoff" className="review-handoff" aria-labelledby="handoff-title">
      <div className="handoff-heading">
        <div>
          <p className="section-kicker">FROM FINDING TO FOLLOW-THROUGH</p>
          <h3 id="handoff-title">Take the review into your workflow.</h3>
          <p>Save the report for another reviewer. Record the evidence you checked and what you actually did.</p>
        </div>
        <button type="button" className="secondary-action" onClick={() => {
          try {
            download(reportText(result, receipt), "text/plain;charset=utf-8", handoffFilename(result, "review"));
            setStatus("Report prepared for download. Your browser controls where it is saved.");
            setError("");
          } catch { setError("The report could not be exported. Please try again."); }
        }}>Download report <span aria-hidden="true">↓</span></button>
      </div>
      <details className="verification-details">
        <summary>Record your human verification <span aria-hidden="true">+</span></summary>
        <form onSubmit={(event) => {
          event.preventDefault();
          setError("");
          setStatus("");
          if (!hasFeedback) {
            setError("Record an assessment or your overall feedback before exporting.");
            return;
          }
          try {
            const record = createVerificationRecord(result, receipt, feedback, assessments, {
              recordId, recordedAt: new Date().toISOString(),
            });
            download(JSON.stringify(record, null, 2), "application/json;charset=utf-8", handoffFilename(result, "verification"));
            setStatus("Verification record prepared for download. Nothing was submitted to Release Engineer.");
          } catch {
            setError("Explain your usefulness rating, recorded action and each finding you assessed, then try again.");
          }
        }}>
          <p className="verification-intro">These are your observations. A finding starts as unchecked; select a result only after reviewing its evidence. Your notes stay in this page until you download them. Reloading clears them.</p>
          {assessments.length ? assessments.map((entry, index) => (
            <fieldset key={index} className="verification-finding">
              <legend>{String(index + 1).padStart(2, "0")} / {entry.title}</legend>
              <div className="verification-fields">
                <div>
                  <label htmlFor={`assessment-${index}`}>Finding {index + 1} assessment</label>
                  <select id={`assessment-${index}`} value={entry.assessment} onChange={(event) =>
                    updateAssessment(index, { assessment: event.target.value as FindingAssessment["assessment"] })}>
                    <option value="not_checked">Not checked</option>
                    <option value="supported">Supported by my evidence</option>
                    <option value="incorrect">Incorrect in my review</option>
                    <option value="needs_context">Needs more context</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`assessment-note-${index}`}>Evidence checked for finding {index + 1}</label>
                  <textarea id={`assessment-note-${index}`} rows={3} maxLength={1_500}
                    required={entry.assessment !== "not_checked"} value={entry.note}
                    placeholder="Which public code, test result or contract did you check?"
                    onChange={(event) => updateAssessment(index, { note: event.target.value })} />
                </div>
              </div>
            </fieldset>
          )) : <p className="verification-empty">This report has no findings. You can still record its usefulness or a missed concern. No findings does not establish release safety.</p>}
          <fieldset className="verification-overall">
            <legend>Your review outcome</legend>
            <div className="verification-fields verification-selects">
              <div>
                <label htmlFor="review-usefulness">Was this review useful?</label>
                <select id="review-usefulness" value={feedback.usefulness} onChange={(event) => updateFeedback("usefulness", event.target.value as Feedback["usefulness"])}>
                  <option value="not_assessed">Not assessed</option>
                  <option value="useful">Useful</option>
                  <option value="mixed">Mixed</option>
                  <option value="not_useful">Not useful</option>
                </select>
              </div>
              <div>
                <label htmlFor="review-prior-use">Have you used it before?</label>
                <select id="review-prior-use" value={feedback.priorUse} onChange={(event) => updateFeedback("priorUse", event.target.value as Feedback["priorUse"])}>
                  <option value="not_recorded">Prefer not to record</option>
                  <option value="first_review">This is my first review</option>
                  <option value="used_before">I have used it before</option>
                </select>
              </div>
              <div>
                <label htmlFor="review-action">What did you do?</label>
                <select id="review-action" value={feedback.actionTaken} onChange={(event) => updateFeedback("actionTaken", event.target.value as Feedback["actionTaken"])}>
                  <option value="none_recorded">No action recorded</option>
                  <option value="checked_evidence">Checked the evidence</option>
                  <option value="changed_code">Changed code</option>
                  <option value="added_or_changed_tests">Added or changed tests</option>
                  <option value="requested_human_review">Requested human review</option>
                  <option value="other">Another action</option>
                </select>
              </div>
            </div>
            <label htmlFor="review-feedback-note">What was useful, wrong or missing?</label>
            <textarea id="review-feedback-note" rows={4} maxLength={2_000} required={feedback.usefulness !== "not_assessed" || feedback.actionTaken !== "none_recorded"}
              value={feedback.note} placeholder="Describe what you verified or changed. Leave out secrets and private information."
              onChange={(event) => updateFeedback("note", event.target.value)} />
          </fieldset>
          <div className="verification-footer">
            <button type="submit" className="primary-action">Download verification record <span aria-hidden="true">↓</span></button>
            <p>Downloads are saved on your device. Review them before sharing. <Link href="/pilot">Beta feedback guide ↗︎</Link></p>
          </div>
        </form>
      </details>
      {error ? <p className="handoff-error" role="alert" aria-label="Export error">{error}</p> : null}
      <p className="handoff-status" role="status" aria-live="polite">{status}</p>
    </section>
  );
}
