import Link from "next/link";
import { AnalysisForm } from "@/components/analysis-form";
import { ReleaseIntelligenceScene } from "@/components/three/release-intelligence-scene";
import { ReleaseMark } from "@/components/brand";
import { Testimonials } from "@/components/testimonials";
import { CaseStudiesPreview } from "@/components/case-studies";

const workflow = [
  {
    number: "01",
    title: "Bring the change.",
    detail: "PUBLIC GITHUB PR",
    description:
      "A pull request, its metadata and changed-file patches. A pinned head SHA keeps the review tied to the change you submitted.",
  },
  {
    number: "02",
    title: "Focus the context.",
    detail: "DETERMINISTIC SELECTION",
    description:
      "Explicit size limits and deterministic selection bound what Claude sees. Missing or shortened context stays visible.",
  },
  {
    number: "03",
    title: "Reason with Claude.",
    detail: "CORE REASONING ENGINE",
    description:
      "Claude examines the supplied changes for regressions, breaking changes, security concerns and gaps in testing.",
  },
  {
    number: "04",
    title: "Make the release call.",
    detail: "STRUCTURED REVIEW",
    description:
      "Schema-validated findings, recommendations and coverage limits give you a second perspective. The decision remains yours.",
  },
];

export default function Home() {
  return (
    <main id="main" className="home-shell">
      <section aria-labelledby="hero-title" className="hero-stage">
        <div className="hero-copy">
          <p className="claude-badge">
            <span aria-hidden="true" className="badge-dot" /> CLAUDE-NATIVE
            RELEASE READINESS
          </p>
          <h1 id="hero-title" className="hero-title">
            <span>Clarity before</span>
            <span className="hero-wordmark">you ship.</span>
          </h1>
          <p className="hero-description">
            A structured Claude review of your public GitHub pull request, with
            release risks, next steps and explicit limits.
          </p>
          <div className="hero-credentials">
            <span>Public PRs only</span>
            <span>Decision support</span>
            <span>Early beta</span>
          </div>
          <div className="hero-links">
            <a href="#analyze" className="mobile-analyze-cta">
              Analyze a public PR <span aria-hidden="true">↓</span>
            </a>
            <Link href="/evidence" className="text-link">
              Inspect the evidence <span aria-hidden="true">↗︎</span>
            </Link>
            <a href="#how-it-works" className="subtle-link">
              How it works <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <ReleaseIntelligenceScene />
        <AnalysisForm />
      </section>
      <div className="founder-strip">
        <div className="flex items-start gap-4">
          <span className="founder-monogram" aria-hidden="true">
            OKG
          </span>
          <div>
            <p className="section-kicker">INDEPENDENT · FOUNDER-LED</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Founded in October 2026 in Ankara, Türkiye by Ozan Kenan Güngör.
              <br className="hidden sm:block" /> Bootstrapped. No external
              funding raised.
            </p>
          </div>
        </div>
        <Link href="/about" className="text-link">
          Meet Release Engineer <span aria-hidden="true">→</span>
        </Link>
        <a className="sr-only" href="mailto:founder@releaseengineer.tech">
          founder@releaseengineer.tech
        </a>
      </div>
      <section
        id="how-it-works"
        aria-labelledby="workflow-title"
        className="content-section"
      >
        <div className="section-heading">
          <div>
            <p className="section-kicker">THE CHANGE → THE DECISION</p>
            <h2 id="workflow-title">Engineering the second perspective.</h2>
          </div>
          <p>
            A bounded workflow with Claude at its center. No claim to see beyond
            the supplied changes.
          </p>
        </div>
        <div className="workflow-grid">
          {workflow.map((item) => (
            <article className="workflow-step" key={item.number}>
              <div className="workflow-step-top">
                <span className="step-number">{item.number}</span>
                <span aria-hidden="true">↗︎</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <p className="workflow-detail">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <Testimonials />
      <CaseStudiesPreview />
      <section
        aria-labelledby="evidence-title"
        className="trust-section section-stage"
      >
        <div className="trust-intro">
          <p className="section-kicker">SOURCE, SCOPE & EVIDENCE</p>
          <h2 id="evidence-title">
            A product you
            <br className="hidden sm:block" /> can inspect.
          </h2>
          <p>
            Live software. Public engineering. Visible limitations. Follow the
            evidence behind the beta.
          </p>
          <Link className="text-link" href="/evidence">
            Explore the evidence index →
          </Link>
          <div className="trust-seal" aria-hidden="true">
            <ReleaseMark className="size-12" />
          </div>
        </div>
        <div className="trust-rows">
          <a
            className="trust-row"
            href="https://github.com/ozankenangungor/release-engineer/blob/main/src/lib/claude.ts"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="trust-number">01</span>
            <div>
              <h3>Claude is the reasoning engine.</h3>
              <p>
                The official Anthropic SDK, structured output, schema validation
                and deterministic coverage safeguards.
              </p>
              <span className="trust-source">INSPECT THE REVIEW ENGINE</span>
            </div>
            <span aria-hidden="true">↗︎</span>
          </a>
          <a
            className="trust-row"
            href="https://github.com/ozankenangungor/release-engineer/blob/main/docs/live-evaluation-evidence.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="trust-number">02</span>
            <div>
              <h3>Evaluation, including the failures.</h3>
              <p>
                Two complete synthetic Claude runs with metrics and regressions.
                Synthetic observations are not real-world accuracy or external
                validation.
              </p>
              <span className="trust-source">
                READ THE DATED EVALUATION EVIDENCE
              </span>
            </div>
            <span aria-hidden="true">↗︎</span>
          </a>
          <a
            className="trust-row"
            href="https://github.com/ozankenangungor/release-engineer/blob/main/SECURITY.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="trust-number">03</span>
            <div>
              <h3>The boundaries stay visible.</h3>
              <p>
                Public PRs, bounded context and no guarantee of release safety.
                Privacy and responsible disclosure are documented.
              </p>
              <span className="trust-source">SECURITY & PRODUCT SCOPE</span>
            </div>
            <span aria-hidden="true">↗︎</span>
          </a>
        </div>
      </section>
      <div className="decision-banner">
        <div>
          <p className="section-kicker">HUMAN JUDGMENT, ALWAYS</p>
          <h2>Your release decision stays yours.</h2>
          <p>
            Verify findings, run your tests and use human review before merging.
          </p>
        </div>
        <Link href="/about#beta" className="secondary-action">
          Share beta feedback <span aria-hidden="true">↗︎</span>
        </Link>
      </div>
    </main>
  );
}
