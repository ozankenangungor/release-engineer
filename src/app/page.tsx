import Link from "next/link";
import { AnalysisForm } from "@/components/analysis-form";
import { ReportPreview } from "@/components/report-preview";
import { ReleaseIntelligenceScene } from "@/components/three/release-intelligence-scene";
import { getPublishedCaseStudies } from "@/content/case-studies";

const workflow = [
  {
    title: "Retrieve the public PR",
    description:
      "GitHub metadata and changed-file patches, tied to the retrieved head SHA.",
  },
  {
    title: "Select bounded context",
    description:
      "Explicit size limits. Omitted files and shortened patches stay visible in the report.",
  },
  {
    title: "Review with Claude",
    description:
      "Potential regressions, security concerns, breaking changes and missing test coverage.",
  },
  {
    title: "Verify before merging",
    description:
      "Schema-validated findings and suggested checks. Human review and testing remain essential.",
  },
];

export default function Home() {
  const example = getPublishedCaseStudies().find(
    (study) => study.slug === "rails-doc-typo-58968",
  );
  return (
    <main id="main" className="home-shell">
      <section aria-labelledby="hero-title" className="product-hero">
        <div className="product-copy">
          <p className="product-eyebrow">
            <span aria-hidden="true" className="badge-dot" /> Public GitHub PRs
            · Reviewed with Claude
          </p>
          <h1 id="hero-title" className="product-title">
            Know what could break <span>before you merge.</span>
          </h1>
          <p className="product-description">
            Analyze a public GitHub pull request with Claude for potential
            release risks, missing tests and breaking changes that need human
            verification.
          </p>
          <div className="product-links">
            <a href="#report-preview" className="text-link">
              See a sample report <span aria-hidden="true">↓</span>
            </a>
            <Link href="/evidence" className="text-link">
              Technical evidence <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <AnalysisForm examplePrUrl={example?.prUrl} />
      </section>
      <ReportPreview />
      <section
        id="how-it-works"
        aria-labelledby="workflow-title"
        className="product-workflow section-stage"
      >
        <div className="section-heading">
          <div>
            <p className="section-kicker">FROM PULL REQUEST TO REVIEW</p>
            <h2 id="workflow-title">A second pass, with visible limits.</h2>
          </div>
          <p>
            For maintainers, engineering leads and developers deciding what to
            verify before shipping.
          </p>
        </div>
        <ol className="workflow-grid">
          {workflow.map((item, index) => (
            <li className="workflow-step" key={item.title}>
              <span className="step-number">0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ol>
        <details className="pipeline-explainer">
          <summary>Explore the review pipeline</summary>
          <p>
            A conceptual illustration of context flowing through the review
            engine. Animation is optional.
          </p>
          <ReleaseIntelligenceScene />
        </details>
      </section>
      <section
        aria-labelledby="evidence-title"
        className="product-evidence section-stage"
      >
        <div className="section-heading">
          <div>
            <p className="section-kicker">PUBLIC ENGINEERING RECORD</p>
            <h2 id="evidence-title">Inspect the evidence behind the beta.</h2>
          </div>
          <Link className="text-link" href="/evidence">
            Open the evidence index →
          </Link>
        </div>
        <div className="evidence-cards">
          <article>
            <h3>Claude integration</h3>
            <p>
              The official Anthropic SDK, strict report validation and
              deterministic coverage safeguards. An incomplete context cannot
              receive a merge recommendation.
            </p>
            <a
              className="text-link"
              href="https://github.com/ozankenangungor/release-engineer/blob/main/src/lib/claude.ts"
              target="_blank"
              rel="noopener noreferrer"
            >
              Inspect the review engine ↗︎
            </a>
          </article>
          <article>
            <h3>Evaluation, including failures</h3>
            <p>
              The October 7 synthetic run recorded 22 PASS / 10 FAIL and one
              critical violation across 32 cases. Historical synthetic results
              are not real-world accuracy.
            </p>
            <a
              className="text-link"
              href="https://github.com/ozankenangungor/release-engineer/blob/main/docs/live-evaluation-evidence.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Methodology and failures ↗︎
            </a>
          </article>
          <article>
            <h3>A real workflow observation</h3>
            <p>
              A founder-run Rails documentation PR check returned no findings.
              The original report was not retained. This demonstrates a reported
              workflow, not bug detection or external validation.
            </p>
            <Link
              className="text-link"
              href="/case-studies/rails-doc-typo-58968"
            >
              Read the observation →
            </Link>
          </article>
        </div>
      </section>
      <section
        aria-labelledby="founder-title"
        className="product-founder section-stage"
      >
        <div>
          <p className="section-kicker">INDEPENDENTLY BUILT & OPERATED</p>
          <h2 id="founder-title">Built by Ozan Kenan Güngör.</h2>
          <p>
            Launched in October 2026 in Ankara, Türkiye. Self-funded early beta,
            with no external investment. No legal company has been incorporated
            or registered.
          </p>
        </div>
        <div className="founder-links">
          <Link href="/about" className="text-link">
            About the project →
          </Link>
          <Link href="/about#beta" className="text-link">
            Share beta feedback →
          </Link>
          <a className="text-link" href="mailto:founder@releaseengineer.tech">
            founder@releaseengineer.tech
          </a>
        </div>
      </section>
    </main>
  );
}
