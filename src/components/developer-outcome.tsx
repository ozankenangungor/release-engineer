import Link from "next/link";
export function DeveloperOutcome() {
  return <section className="developer-outcome section-shell" aria-labelledby="outcome-title">
    <div><p className="section-kicker">IN USE / WEBHOOK REVIEW</p><h2 id="outcome-title">A finding.<br /><span>A concrete improvement.</span></h2>
      <p>A developer reported tightening Base64 secret validation and adding two edge-case tests after reviewing the report.</p>
      <Link className="text-link" href="/case-studies/webhook-review">Read Daniel’s review outcome ↗︎</Link></div>
    <figure><blockquote>“Caught a missing validate=True in my base64 secret decoding right after I wrote the code. The tool doesn’t run tests, and it says so — that honesty is why I trust the rest of the report.”</blockquote><figcaption>Daniel Reyes <span>Backend Developer · Published with permission</span></figcaption></figure>
  </section>;
}
