import Link from "next/link";
import { AnalysisForm } from "@/components/analysis-form";

const features = [
  {
    number: "01",
    title: "Bring the change",
    description:
      "Paste a public GitHub pull request. We retrieve its description, branches and changed-file patches.",
    detail: "Public PR metadata + patches",
  },
  {
    number: "02",
    title: "See the release risk",
    description:
      "Claude reasons through the supplied changes for regressions, breaking changes and gaps in testing.",
    detail: "Bounded context → Claude",
  },
  {
    number: "03",
    title: "Make the next call",
    description:
      "Get a structured review with concrete findings, recommended actions and clear limits on what was reviewed.",
    detail: "Findings + recommended actions",
  },
];

const evidence = [
  {
    label: "01 / REASONING",
    title: "Claude at the core",
    description:
      "Claude reviews the supplied change context. Every report is validated against a structured schema before it reaches you.",
    link: "Inspect the review engine",
    href: "https://github.com/ozankenangungor/release-engineer/blob/main/src/lib/claude.ts",
  },
  {
    label: "02 / EVIDENCE",
    title: "Measured, with limits",
    description:
      "Live synthetic evaluations are documented with source runs, metrics, failures and regressions. They are not real-world accuracy, traction or external validation.",
    link: "Read the evaluation evidence",
    href: "https://github.com/ozankenangungor/release-engineer/blob/main/docs/live-evaluation-evidence.md",
  },
  {
    label: "03 / SCOPE",
    title: "The boundaries stay visible",
    description:
      "Partial coverage and review limitations are explicit. Reviews do not inspect the full repository, run tests or guarantee release safety.",
    link: "Security and product scope",
    href: "https://github.com/ozankenangungor/release-engineer/blob/main/SECURITY.md",
  },
];

export default function Home() {
  return (
    <main id="main" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
      <section
        aria-labelledby="hero-title"
        className="hero-stage grid gap-9 py-10 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-x-14 lg:py-20"
      >
        <div>
          <p className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-emerald-300/20 bg-emerald-300/5 px-3.5 py-2 font-mono text-[10px] tracking-widest text-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
            POWERED BY CLAUDE
          </p>
          <h1 id="hero-title" className="text-balance text-[clamp(2.75rem,5.2vw,4.5rem)] leading-[1.04] font-semibold tracking-[-0.055em]">
            Your AI
            <br />
            <span className="hero-wordmark">Release Engineer</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Review pull requests for regressions, testing gaps, breaking changes
            and release risks before they reach production.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
            <span>Public GitHub PRs only</span>
            <span className="h-3 w-px bg-white/15" aria-hidden="true" />
            <span>Decision support. Human judgment.</span>
          </div>
        </div>
        <AnalysisForm />
      </section>
      <div className="flex flex-col justify-between gap-5 border-y border-white/10 py-6 lg:flex-row lg:items-center">
        <div className="flex max-w-2xl items-start gap-3">
          <span aria-hidden="true" className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-300/15 bg-emerald-300/5 font-mono text-[10px] text-emerald-200">
            OKG
          </span>
          <p className="text-xs leading-6 text-slate-400">
            Release Engineer is a bootstrapped developer-tool startup founded
            in October 2026 in Ankara, Türkiye by Ozan Kenan Güngör.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <Link href="/about" className="text-slate-200 underline decoration-white/20 underline-offset-4 hover:text-emerald-200">
            About Release Engineer
          </Link>
          <a href="mailto:founder@releaseengineer.tech" className="text-slate-200 underline decoration-white/20 underline-offset-4 hover:text-emerald-200">
            founder@releaseengineer.tech
          </a>
        </div>
      </div>
      <section
        id="how-it-works"
        aria-label="How it works"
        className="pt-16 sm:pt-20"
      >
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="section-kicker">THE WORKFLOW</p>
            <h2 className="mt-3 text-balance text-2xl font-medium tracking-tight sm:text-3xl">
              From pull request to release review.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-slate-400">
            Selected changes. Structured findings.<br className="hidden sm:block" /> Clear limits on what was reviewed.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.number} className="surface-card flex flex-col rounded-2xl border border-white/10 p-6 sm:p-7">
              <span className="inline-flex size-9 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/5 font-mono text-xs text-emerald-200">
                {feature.number}
              </span>
              <h3 className="mt-6 text-lg font-medium tracking-tight text-slate-100">
                {feature.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">
                {feature.description}
              </p>
              <p className="mt-6 border-t border-white/8 pt-4 font-mono text-[10px] text-slate-400">
                {feature.detail}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section aria-labelledby="evidence-title" className="mt-16 border-t border-white/10 pt-12 sm:mt-20">
        <div className="mb-8 max-w-xl">
          <p className="section-kicker">SOURCE, SCOPE & EVIDENCE</p>
          <h2 id="evidence-title" className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">
            Built to be inspected.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            A public product, public source and explicit limits on what a review can tell you.
          </p>
        </div>
        <div className="grid gap-7 md:grid-cols-3 md:gap-8">
          {evidence.map((item) => (
            <article key={item.label} className="flex flex-col border-l border-emerald-300/20 pl-5">
              <p className="font-mono text-[10px] tracking-wide text-slate-400">{item.label}</p>
              <h3 className="mt-3 text-base font-medium text-slate-100">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-400">{item.description}</p>
              <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 self-start text-xs font-medium text-emerald-200 underline decoration-emerald-300/25 underline-offset-4 hover:text-emerald-100">
                {item.link} <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
      </section>
      <div className="mt-16 flex flex-col justify-between gap-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/4 px-6 py-6 sm:flex-row sm:items-center sm:px-8">
        <div>
          <p className="text-sm font-medium text-slate-100">Your release decision stays yours.</p>
          <p className="mt-1 text-xs leading-6 text-slate-400">Verify findings, run your tests and use human judgment before merging.</p>
        </div>
        <Link href="/about#beta" className="inline-flex items-center gap-2 self-start text-xs font-medium text-emerald-200 underline underline-offset-4 sm:self-auto">
          Share beta feedback <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
