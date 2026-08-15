import Link from "next/link";
import { AnalysisForm } from "@/components/analysis-form";
import { ReleaseScene } from "@/components/release-scene";
import { ReleaseMark } from "@/components/brand";

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
    source: "src/lib/claude.ts",
  },
  {
    label: "02 / EVIDENCE",
    title: "Measured, with limits",
    description:
      "Live synthetic evaluations are documented with source runs, metrics, failures and regressions. They are not real-world accuracy, traction or external validation.",
    link: "Read the evaluation evidence",
    href: "https://github.com/ozankenangungor/release-engineer/blob/main/docs/live-evaluation-evidence.md",
    source: "docs/live-evaluation-evidence.md",
  },
  {
    label: "03 / SCOPE",
    title: "The boundaries stay visible",
    description:
      "Partial coverage and review limitations are explicit. Reviews do not inspect the full repository, run tests or guarantee release safety.",
    link: "Security and product scope",
    href: "https://github.com/ozankenangungor/release-engineer/blob/main/SECURITY.md",
    source: "SECURITY.md",
  },
];

export default function Home() {
  return (
    <main id="main" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 sm:pb-28">
      <section
        aria-labelledby="hero-title"
        className="hero-stage grid gap-9 py-10 sm:py-16 md:grid-cols-[1fr_1.08fr] md:items-center md:gap-x-8 lg:gap-x-14 lg:pt-12 lg:pb-16"
      >
        <div className="hero-copy relative z-10">
          <p className="claude-badge mb-6 inline-flex items-center gap-2.5 rounded-full px-3.5 py-2 font-mono text-[10px] tracking-widest text-emerald-200 sm:mb-8">
            <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#6ee7b755]" aria-hidden="true" />
            POWERED BY CLAUDE
          </p>
          <h1 id="hero-title" className="hero-title font-semibold tracking-[-0.065em]">
            <span className="hero-prefix block font-normal tracking-[-0.035em] text-slate-300">Your AI</span>
            <span className="block">Release</span>{" "}
            <span className="hero-wordmark block">Engineer</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Review pull requests for regressions, testing gaps, breaking changes
            and release risks before they reach production.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400 sm:text-xs">
            <span>Public GitHub PRs only</span>
            <span className="h-3 w-px bg-white/15" aria-hidden="true" />
            <span>Decision support. Human judgment.</span>
          </div>
          <a href="#how-it-works" className="hero-explore mt-8 hidden items-center gap-3 text-xs text-slate-300 lg:inline-flex">
            <span className="flex size-7 items-center justify-center rounded-full border border-white/15" aria-hidden="true">↓</span>
            Explore the workflow
          </a>
        </div>
        <ReleaseScene />
        <AnalysisForm />
      </section>
      <div className="founder-strip flex flex-col justify-between gap-5 rounded-2xl px-5 py-6 sm:px-7 lg:flex-row lg:items-center">
        <div className="flex max-w-2xl items-start gap-4">
          <span aria-hidden="true" className="founder-monogram mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl font-mono text-xs text-emerald-200">
            OKG
          </span>
          <div>
            <p className="section-kicker mb-1.5">INDEPENDENT · FOUNDER-LED</p>
            <p className="text-xs leading-6 text-slate-300">
              Release Engineer is a bootstrapped developer-tool startup founded
              in October 2026 in Ankara, Türkiye by Ozan Kenan Güngör.
            </p>
          </div>
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
        className="section-stage pt-16 sm:pt-24"
      >
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="section-kicker">THE WORKFLOW</p>
            <h2 className="mt-3 text-balance text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
              From pull request to release review.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-slate-400">
            Selected changes. Structured findings.<br className="hidden sm:block" /> Clear limits on what was reviewed.
          </p>
        </div>
        <div className="workflow-grid grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.number} className="workflow-card surface-card relative flex flex-col rounded-2xl p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <span className="workflow-icon flex size-11 items-center justify-center rounded-xl text-emerald-200" aria-hidden="true">
                  {feature.number === "01" ? <ReleaseMark className="size-6" /> : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="size-6">
                      {feature.number === "02" ? (
                        <><path d="m12 3 9 9-9 9-9-9 9-9Z" /><path d="m12 7 5 5-5 5-5-5 5-5Z" /></>
                      ) : (
                        <><path d="M7 3h8l4 4v14H5V3h2Zm7 0v5h5M8 12h8M8 16h5" /></>
                      )}
                    </svg>
                  )}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {feature.number}
                </span>
              </div>
              <h3 className="mt-8 text-xl font-medium tracking-tight text-slate-100">
                {feature.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">
                {feature.description}
              </p>
              <p className="mt-7 border-t border-white/8 pt-4 font-mono text-[10px] text-emerald-200/80">
                {feature.detail}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section aria-labelledby="evidence-title" className="section-stage mt-16 pt-12 sm:mt-24 sm:pt-16">
        <div className="mb-9 max-w-xl">
          <p className="section-kicker">SOURCE, SCOPE & EVIDENCE</p>
          <h2 id="evidence-title" className="mt-3 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
            Built to be inspected.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            A public product, public source and explicit limits on what a review can tell you.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {evidence.map((item) => (
            <article key={item.label} className="proof-card surface-card flex flex-col rounded-2xl p-6 sm:p-7">
              <div className="mb-8 flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] tracking-wide text-emerald-200">{item.label}</p>
                <span aria-hidden="true" className="proof-glyph text-xl text-emerald-200">↗</span>
              </div>
              <h3 className="text-xl font-medium tracking-tight text-slate-100">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-400">{item.description}</p>
              <p className="mt-7 break-all border-t border-white/8 pt-4 font-mono text-[10px] leading-5 text-slate-400">{item.source}</p>
              <a href={item.href} target="_blank" rel="noopener noreferrer" className="evidence-link mt-4 inline-flex items-center gap-2 self-start text-xs font-medium text-emerald-200 underline decoration-emerald-300/25 underline-offset-4">
                {item.link} <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
      </section>
      <div className="decision-banner mt-16 flex flex-col justify-between gap-5 rounded-2xl px-6 py-7 sm:mt-20 sm:flex-row sm:items-center sm:px-8">
        <div>
          <p className="text-lg font-medium tracking-tight text-slate-100">Your release decision stays yours.</p>
          <p className="mt-1 text-xs leading-6 text-slate-400">Verify findings, run your tests and use human judgment before merging.</p>
        </div>
        <Link href="/about#beta" className="secondary-action inline-flex items-center gap-3 self-start rounded-xl px-4 py-3 text-xs font-medium text-emerald-200 sm:self-auto">
          Share beta feedback <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
