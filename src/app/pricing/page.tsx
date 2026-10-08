import type { Metadata } from "next";
import Link from "next/link";
import { FREE_DAILY_REVIEWS, PRO_DAILY_REVIEWS } from "@/lib/free-plan";
import { CheckoutPreview } from "@/components/checkout-preview";
import "./pricing.css";

const title = "Pricing — Release Engineer";
const description = "Start with 10 free public GitHub PR reviews a day. Explore Pro at $9/month with a 100-review daily subscription allowance and preview its checkout in sandbox.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/pricing" },
  openGraph: { title, description, url: "/pricing", type: "website" },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};

const plans = [
  {
    name: "Free", status: "Available now", price: "0", unit: "No subscription",
    description: "A second perspective on your next public pull request.",
    allowance: `${FREE_DAILY_REVIEWS} reviews / day`, scope: "Per browser · resets at 00:00 UTC",
    features: ["Public GitHub pull requests", "Structured risks and testing gaps", "Reviewed head SHA and coverage limits", "Downloadable report and verification record", "No account or credit card required"],
    href: "/#analyze", action: "Analyze a PR", live: true,
  },
  {
    name: "Pro", status: "Sandbox preview", price: "9", unit: "/ month · 1 developer",
    description: "More room for public pull-request review.",
    allowance: `${PRO_DAILY_REVIEWS} reviews / day`, scope: "Subscription allowance · resets at 00:00 UTC",
    features: ["Public GitHub pull requests", "Structured risks and testing gaps", "Reviewed head SHA and coverage limits", "Downloadable report and verification record", "100-review daily subscription allowance"],
    href: "mailto:founder@releaseengineer.tech?subject=Release%20Engineer%20Pro%20access", action: "Request Pro access", live: false,
  },
];

const comparison = [
  ["Daily allowance", "10 / day / browser", "100 / day / subscriber"],
  ["Repository access", "Public", "Public"],
  ["Developers", "No account required", "1"],
  ["Review input", "Paste a public PR URL", "Paste a public PR URL"],
  ["Report & verification downloads", "Available", "Included"],
  ["Review evidence & coverage limits", "Included", "Included"],
  ["Report storage", "Download to your device", "Download to your device"],
];

