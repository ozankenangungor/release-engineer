import Link from "next/link";
import { AnalysisForm } from "@/components/analysis-form";

const features = [
  {
    number: "01",
    title: "Bring the change",
    description:
      "Paste a public GitHub pull request. We retrieve its description, branches and changed-file patches.",
  },
  {
    number: "02",
    title: "See the release risk",
    description:
      "Claude reasons through the supplied changes for regressions, breaking changes and gaps in testing.",
  },
  {
    number: "03",
    title: "Make the next call",
    description:
      "Get a structured review with concrete findings, recommended actions and clear limits on what was reviewed.",
  },
];

export default function Home() {
  return (
    <main id="main" className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
      <section className="mx-auto max-w-3xl pt-12 text-center sm:pt-20">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/5 px-3 py-1.5 font-mono text-[11px] tracking-wide text-emerald-200">
          <span
            className="size-1.5 rounded-full bg-emerald-300"
            aria-hidden="true"
          />{" "}
          POWERED BY CLAUDE
        </p>
        <h1 className="text-4xl leading-[1.1] font-semibold tracking-[-0.045em] sm:text-6xl">
          Your AI
          <br />
          <span className="text-emerald-200">Release Engineer</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
          Review pull requests for regressions, testing gaps, breaking changes
          and release risks before they reach production.
        </p>
        <div className="mx-auto mt-6 max-w-xl text-xs leading-5 text-slate-400">
          <p>
            Release Engineer is a bootstrapped developer-tool startup founded
            in 2026 in Ankara, Türkiye by Ozan Kenan Güngör.
          </p>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <Link
              href="/about"
              className="text-emerald-200 underline underline-offset-4"
            >
              About Release Engineer
            </Link>
            <span aria-hidden="true">·</span>
            <a
              href="mailto:founder@releaseengineer.tech"
              className="text-emerald-200 underline underline-offset-4"
            >
              founder@releaseengineer.tech
            </a>
          </p>
        </div>
      </section>
      <section aria-label="Pull request analysis" className="mt-10 sm:mt-12">
        <AnalysisForm />
      </section>
      <section
        aria-label="How it works"
        className="mt-16 grid gap-8 border-t border-white/8 pt-9 md:grid-cols-3"
      >
        {features.map((feature) => (
          <div key={feature.number}>
            <span className="font-mono text-xs text-emerald-300/70">
              {feature.number} /
            </span>
            <h2 className="mt-3 text-base font-medium text-slate-100">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {feature.description}
            </p>
          </div>
        ))}
      </section>
      <p className="mt-10 text-center text-xs leading-5 text-slate-500">
        A review to inform your decision. Verify findings, run your tests, and
        use human judgment before merging.
      </p>
    </main>
  );
}
