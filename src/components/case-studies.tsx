import Link from "next/link";
import {
  getPublishedCaseStudies,
  type CaseStudy,
} from "@/content/case-studies";

export function CaseStudyRecord({ study }: { study: CaseStudy }) {
  return (
    <article className="case-record">
      <p className="section-kicker">
        {study.participationSource === "external-tester"
          ? "EXTERNAL TESTER OBSERVATION"
          : "FOUNDER TEST · NOT EXTERNAL VALIDATION"}
      </p>
      <h2 className="mt-4 text-2xl tracking-tight">{study.title}</h2>
      <p className="mt-3 text-slate-300">{study.summary}</p>
      <dl className="case-details">
        <div>
          <dt>Public PR</dt>
          <dd>
            <a
              className="text-link"
              href={study.prUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {study.repository} #{study.prNumber} ↗︎
            </a>
          </dd>
        </div>
        <div>
          <dt>Reviewed head</dt>
          <dd className="report-text font-mono text-xs">
            {study.reviewedHeadSha}
          </dd>
        </div>
        <div>
          <dt>Product commit</dt>
          <dd className="report-text font-mono text-xs">
            {study.productCommit ?? "Not recorded"}
          </dd>
        </div>
        <div>
          <dt>Observed</dt>
          <dd>
            <time dateTime={study.observedAt}>{study.observedAt}</time>
          </dd>
        </div>
        <div>
          <dt>Release Engineer surfaced</dt>
          <dd>
            <ul>
              {study.surfaced.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>Human verification</dt>
          <dd>
            {study.verification}
            <ul className="mt-2">
              {study.verificationEvidence.map((url, i) => (
                <li key={url}>
                  <a
                    className="text-link"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Verification source {i + 1} ↗︎
                  </a>
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>Action taken</dt>
          <dd>{study.actionTaken ?? "Not established"}</dd>
        </div>
        <div>
          <dt>Limitations</dt>
          <dd>
            <ul>
              {study.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function CaseStudiesPreview() {
  const studies = getPublishedCaseStudies();
  if (!studies.length) return null;
  return (
    <section
      aria-labelledby="cases-title"
      className="section-stage content-section"
    >
      <div className="section-heading">
        <div>
          <p className="section-kicker">PINNED PUBLIC OBSERVATIONS</p>
          <h2 id="cases-title">From an actual pull request.</h2>
        </div>
        <Link className="text-link" href="/case-studies">
          All case studies →
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {studies.slice(0, 3).map((study) => (
          <article key={study.slug} className="case-record">
            <p className="section-kicker">
              {study.participationSource === "external-tester"
                ? "EXTERNAL TESTER"
                : "FOUNDER TEST"}
            </p>
            <h3 className="mt-4 text-xl">{study.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {study.summary}
            </p>
            <Link
              href={`/case-studies/${study.slug}`}
              className="text-link mt-5 inline-block"
            >
              Observation & verification →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
