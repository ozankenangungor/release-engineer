import type { Metadata } from "next";
import Link from "next/link";

const title = "Beta feedback — Release Engineer";
const description = "Try one public GitHub pull request, verify the evidence and record what Release Engineer changed in your review.";
export const metadata: Metadata = {
  title, description, alternates: { canonical: "/pilot" },
  openGraph: { title, description, url: "/pilot", type: "website" },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};

const steps = [
  {
    title: "Choose a change you can verify.",
    description: "Use a public PR you own or contribute to. An API contract, a behavior change or a testing gap gives you something specific to inspect. Keep private code, secrets and sensitive vulnerability details out of the review.",
    label: "PUBLIC CHANGE",
  },
  {
    title: "Keep the reviewed version.",
    description: "Analyze the PR and check its reviewed head SHA and coverage warnings. Download the report to keep its findings and limitations with that exact version. Later commits can change the conclusion.",
    label: "PINNED EVIDENCE",
  },
  {
    title: "Check the findings yourself.",
    description: "Inspect the code, callers and actual test results. In Save & verify, leave each finding unchecked until you have evidence. Record supported, incorrect or needs more context, with a short explanation. No findings does not prove release safety.",
    label: "HUMAN VERIFICATION",
  },
  {
    title: "Tell us what you actually did.",
    description: "Record whether the report was useful and whether you checked evidence, changed code, added tests or requested another review. Download your verification record. Review it before choosing what to share with the founder.",
    label: "OBSERVED OUTCOME",
  },
];

export default function Pilot() {
  return (
    <main id="main" className="page-shell pilot-page">
      <div className="pilot-hero">
        <p className="section-kicker">RELEASE ENGINEER / EARLY BETA</p>
        <h1 className="page-title">Review one change.<br /><span>Tell us what held up.</span></h1>
        <p className="page-intro">We’re validating a second review for maintainers and developers working on public API and behavior changes. Useful, incorrect and inconclusive findings all help us understand where the product earns its place.</p>
        <div className="pilot-actions">
          <Link href="/#analyze" className="primary-action">Analyze your public PR <span aria-hidden="true">↗︎</span></Link>
          <Link href="/#report-preview" className="text-link">Explore the illustrative example ↗︎</Link>
        </div>
      </div>
      <ol className="pilot-sequence">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className="pilot-step-number">0{index + 1}</span>
            <div><p className="section-kicker">{step.label}</p><h2>{step.title}</h2></div>
            <p>{step.description}</p>
          </li>
        ))}
      </ol>
      <section className="pilot-feedback" aria-labelledby="pilot-feedback-title">
        <div>
          <p className="section-kicker">A CONVERSATION, WITH EVIDENCE</p>
          <h2 id="pilot-feedback-title">Share the result<br />of your review.</h2>
        </div>
        <div>
          <p>After checking your download, you can email the founder with what was useful, wrong or missing. Include the public PR and reviewed head only if you’re comfortable sharing them. Feedback is voluntary.</p>
          <a href="mailto:founder@releaseengineer.tech?subject=Release%20Engineer%20beta%20feedback" className="text-link">Write to founder@releaseengineer.tech ↗︎</a>
          <p className="pilot-privacy-note">Downloads and notes stay on your device; this page does not submit them. Email is a separate action through your mail provider. Feedback will not be published without separate permission. Agree how long a retained pilot record may be kept.</p>
          <a href="/verification-worksheet.txt" download className="text-link">Download a blank feedback worksheet ↓</a>
        </div>
      </section>
      <section className="pilot-boundaries" aria-labelledby="pilot-boundaries-title">
        <h2 id="pilot-boundaries-title">What this beta can establish</h2>
        <p>Your observation can show whether a report helped your review and what you checked. The application reviews supplied PR metadata and patches; it does not inspect the full repository or run tests. Feedback and repeat-use answers are self-reported.</p>
        <p>Current published feedback, the founder-run Rails observation and dated synthetic evaluations are available in the <Link href="/evidence" className="text-link">evidence index ↗︎</Link>.</p>
        <p>Independently built and operated by Ozan Kenan Güngör in Ankara, Türkiye. Launched in October 2026. No legal company has been incorporated or registered.</p>
      </section>
    </main>
  );
}
