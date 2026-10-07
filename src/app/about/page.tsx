import type { Metadata } from "next";

const title = "About — Release Engineer";
const description =
  "About Release Engineer, an early-stage, bootstrapped developer-tool startup started in 2026 in Türkiye by Ozan Kenan Güngör.";

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
        RELEASE ENGINEER / BETA
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        About Release Engineer
      </h1>
      <div className="mt-8 space-y-7 text-sm leading-7 text-slate-300">
        <section>
          <p>
            Release Engineer is an early-stage, bootstrapped developer-tool
            startup started in 2026 in Türkiye.
          </p>
          <p className="mt-3">Founder: Ozan Kenan Güngör.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-white">The product</h2>
          <p>
            Claude is the core reasoning engine of Release Engineer. The
            current beta reviews bounded public GitHub pull-request metadata
            and patches for release-readiness risks. Reviews support human
            release decisions.
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