export default function Pricing() {
  return (
    <main id="main" className="pricing-page">
      <section className="pricing-hero" aria-labelledby="pricing-title">
        <div className="pricing-orbit" aria-hidden="true"><i /><i /><i /></div>
        <p className="section-kicker"><span className="pricing-signal" aria-hidden="true" /> RELEASE ENGINEER / PRICING</p>
        <h1 id="pricing-title">Start with the diff.<br /><span>Build release confidence.</span></h1>
        <p className="pricing-intro">Try a structured Claude review on your public PR, free.<br className="pricing-desktop-break" /> Choose your next workflow as the product grows.</p>
        <div className="pricing-hero-note"><span aria-hidden="true">↳</span> Start free. Explore Pro at $9/month in the sandbox checkout.</div>
      </section>

      <section className="pricing-plans" aria-label="Review plans">
        {plans.map((plan) => (
          <article key={plan.name} className={`pricing-plan${plan.name === "Pro" ? " pricing-plan-pro" : ""}`} aria-labelledby={`plan-${plan.name.toLowerCase()}`}>
            <div className="pricing-plan-heading"><h2 id={`plan-${plan.name.toLowerCase()}`}>{plan.name}</h2><span className={`pricing-plan-status${plan.live ? " is-live" : ""}`}>{plan.status}</span></div>
            <p className="pricing-plan-description">{plan.description}</p>
            <div className="pricing-price"><span className="pricing-currency">$</span><span>{plan.price}</span></div>
            <p className="pricing-price-unit">{plan.unit}</p>
            <div className="pricing-plan-allowance"><p>{plan.allowance}</p><span>{plan.scope}</span></div>
            <p className="pricing-features-label">{plan.live ? "INCLUDED TODAY" : "PRO REVIEW WORKFLOW"}</p>
            <ul className="pricing-features">{plan.features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul>
            <div className="pricing-plan-actions">
              {plan.live ? <><Link href={plan.href} className="pricing-plan-action pricing-live-action">{plan.action}<span aria-hidden="true">↗︎</span></Link><p className="pricing-free-note">Start with a public PR. No account or credit card needed.</p></> : <><CheckoutPreview /><noscript><p className="checkout-preview-note">JavaScript is required to open the test checkout. You can request Pro access by email below.</p></noscript><a href={plan.href} className="checkout-access-link">{plan.action} ↗︎</a></>}
            </div>
          </article>
        ))}
      </section>
      <p className="pricing-availability-note">Checkout currently runs in Paddle sandbox. The 100-review daily Pro allowance requires an active, verified subscription; account registration and billing activation are being connected. Request Pro access opens an email.</p>

      <section className="pricing-standard" aria-labelledby="pricing-standard-title">
        <span className="pricing-boundary" aria-hidden="true">[ ↗ ]</span>
        <div><p className="section-kicker">ONE REVIEW STANDARD</p><h2 id="pricing-standard-title">The evidence comes first.<br /><span>On every plan.</span></h2></div>
        <div><p>Structured findings, coverage limits and a pinned PR head SHA come with every review. Pro increases the daily allowance while keeping the same evidence and verification standard.</p><Link className="text-link" href="/evidence">Explore the engineering evidence <span aria-hidden="true">↗︎</span></Link></div>
      </section>

      <section className="pricing-comparison" aria-labelledby="pricing-comparison-title">
        <div className="pricing-section-heading"><h2 id="pricing-comparison-title">A clearer view of each plan.</h2><p>The same review standard.<br />More daily capacity with Pro.</p></div>
        <div className="pricing-table-scroll" role="region" aria-label="Plan comparison, scroll horizontally on small screens" tabIndex={0}>
          <table><caption className="sr-only">Free features and Pro subscription allowance; checkout is in sandbox</caption><thead><tr><th scope="col">Your review workflow</th><th scope="col">Free <span>Available now</span></th><th scope="col">Pro <span>$9/month · Sandbox preview</span></th></tr></thead><tbody>{comparison.map(([label, ...values]) => <tr key={label}><th scope="row">{label}</th>{values.map((value, index) => <td key={index}>{value}</td>)}</tr>)}</tbody></table>
        </div>
      </section>

      <section className="pricing-faq" aria-labelledby="pricing-faq-title">
        <div><p className="section-kicker">THE DETAILS</p><h2 id="pricing-faq-title">Before your<br /><span>next review.</span></h2><p>Have a workflow in mind?<br /><a href="mailto:founder@releaseengineer.tech">Talk to the founder ↗︎</a></p></div>
        <div className="pricing-faq-questions">
          <details><summary>How do the 10 free reviews work?<span aria-hidden="true">+</span></summary><p>You can complete up to {FREE_DAILY_REVIEWS} reviews each UTC day in this browser. The homepage shows your remaining allowance and stops new submissions at the limit. It resets at 00:00 UTC. No account or credit card is required.</p><p>The counter is stored locally on your device. It is a browser allowance, not a verified account quota; another browser or clearing site storage starts a separate counter. Server rate and concurrency limits also apply.</p></details>
          <details><summary>What counts as one review?<span aria-hidden="true">+</span></summary><p>One successfully completed, validated report counts as one review, including a report with no findings. Invalid URLs, service errors, interrupted requests and responses that fail validation do not consume a review. Reading or downloading an existing report does not use another review.</p></details>
          <details><summary>How does Pro access work?<span aria-hidden="true">+</span></summary><p>Pro is $9/month with a {PRO_DAILY_REVIEWS}-review daily subscription allowance, resetting at 00:00 UTC. Access must be linked to a signed-in account and verified on the server.</p><p>Checkout is currently a Paddle sandbox preview using test cards. Sandbox completion does not activate the production allowance. Account registration and billing verification are being connected; until they are enabled, Free remains available and you can request Pro access by email.</p></details>
          <details><summary>Can I analyze private repositories?<span aria-hidden="true">+</span></summary><p>Both plans support public GitHub pull requests only. Do not paste private code, credentials or confidential data into the product.</p></details>
          <details><summary>Does a review run my tests or approve a release?<span aria-hidden="true">+</span></summary><p>Release Engineer reviews a bounded selection of PR changes. It does not run your tests or inspect the full repository. Verify the findings, check affected callers and run your own tests before merging. A review supports your decision; it does not certify release safety.</p></details>
          <details><summary>What is stored when I use Free?<span aria-hidden="true">+</span></summary><p>The local allowance stores only a UTC date and a completed-review count. The application does not persist your PR contents or reports. Download a report to keep it on your device. Provider processing and content-free operational logs are described in the <Link href="/privacy">Privacy notice</Link>.</p></details>
        </div>
      </section>

      <section className="pricing-final" aria-labelledby="pricing-final-title"><div><p className="section-kicker">YOUR NEXT PULL REQUEST</p><h2 id="pricing-final-title">Bring the change.<br /><span>See what needs checking.</span></h2><p>{FREE_DAILY_REVIEWS} free reviews a day in this browser. Start with a public GitHub PR.</p></div><Link href="/#analyze" className="pricing-final-action">Analyze a PR <span aria-hidden="true">↗︎</span></Link></section>
    </main>
  );
}
