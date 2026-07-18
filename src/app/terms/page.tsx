import type { Metadata } from "next";

const title = "Terms — Release Engineer";
const description =
  "Beta terms and limitations for Release Engineer’s public GitHub pull-request reviews.";

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

export default function Terms() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <p className="font-mono text-xs text-emerald-300">
        RELEASE ENGINEER / BETA
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Terms</h1>
      <p className="mt-4 text-xs text-slate-400">
        Last updated: <time dateTime="2026-10-07">October 7, 2026</time>
      </p>
      <div className="mt-8 space-y-7 text-sm leading-7 text-slate-300">
        <section>
          <h2 className="mb-2 text-base font-medium text-white">
            Using the beta
          </h2>
          <p>
            Release Engineer provides AI-assisted release-readiness reviews for
            public GitHub pull requests. Use it responsibly, submit only public
            content you are entitled to have processed, and do not abuse the
            service or attempt to access private data.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-white">
            Your release decision
          </h2>
          <p>
            Reports are decision support and may contain mistakes or omit
            issues. They do not guarantee correctness, security or release
            safety. Verify findings, run appropriate tests, and obtain human
            review. You remain responsible for merge and release decisions.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-white">
            Availability and limits
          </h2>
          <p>
            This MVP is provided as available. Reviews depend on GitHub and
            Anthropic availability, API limits and the context we can retrieve.
            Large or incomplete changes may be analyzed only in part, with
            warnings. The service may change or be unavailable during the beta.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-white">MVP notice</h2>
          <p>
            These brief beta terms describe the intended use and limits of the
            product. They are not a custom legal assessment.
          </p>
        </section>
        <p>
          Contact:{" "}
          <a
            href="mailto:founder@releaseengineer.tech"
            className="text-emerald-200 underline underline-offset-4"
          >
            founder@releaseengineer.tech
          </a>
        </p>
      </div>
    </main>
  );
}
