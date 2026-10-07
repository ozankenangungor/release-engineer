import type { Metadata } from "next";
import Link from "next/link";

const title = "About — Release Engineer";
const description =
  "About Release Engineer, an early-stage, bootstrapped developer-tool startup founded in October 2026 in Ankara, Türkiye by Ozan Kenan Güngör.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "./",
    siteName: "Release Engineer",
    type: "website",
  },
};

export default function About() {
  return (
    <main id="main" className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20">
      <div className="mb-10 border-b border-white/10 pb-9 sm:mb-14 sm:pb-12">
        <p className="section-kicker">
          RELEASE ENGINEER / EARLY BETA
        </p>
        <h1 className="mt-5 max-w-2xl text-balance text-4xl leading-[1.1] font-semibold tracking-[-0.05em] sm:text-6xl">
          About Release Engineer
        </h1>
      </div>
      <div className="grid items-start gap-10 text-sm leading-7 text-slate-300 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <section className="about-founder surface-card rounded-2xl p-6 sm:p-8">
          <div className="relative mb-8 flex items-center gap-4">
            <span aria-hidden="true" className="founder-monogram flex size-14 items-center justify-center rounded-2xl font-mono text-sm text-emerald-200">OKG</span>
            <div>
              <p className="section-kicker">FOUNDER-LED</p>
              <p className="mt-1 text-xs text-slate-400">Ankara, Türkiye</p>
            </div>
          </div>
          <p>
            Release Engineer is an early-stage, bootstrapped developer-tool
            startup founded in <time dateTime="2026-10">October 2026</time> in
            Ankara, Türkiye. No external funding has been raised.
          </p>
          <p className="mt-6 border-t border-white/10 pt-5 font-medium text-slate-100">Founder: Ozan Kenan Güngör.</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <a
              href="https://github.com/ozankenangungor"
              className="text-emerald-200 underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Founder on GitHub
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="https://linkedin.com/in/ozan-kenan-gungor"
              className="text-emerald-200 underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Founder on LinkedIn
            </a>
          </p>
          <a href="mailto:founder@releaseengineer.tech" className="mt-6 inline-block break-all text-xs text-emerald-200 underline decoration-emerald-200/30 underline-offset-4">founder@releaseengineer.tech</a>
        </section>
        <div className="about-sections space-y-9 [&>section+section]:border-t [&>section+section]:border-white/10 [&>section+section]:pt-9">
          <section>
            <h2 className="mb-2 text-base font-medium text-white">The product</h2>
            <p>
              Release Engineer is a Claude-native release-readiness tool for
              public GitHub pull requests. Claude is the core reasoning engine,
              reviewing bounded PR metadata and changed-file patches for
              regressions, correctness, security, testing gaps, breaking changes
              and visible dependency, configuration and operational risks.
            </p>
            <p className="mt-3">
              Reports are schema-validated decision support with explicit
              coverage limitations. They do not inspect the full repository,
              run tests or guarantee release safety.
            </p>
          </section>
          <section id="beta">
            <h2 className="mb-2 text-base font-medium text-white">
              Try the early beta
            </h2>
            <p>
              The early beta is available for testing on public GitHub pull requests.{" "}
              <Link
                href="/"
                className="text-emerald-200 underline underline-offset-4"
              >
                Analyze a public PR
              </Link>
              , then email{" "}
              <a
                href="mailto:founder@releaseengineer.tech"
                className="text-emerald-200 underline underline-offset-4"
              >
                founder@releaseengineer.tech
              </a>{" "}
              with what was useful, wrong or missing and whether you acted on a finding.
            </p>
            <p className="mt-3">
              Share a public PR URL and reviewed head SHA if available, not private
              code, secrets or sensitive vulnerability details. Feedback stays private
              unless you separately agree to publication. Participation does not imply
              consent to publish your name or a quote.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-base font-medium text-white">Evaluation</h2>
            <p>
              The project includes a versioned evaluation harness with
              32 original synthetic pull-request cases covering correctness,
              security, breaking changes, testing gaps, dependencies,
              configuration, operations, ambiguity, cross-file reasoning,
              prompt injection and partial-context safety.
            </p>
            <p className="mt-3">
              Offline checks validate fixtures, schema handling and the grader.
              Two manually dispatched complete 32-case synthetic runs used the
              production Claude review path. In the latest recorded run
              (October 7, 2026), 32/32 cases completed with 0 infrastructure errors.
            </p>
            <p className="mt-3">
              Synthetic evaluation is not real-world accuracy, traction or
              external validation. Reports still require human verification.
            </p>
            <p className="mt-3">
              <a
                href="https://github.com/ozankenangungor/release-engineer/blob/main/docs/live-evaluation-evidence.md"
                className="about-evidence-link text-emerald-200 underline decoration-emerald-200/30 underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                Full live evaluation metrics, failures and regressions
              </a>
            </p>
            <p className="mt-3">
              <a
                href="https://github.com/ozankenangungor/release-engineer/blob/main/evals/README.md"
                className="about-evidence-link text-emerald-200 underline decoration-emerald-200/30 underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                Evaluation methodology and limitations
              </a>
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-base font-medium text-white">Get in touch</h2>
            <p>
              Contact:{" "}
              <a
                href="mailto:founder@releaseengineer.tech"
                className="text-emerald-200 underline underline-offset-4"
              >
                founder@releaseengineer.tech
              </a>
            </p>
            <p className="mt-3">
              <a
                href="https://github.com/ozankenangungor/release-engineer"
                className="text-emerald-200 underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub repository
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
