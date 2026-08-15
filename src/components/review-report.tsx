import type { AnalysisResponse, Review } from "@/lib/review-schema";

const riskStyles = {
  low: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  medium: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  high: "border-orange-300/25 bg-orange-300/10 text-orange-200",
  critical: "border-rose-300/25 bg-rose-300/10 text-rose-200",
};
const verdictLabels = {
  merge: "Ready for human sign-off",
  review: "Review before merging",
  hold: "Hold this release",
};

function ReviewList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <section className="surface-card rounded-2xl p-5 sm:p-7">
      <h3 className="report-section-title flex items-center justify-between gap-3 text-sm font-semibold text-white">
        {title}{" "}
        <span className="font-mono text-xs font-normal text-slate-400">
          {items.length.toString().padStart(2, "0")}
        </span>
      </h3>
      {items.length ? (
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
          {items.map((item, index) => (
            <li key={index} className="report-text flex min-w-0 gap-3">
              <span aria-hidden="true" className="mt-0.5 shrink-0 font-mono text-[10px] text-emerald-200/70">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-400">{empty}</p>
      )}
    </section>
  );
}

function Finding({
  finding,
  index,
}: {
  finding: Review["findings"][number];
  index: number;
}) {
  return (
    <article data-severity={finding.severity} className="finding-card surface-card rounded-2xl p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase ${riskStyles[finding.severity]}`}
        >
          {finding.severity}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">
          {finding.category.replaceAll("_", " ")}
        </span>
        <span className="ml-auto font-mono text-xs text-slate-500">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h4 className="report-text mt-5 text-lg font-semibold tracking-tight text-slate-100">
        {finding.title}
      </h4>
      {finding.file && (
        <p className="report-text mt-2 font-mono text-xs text-emerald-200/80">
          {finding.file}
        </p>
      )}
      <p className="report-text mt-3 text-sm leading-6 text-slate-300">
        {finding.explanation}
      </p>
      <div className="report-recommendation mt-5 border-t border-white/8">
        <p className="font-mono text-[9px] tracking-widest text-emerald-200">
          RECOMMENDATION
        </p>
        <p className="report-text mt-1.5 text-sm leading-6 text-slate-200">
          {finding.recommendation}
        </p>
      </div>
    </article>
  );
}

export function ReviewReport({ result }: { result: AnalysisResponse }) {
  const { review, pullRequest: pr, coverage, warnings } = result;
  return (
    <section aria-labelledby="review-title" className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs tracking-widest text-emerald-300">
          RELEASE READINESS / REVIEW
        </p>
        <a
          href={pr.url}
          target="_blank"
          rel="noopener noreferrer"
          className="report-text text-xs text-slate-400 underline underline-offset-4 hover:text-white"
        >
          {pr.owner}/{pr.repository} #{pr.number} ↗
        </a>
      </div>
      <div data-risk={review.overallRisk} className="report-summary workspace-card rounded-2xl p-6 sm:p-9">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase ${riskStyles[review.overallRisk]}`}
          >
            {review.overallRisk} risk
          </span>
          <span className="text-sm text-slate-300">
            {verdictLabels[review.verdict]}
          </span>
        </div>
        <h2
          id="review-title"
          className="report-text mt-6 text-2xl leading-snug font-semibold tracking-[-0.035em] sm:text-4xl"
        >
          {pr.title}
        </h2>
        <p className="report-text mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          {review.summary}
        </p>
        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-6 font-mono text-[11px] text-slate-400">
          <span>
            {coverage.includedFiles}/{pr.changedFileCount} files in context
          </span>
          <span>
            <span className="text-emerald-300">+{pr.additions}</span> /{" "}
            <span className="text-rose-300">−{pr.deletions}</span>
          </span>
          <span className="report-text">
            {pr.headBranch} → {pr.baseBranch}
          </span>
          <span>HEAD {pr.headSha.slice(0, 7)}</span>
        </div>
      </div>
      {warnings.length > 0 && (
        <aside
          aria-label="Partial analysis warning"
          className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/7 p-5 sm:p-6"
        >
          <h3 className="text-sm font-medium text-amber-200">
            Partial review · Some change context was unavailable
          </h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-amber-100/80">
            {warnings.map((warning, index) => (
              <li key={index} className="report-text">{warning}</li>
            ))}
          </ul>
        </aside>
      )}
      <section className="mt-8" aria-labelledby="findings-title">
        <div className="mb-5 flex items-center gap-3">
          <h3 id="findings-title" className="text-lg font-semibold tracking-tight">
            Findings
          </h3>
          <span className="rounded-md border border-white/10 px-2 py-0.5 font-mono text-xs text-slate-400">
            {review.findings.length}
          </span>
        </div>
        {review.findings.length ? (
          <div className="space-y-4">
            {review.findings.map((finding, index) => (
              <Finding key={index} finding={finding} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-6">
            <p className="text-sm font-medium text-emerald-200">
              No issue detected in the supplied context.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              This review does not establish that the change is safe. Check the
              testing gaps and review limitations below.
            </p>
          </div>
        )}
      </section>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ReviewList
          title="Testing gaps"
          items={review.testingGaps}
          empty="No specific testing gaps identified in the supplied context."
        />
        <ReviewList
          title="Breaking changes"
          items={review.breakingChanges}
          empty="No breaking changes identified in the supplied context."
        />
      </div>
      <div className="mt-4">
        <ReviewList
          title="Recommended actions"
          items={review.recommendedActions}
          empty="Complete your normal human review and CI checks before merging."
        />
      </div>
      <details
        className="surface-card mt-5 rounded-2xl p-5 sm:p-6"
        open
      >
        <summary className="cursor-pointer text-sm font-medium text-slate-300">
          Review limitations
        </summary>
        <ul className="mt-3 space-y-2 text-xs leading-6 text-slate-400">
          {review.limitations.map((limitation, index) => (
            <li key={index} className="report-text">
              {limitation}
            </li>
          ))}
        </ul>
      </details>
      <p className="mt-5 text-xs leading-5 text-slate-500">
        Powered by Claude. Findings are decision support; verify them against
        the code and your release process.
      </p>
    </section>
  );
}
