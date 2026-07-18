import type { Metadata } from "next";

const title = "Privacy — Release Engineer";
const description =
  "Privacy and data handling for Release Engineer’s public GitHub pull-request reviews.";

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

export default function Privacy() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <p className="font-mono text-xs text-emerald-300">
        RELEASE ENGINEER / BETA
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-4 text-xs text-slate-400">
        Last updated: <time dateTime="2026-10-07">October 7, 2026</time>
      </p>
      <div className="mt-8 space-y-7 text-sm leading-7 text-slate-300">
        <section>
          <h2 className="mb-2 text-base font-medium text-white">
            What happens when you analyze a PR
          </h2>
          <p>
            We send the submitted URL to our server, retrieve public
            pull-request metadata and changed-file patches from GitHub, and send
            a bounded selection of those contents to Anthropic’s Claude API to
            produce your review. Submit only public pull requests you are
            comfortable having processed this way.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-white">
            Storage and providers
          </h2>
          <p>
            The application does not persist submitted PR contents or review
            reports. They are held in memory while processing and displayed in
            your browser. There are no accounts, application database, analytics
            vendors or tracking cookies. Our hosting provider, GitHub and
            Anthropic may process request metadata or contents under their own
            policies; this application does not control their retention.
          </p>
          <p className="mt-3">
            <a
              href="https://www.anthropic.com/legal/privacy"
              className="text-emerald-200 underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anthropic privacy policy
            </a>{" "}
            ·{" "}
            <a
              href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
              className="text-emerald-200 underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub privacy statement
            </a>
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-white">MVP notice</h2>
          <p>
            This page describes the current beta application’s data handling. It
            is a brief product notice, not a custom legal assessment. We will
            update it if the product’s data handling changes.
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
