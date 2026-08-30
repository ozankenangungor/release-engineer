import Link from "next/link";
import { AnalysisForm } from "@/components/analysis-form";
import { ReleaseIntelligenceScene } from "@/components/three/release-intelligence-scene";
import { ReleaseMark } from "@/components/brand";
import { Testimonials } from "@/components/testimonials";
import { FeaturedPublicObservation } from "@/components/case-studies";
import { getPublishedCaseStudies } from "@/content/case-studies";

const intendedUsers = [
  {
    audience: "Open-source maintainers",
    useCase: "A second pass on release risk before merging.",
  },
  {
    audience: "Engineering leads",
    useCase: "Review testing gaps and potential breaking changes.",
  },
  {
    audience: "Developers reviewing unfamiliar changes",
    useCase: "Identify what needs closer human verification.",
  },
  {
    audience: "Small product teams",
    useCase:
      "Review configuration, migration and operational risks without dedicated release engineering staff.",
  },
];

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
  const example = getPublishedCaseStudies().find(
    (study) => study.slug === "rails-doc-typo-58968",
  );
  return (
    <main id="main" className="home-shell">
      <section aria-labelledby="hero-title" className="hero-stage">
        <div className="hero-copy">
          <p className="claude-badge">
            <span aria-hidden="true" className="badge-dot" /> CLAUDE-NATIVE
            RELEASE READINESS
          </p>
          <h1 id="hero-title" className="hero-title">
            <span>See the change.</span>
            <span>Know the risk.</span>
            <span className="hero-wordmark">Own the release.</span>
          </h1>
          <p className="hero-description">
            Paste a public GitHub PR. Get a structured second review of release
            risks, missing tests, breaking changes and what still needs human
            verification.
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
            <Link
              href="/case-studies/rails-doc-typo-58968"
              className="subtle-link"
            >
              A real public PR <span aria-hidden="true">↗︎</span>
            </Link>
          </div>
        </div>
        <ReleaseIntelligenceScene />
        <AnalysisForm examplePrUrl={example?.prUrl} />
      </section>
      <div className="hero-pipeline" aria-label="Review workflow">
        <p className="section-kicker">FROM CHANGE TO PERSPECTIVE</p>
        <ol>
          <li>
            <span>01</span> Public PR changes
          </li>
          <li>
            <span>02</span> Bounded context
          </li>
          <li>
            <span>03</span> Claude reasoning
          </li>
          <li>
            <span>04</span> Structured review
          </li>
        </ol>
      </div>
      <div className="founder-strip" data-reveal="0">
        <div className="flex items-start gap-4">
          <span className="founder-monogram" aria-hidden="true">
            OKG
          </span>
          <div>
            <p className="section-kicker">AN INDEPENDENT PRODUCT COMPANY</p>
            <h2 className="founder-strip-title">
              Founder-led. Built in public.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Founded in October 2026 in Ankara, Türkiye by Ozan Kenan Güngör.
              <br className="hidden sm:block" /> Shipping a Claude-native
              product in early beta.
            </p>
          </div>
        </div>
        <Link href="/about" className="text-link">
          Meet Release Engineer <span aria-hidden="true">→</span>
        </Link>
        <a
          className="founder-contact text-link"
          href="mailto:founder@releaseengineer.tech"
        >
          founder@releaseengineer.tech
        </a>
      </div>
      <div className="reviewer-overview">
        <section aria-labelledby="audience-title" data-reveal="0">
          <div className="section-heading">
            <div>
              <p className="section-kicker">WHO IS THIS FOR?</p>
              <h2 id="audience-title">
                Built for teams that ship through pull requests.
              </h2>
            </div>
          </div>
          <p className="reviewer-intro">
            Intended users and use cases for the early beta.
          </p>
          <dl className="audience-list">
            {intendedUsers.map((item) => (
              <div key={item.audience}>
                <dt>{item.audience}</dt>
                <dd>{item.useCase}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section
          aria-labelledby="claude-title"
          className="reviewer-engine"
          data-reveal="70"
        >
          <p className="section-kicker">WHY CLAUDE</p>
          <h2 id="claude-title">The reasoning layer.</h2>
          <p>
            Release review requires reasoning across changed files,
            distinguishing evidence from inference, and producing structured
            findings with explicit uncertainty and coverage boundaries. Claude
            handles that reasoning.
          </p>
          <h3>Application code defines the boundaries.</h3>
          <ul>
            <li>GitHub retrieval</li>
            <li>Bounded context selection</li>
            <li>Schema validation</li>
            <li>Coverage enforcement</li>
          </ul>
          <a
            className="text-link"
            href="https://github.com/ozankenangungor/release-engineer/blob/main/src/lib/claude.ts"
            target="_blank"
            rel="noopener noreferrer"
          >
            Inspect the Claude integration <span aria-hidden="true">↗︎</span>
          </a>
        </section>
      </div>
      <FeaturedPublicObservation />
      <Testimonials />
      <section
        id="how-it-works"
        aria-labelledby="workflow-title"
        className="content-section"
        data-reveal="0"
      >
        <div className="section-heading">
          <div>
            <p className="section-kicker">BUILT FOR THE RELEASE DECISION</p>
            <h2 id="workflow-title">Engineering the second perspective.</h2>
          </div>
          <p>
            A review for the human deciding what to verify before shipping:
            release risks, testing gaps and coverage limits in one report.
          </p>
        </div>
        <div className="workflow-grid">
          {workflow.map((item) => (
            <article
              className="workflow-step"
              key={item.number}
              data-reveal={String(Number(item.number) * 70)}
            >
              <div className="workflow-step-top">
                <span className="step-number">{item.number}</span>
                <span aria-hidden="true">↗︎</span>
              </div>
              <div
                className={`workflow-diagram workflow-diagram-${item.number}`}
                aria-hidden="true"
              >
                <i />
                <i />
                <i />
                <i />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <p className="workflow-detail">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        aria-labelledby="evidence-title"
        className="trust-section section-stage"
        data-reveal="0"
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
      <div className="decision-banner" data-reveal="0">
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
