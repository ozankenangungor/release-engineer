import type { Metadata } from "next";

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
    <main id="main" className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <p className="font-mono text-xs text-emerald-300">
        RELEASE ENGINEER / EARLY BETA
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        About Release Engineer
      </h1>
      <div className="mt-8 space-y-7 text-sm leading-7 text-slate-300">
        <section>
          <p>
            Release Engineer is an early-stage, bootstrapped developer-tool
            startup founded in <time dateTime="2026-10">October 2026</time> in
            Ankara, Türkiye. No external funding has been raised.
          </p>
          <p className="mt-3">Founder: Ozan Kenan Güngör.</p>
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
        </section>
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
        <section>
          <h2 className="mb-2 text-base font-medium text-white">
            Early validation
          </h2>
          <p>
            The early beta is available for testing on public GitHub pull
            requests. Feedback and observed issues need documented evidence
            before they can support public validation or accuracy claims.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-white">Evaluation</h2>
          <p>
            The project includes a versioned offline evaluation harness with
            32 original synthetic pull-request cases covering correctness,
            security, breaking changes, testing gaps, dependencies,
            configuration, operations, ambiguity, cross-file reasoning,
            prompt injection and partial-context safety.
          </p>
          <p className="mt-3">
            Offline checks validate fixtures, schema handling and the grader.
            Measuring Claude’s risk detection, grounding and uncertainty
            requires separately authorized live runs. No live Claude quality
            baseline has been recorded.
          </p>
          <p className="mt-3">
            <a
              href="https://github.com/ozankenangungor/release-engineer/blob/main/evals/README.md"
              className="text-emerald-200 underline underline-offset-4"
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
    </main>
  );
}
