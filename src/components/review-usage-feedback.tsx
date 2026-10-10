"use client";
import { useState } from "react";
import { useAccount } from "./account-context";
export function ReviewUsageFeedback({ recordId }: { recordId: string | null }) {
  const { account } = useAccount();
  const [usefulness, setUsefulness] = useState("");
  const [action, setAction] = useState("none_recorded");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  if (!account || !recordId) return null;
  return <form className="review-usage-feedback" onSubmit={async (event) => {
    event.preventDefault(); if (busy) return; setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/account/review-feedback", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({recordId,usefulness,action}),signal:AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error("Feedback unavailable");
      setStatus("Feedback saved. This is your reported experience; no code or notes were sent.");
    } catch { setStatus("Your feedback could not be saved. Please retry."); }
    finally { setBusy(false); }
  }}><h3>Was this review useful?</h3><p>Optional: share two choices to help improve the product. They are linked to this review and your account; no PR contents or free-text notes are sent.</p>
    <label>Usefulness<select required value={usefulness} onChange={event=>setUsefulness(event.target.value)}><option value="" disabled>Choose your experience</option><option value="useful">Useful</option><option value="mixed">Mixed</option><option value="not_useful">Not useful</option></select></label>
    <label>What did you do?<select value={action} onChange={event=>setAction(event.target.value)}><option value="none_recorded">No action recorded</option><option value="checked_evidence">Checked the evidence</option><option value="changed_code">Changed code</option><option value="added_or_changed_tests">Added or changed tests</option><option value="requested_human_review">Requested human review</option></select></label>
    <button type="submit" className="secondary-action" disabled={busy}>{busy ? "Saving…" : "Share usage-only feedback"}</button><p role="status">{status}</p>
  </form>;
}
