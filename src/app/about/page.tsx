import type { Metadata } from "next";
import Link from "next/link";
import { ReleaseMark } from "@/components/brand";

const title = "About — Release Engineer";
const description =
  "About Release Engineer, an early-stage, bootstrapped developer-tool startup founded in October 2026 in Ankara, Türkiye by Ozan Kenan Güngör.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
  openGraph: {
    title,
    description,
    url: "/about",
    siteName: "Release Engineer",
    type: "website",
  },
};

export default function About() {
  return (
    <main id="main" className="page-shell about-page">
      <div className="about-hero">
        <div>
          <p className="section-kicker">RELEASE ENGINEER / THE COMPANY</p>
          <h1 className="page-title">
            Built with conviction.
            <br />
            Open to inspection.
          </h1>
        </div>
        <p className="page-intro">
          An independent developer-tool company, building a clearer second
          perspective on the release decision.
        </p>
        <Link href="/evidence" className="secondary-action">
          Evidence & engineering ↗︎
        </Link>
        <div className="company-visual" aria-hidden="true">
          <div className="company-orbit" />
          <div className="company-plane company-plane-one" />
          <div className="company-plane company-plane-two" />
          <div className="company-plane company-plane-three">
            <ReleaseMark className="size-20" />
          </div>
          <span>RE / INDEPENDENT ENGINEERING</span>
        </div>
      </div>
      <div className="about-body grid items-start gap-10 text-sm leading-7 text-slate-300 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <section aria-labelledby="founder-title" className="about-founder">
          <span className="founder-signature" aria-hidden="true">
            OKG<span>FOUNDER / RELEASE ENGINEER</span>
          </span>
          <p className="section-kicker">FOUNDER</p>
          <h2 id="founder-title" className="founder-name mt-4 text-white">
            Ozan Kenan Güngör
          </h2>
          <p className="mt-5">
            Release Engineer is an early-stage, bootstrapped developer-tool
            startup founded in <time dateTime="2026-10">October 2026</time> in
            Ankara, Türkiye. No external funding has been raised.
          </p>
          <dl className="company-facts">
            <div>
              <dt>Product</dt>
              <dd>Release Engineer</dd>
            </div>
            <div>
              <dt>Stage</dt>
              <dd>Early beta</dd>
            </div>
            <div>
              <dt>Founded</dt>
              <dd>October 2026</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>Ankara, Türkiye</dd>
            </div>
            <div>
              <dt>Funding</dt>
              <dd>Bootstrapped</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            <a
              href="https://github.com/ozankenangungor"
              className="text-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Founder on GitHub ↗︎
            </a>
            <a
              href="https://linkedin.com/in/ozan-kenan-gungor"
              className="text-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Founder on LinkedIn ↗︎
            </a>
          </div>
          <a
            href="mailto:founder@releaseengineer.tech"
            className="text-link mt-6 inline-block break-all"
          >
            founder@releaseengineer.tech
          </a>
        </section>
        <div className="about-sections">
          <section data-reveal="0">
            <h2>The product</h2>
            <p>
              Release Engineer is a Claude-native release-readiness tool for
              public GitHub pull requests. Claude is the core reasoning engine,
              reviewing bounded PR metadata and changed-file patches for
              regressions, correctness, security, testing gaps, breaking changes
              and visible dependency, configuration and operational risks.
            </p>
            <p className="mt-3">
              Reports are schema-validated decision support with explicit
              coverage limitations. They do not inspect the full repository, run
              tests or guarantee release safety.
            </p>
          </section>
          <section data-reveal="0">
            <h2>Why Release Engineer</h2>
            <p>
              A release decision needs more than a summary of the diff. The
              product is designed to give maintainers a structured second
              perspective: what may need attention, what to verify next, and
              what the supplied context cannot establish.
            </p>
          </section>
          <section data-reveal="0">
            <h2>Claude at the core</h2>
            <p>
              The server retrieves public changes from GitHub, selects context
              within deterministic byte limits, and sends it to Claude through
              the official Anthropic SDK. Structured output is validated before
              display. Deterministic safeguards prevent an incomplete context
              from receiving a final merge recommendation.
            </p>
            <a
              className="about-evidence-link text-link mt-4"
              href="https://github.com/ozankenangungor/release-engineer/blob/main/src/lib/claude.ts"
              target="_blank"
              rel="noopener noreferrer"
            >
              Inspect the production review engine ↗︎
            </a>
          </section>
          <section id="beta">
            <h2>Try the early beta</h2>
            <p>
              The early beta is available for testing on public GitHub pull
              requests.{" "}
              <Link href="/" className="text-link">
                Analyze a public PR
              </Link>
              , then email{" "}
              <a
                href="mailto:founder@releaseengineer.tech"
                className="text-link break-all"
              >
                founder@releaseengineer.tech
              </a>{" "}
              with what was useful, wrong or missing and whether you acted on a
              finding.
            </p>
            <p className="mt-3">
              Share a public PR URL and reviewed head SHA if available, not
              private code, secrets or sensitive vulnerability details. Feedback
              stays private unless you separately agree to publication.
              Participation does not imply consent to publish your name or a
              quote.
            </p>
          </section>
          <section data-reveal="0">
            <h2>Real-world evidence</h2>
            <p>
              Three founder-supplied, publication-approved quotes from external
              beta testers appear on the{" "}
              <Link href="/#developer-feedback" className="text-link">
                homepage
              </Link>
              , using approved display names and roles. They are informal
              qualitative feedback. They do not establish product accuracy,
              verified findings, unique developer counts or customer traction.
            </p>
            <p className="mt-3">
              No pinned, human-checked public PR case study or verified
              production analysis count is published yet. The{" "}
              <Link className="text-link" href="/evidence">
                evidence index
              </Link>{" "}
              explains the current record and usage methodology.
            </p>
          </section>
          <section data-reveal="0">
            <h2>Evaluation</h2>
            <p>
              The project includes a versioned evaluation harness with 32
              original synthetic pull-request cases covering correctness,
              security, breaking changes, testing gaps, dependencies,
              configuration, operations, ambiguity, cross-file reasoning, prompt
              injection and partial-context safety.
            </p>
            <p className="mt-3">
              Offline checks validate fixtures, schema handling and the grader.
              Two manually dispatched complete 32-case synthetic runs used the
              production Claude review path. In the latest recorded run (October
              7, 2026), 32/32 cases completed with 0 infrastructure errors.
            </p>
            <p className="mt-3">
              The strict evaluator recorded 22 PASS / 10 FAIL and one critical
              violation in the latest candidate. The diagnostic score does not
              override those failures.
            </p>
            <p className="mt-3">
              Synthetic evaluation is not real-world accuracy, traction or
              external validation. Reports still require human verification.
            </p>
            <a
              className="about-evidence-link text-link mt-4"
              href="https://github.com/ozankenangungor/release-engineer/blob/main/docs/live-evaluation-evidence.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Full live evaluation metrics, failures and regressions ↗︎
            </a>
            <a
              className="about-evidence-link text-link mt-3"
              href="https://github.com/ozankenangungor/release-engineer/blob/main/evals/README.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Evaluation methodology and limitations ↗︎
            </a>
          </section>
          <section data-reveal="0">
            <h2>Source, security & contact</h2>
            <p>
              The source and review boundaries are public. For product feedback
              or a private security report, contact{" "}
              <a
                href="mailto:founder@releaseengineer.tech"
                className="text-link break-all"
              >
                founder@releaseengineer.tech
              </a>
              .
            </p>
            <div className="mt-4 flex flex-wrap gap-5">
              <a
                href="https://github.com/ozankenangungor/release-engineer"
                className="text-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub repository ↗︎
              </a>
              <a
                href="https://github.com/ozankenangungor/release-engineer/blob/main/SECURITY.md"
                className="text-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Security policy ↗︎
              </a>
              <Link href="/privacy" className="text-link">
                Privacy
              </Link>
              <Link href="/terms" className="text-link">
                Terms
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
