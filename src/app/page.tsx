import Link from "next/link";
import { AnalysisForm } from "@/components/analysis-form";
import { ReportPreview } from "@/components/report-preview";
import { ReleaseIntelligenceScene } from "@/components/three/release-intelligence-scene";
import { ReleaseMark } from "@/components/brand";
import { getPublishedCaseStudies } from "@/content/case-studies";
const repository = "https://github.com/ozankenangungor/release-engineer";
const workflow = [
  {
    title: "Connect a public PR",
    description:
      "Start with a GitHub URL. Retrieve public metadata and changed-file patches, pinned to the reviewed head SHA.",
    tag: "GITHUB / PUBLIC ONLY",
  },
  {
    title: "Bound the review context",
    description:
      "Select changes within deterministic byte limits. Omitted files and shortened patches remain visible in the report.",
    tag: "CONTEXT / EXPLICIT LIMITS",
  },
  {
    title: "Reason with Claude",
    description:
      "Surface potential regressions, security concerns, breaking changes and missing tests. Validate the structured response.",
    tag: "ANTHROPIC / SERVER ONLY",
  },
  {
    title: "Verify before merging",
    description:
      "Inspect the evidence, check affected callers and run your tests. The release decision stays with you.",
    tag: "RELEASE / HUMAN JUDGMENT",
  },
];
const safeguards = [
  {
    title: "Real Claude integration",
    description:
      "The official Anthropic SDK runs on the server. API credentials stay there.",
    path: "src/lib/claude.ts",
    label: "Review engine",
  },
  {
    title: "A defined context boundary",
    description:
      "Deterministic selection and byte limits. A partial context cannot receive a merge recommendation.",
    path: "src/lib/context.ts",
    label: "Context policy",
  },
  {
    title: "Validated, constrained output",
    description:
      "Strict schemas, prompt-injection defenses and explicit coverage limitations.",
    path: "src/lib/review-policy.ts",
    label: "Output safeguards",
  },
  {
    title: "An inspectable implementation",
    description:
      "Public source, browser tests and a dated evaluation record that includes its failures.",
    path: ".github/workflows/ci.yml",
    label: "Source & checks",
  },
];
export default function Home() {
  const example = getPublishedCaseStudies().find(
    (study) => study.slug === "rails-doc-typo-58968",
  );
  return (
    <main id="main" className="home-shell">
      <section className="signal-hero" aria-labelledby="hero-title">
        <div className="hero-composition">
          <div className="hero-copy">
            <p className="hero-eyebrow">
              <span className="signal-dot" aria-hidden="true" /> RELEASE
              INTELLIGENCE<span className="hero-beta">EARLY BETA</span>
            </p>
            <h1 id="hero-title">
              Catch release
              <br />
              risks before
              <br />
              they <span className="ship-word">ship.</span>
            </h1>
            <p className="hero-description">
              Claude-powered analysis for public GitHub pull requests. Surface
              breaking changes, regressions and testing gaps — with evidence and
              honest limits.
            </p>
            <AnalysisForm examplePrUrl={example?.prUrl} />
            <a className="hero-preview-link" href="#report-preview">
              See a sample report <span aria-hidden="true">↓</span>
            </a>
          </div>
          <ReleaseIntelligenceScene />
        </div>
        <div className="hero-baseline">
          <span>
            <ReleaseMark /> FROM CHANGE TO SIGNAL
          </span>
          <p>Public PRs. Bounded context. Human decisions.</p>
          <a href="#report-preview" aria-label="Explore the product">
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      <div id="analysis-results" className="analysis-results" />
      <ReportPreview />
      <section
        id="how-it-works"
        className="process-section section-shell"
        aria-labelledby="workflow-title"
      >
        <div className="process-editorial" data-reveal="0">
          <p className="section-kicker">02 / THE REVIEW PIPELINE</p>
          <h2 id="workflow-title">
            A second pass.
            <br />
            <span>A clearer decision.</span>
          </h2>
          <p>
            For the moments when a small diff can carry a much larger
            consequence.
          </p>
          <div className="process-principle">
            <ReleaseMark />
            <p>
              AI adds a perspective.
              <br />
              You own the release decision.
            </p>
          </div>
        </div>
        <ol className="process-timeline">
          {workflow.map((item, index) => (
            <li key={item.title} data-reveal="0">
              <span className="process-number">0{index + 1}</span>
              <div>
                <p className="process-tag">{item.tag}</p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section
        id="engineering-trust"
        className="trust-section"
        aria-labelledby="evidence-title"
      >
        <div className="section-shell">
          <div className="section-heading trust-heading">
            <div>
              <p className="section-kicker">03 / ENGINEERING, IN THE OPEN</p>
              <h2 id="evidence-title">
                Confidence needs
                <br />a public record.
              </h2>
            </div>
            <div>
              <p>
                Credibility comes from boundaries you can inspect, and results
                you can question.
              </p>
              <Link href="/evidence" className="text-link">
                Explore the evidence index ↗︎
              </Link>
            </div>
          </div>
          <div className="trust-ledger">
            {safeguards.map((item, index) => (
              <article key={item.title}>
                <span className="ledger-index">0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <a
                  className="text-link"
                  href={`${repository}/blob/main/${item.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label} ↗︎
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        className="founder-section section-shell"
        aria-labelledby="founder-title"
      >
        <div>
          <p className="section-kicker">04 / INDEPENDENT BY DESIGN</p>
          <h2 id="founder-title">
            Built with a name
            <br />
            behind it.
          </h2>
        </div>
        <div>
          <h3>Ozan Kenan Güngör</h3>
          <p>
            Independently built and operated in Ankara, Türkiye. Launched in
            October 2026. Self-funded early beta; no external investment. No
            legal company has been incorporated or registered.
          </p>
          <div className="founder-links">
            <Link href="/about" className="text-link">
              Meet the founder ↗︎
            </Link>
            <Link
              href="/case-studies/rails-doc-typo-58968"
              className="text-link"
            >
              Founder-run PR observation ↗︎
            </Link>
            <Link href="/about#beta" className="text-link">
              Share beta feedback ↗︎
            </Link>
            <a href="mailto:founder@releaseengineer.tech" className="text-link">
              founder@releaseengineer.tech
            </a>
          </div>
        </div>
      </section>
      <section className="final-cta" aria-labelledby="final-title">
        <div className="section-shell">
          <p className="section-kicker">
            YOUR NEXT RELEASE / A SECOND PERSPECTIVE
          </p>
          <h2 id="final-title">
            Small diff.
            <br />
            See the bigger picture.
          </h2>
          <a href="#analyze" className="final-action">
            Analyze a public PR <span aria-hidden="true">↗︎</span>
          </a>
          <p>Public GitHub pull requests · No account required</p>
        </div>
        <svg
          className="final-branches"
          viewBox="0 0 600 450"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M0 60h130l150 165h320M0 225h600M0 390h130l150-165M385 0v450"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="385" cy="225" r="15" fill="currentColor" />
          <path
            d="m535 180 45 45-45 45"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </section>
    </main>
  );
}
