"use client";
import { useState, useRef } from "react";
import { MAX_COMPARISON_BYTES, parseComparisonInput, compareReviews, type ComparisonInput } from "@/lib/review-comparison";

const labels = { reported_again: "Reported again", newly_reported: "Newly reported", not_reported_again: "Not reported again · Verify" };
export function RevisionComparison() {
  const [previous, setPrevious] = useState<ComparisonInput | null>(null);
  const [current, setCurrent] = useState<ComparisonInput | null>(null);
  const [error, setError] = useState("");
  const [example, setExample] = useState(false);
  const [inputVersion, setInputVersion] = useState(0);
  const versions = useRef<[number, number]>([0, 0]);
  async function read(file: File | undefined, slot: 0 | 1) {
    const version = ++versions.current[slot];
    setError(""); setExample(false);
    if (slot === 0) setPrevious(null); else setCurrent(null);
    if (!file) return;
    try {
      if (file.size > MAX_COMPARISON_BYTES) throw new Error("Choose a JSON file smaller than 1 MiB.");
      const value = parseComparisonInput(await file.text());
      if (version !== versions.current[slot]) return;
      if (slot === 0) setPrevious(value); else setCurrent(value);
    } catch (failure) {
      if (version === versions.current[slot]) setError(failure instanceof Error ? failure.message : "The file could not be read.");
    }
  }
  let comparison: ReturnType<typeof compareReviews> | null = null;
  let comparisonError = "";
  if (previous && current) {
    try { comparison = compareReviews(previous, current); }
    catch (failure) { comparisonError = failure instanceof Error ? failure.message : "These records could not be compared."; }
  }
  function reset() {
    versions.current = [versions.current[0] + 1, versions.current[1] + 1];
    setInputVersion(v => v + 1);
    setPrevious(null); setCurrent(null); setError(""); setExample(false);
  }
  return <section className="revision-workspace" aria-labelledby="comparison-title">
    <header><div><p className="section-kicker">REVISION / REVIEW</p><h2 id="comparison-title">Follow the change.</h2></div>
      <button className="secondary-action" onClick={reset}>Clear comparison</button></header>
    <div className="revision-inputs">{([0, 1] as const).map((slot) => <div key={slot}>
      <label htmlFor={`revision-${slot}`}>{slot === 0 ? "01 / Earlier review" : "02 / Later review"}</label>
      <input key={inputVersion} id={`revision-${slot}`} type="file" accept=".json,application/json" onChange={(event) => void read(event.target.files?.[0], slot)} />
      <p>Review JSON or Verification JSON · Up to 1 MiB</p>
    </div>)}</div>
    <div className="revision-controls"><p>Files are read in this tab. Nothing is uploaded or saved.</p>
      <button className="text-link" onClick={() => {
        reset(); setExample(true);
        const common = { url: "https://github.com/example/webhooks/pull/42", partial: false, source: "report" as const };
        const secret = { title: "Secret decoding accepts invalid characters", file: "app/webhooks.py" };
        const tests = { title: "Non-object JSON branch lacks a test", file: "tests/test_webhooks.py" };
        setPrevious({ ...common, head: "a".repeat(40), findings: [secret, tests] });
        setCurrent({ ...common, head: "b".repeat(40), findings: [tests, { title: "Rollout flag needs an explicit production default", file: "app/config.py" }] });
      }}>Load illustrative comparison ↗︎</button></div>
    {(error || comparisonError) && <p role="alert" aria-label="Comparison error" className="revision-error">{error || comparisonError}</p>}
    {comparison && previous && current ? <div aria-live="polite">
      {example && <p className="revision-note">Illustrative example — not a live analysis or Daniel’s report.</p>}
      <div className="revision-heads"><code>{previous.head.slice(0, 12)}</code><span aria-hidden="true">→</span><code>{current.head.slice(0, 12)}</code></div>
      {comparison.sameHead && <p className="revision-note">Same reviewed head. This compares reports, not different code revisions.</p>}
      {comparison.partial && <p className="revision-note">One or both records have partial context. Absence may reflect omitted evidence.</p>}
      <ul className="revision-findings">{comparison.rows.map((row, index) => <li key={index} data-status={row.status}>
        <span>{labels[row.status]}</span><h3>{row.title}</h3><code>{row.file ?? "No file attributed"}</code>
      </li>)}</ul>
      {!comparison.rows.length && <p>No findings in either record. This does not establish release safety.</p>}
      <p className="revision-note">Matching uses the exact file and normalized title. A renamed finding can appear as a new item. “Not reported again” does not mean fixed: check the diff and run your tests. Records are user-provided and are not signed attestations.</p>
    </div> : <div className="revision-empty"><span aria-hidden="true">↗</span><h3>Two reviews. A clearer next step.</h3><p>Export a Review JSON after each analysis, then open both here to see which findings were reported again.</p></div>}
  </section>;
}
