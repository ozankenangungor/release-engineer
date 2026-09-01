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
      <p className="mt-3 text-muted">{study.summary}</p>
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

export function FeaturedPublicObservation() {
  const study = getPublishedCaseStudies().find(
    (item) =>
      item.slug === "rails-doc-typo-58968" &&
      item.participationSource === "founder-test",
  );
  if (!study) return null;
  return (
    <section
      aria-labelledby="featured-observation-title"
      className="featured-observation section-stage"
      data-reveal="0"
    >
      <div>
        <p className="section-kicker">
          REAL PUBLIC PR / FOUNDER-RUN OBSERVATION
        </p>
        <h2 id="featured-observation-title">
          {study.repository} #{study.prNumber}
        </h2>
        <p className="observation-label">
          Founder test — not external validation.
        </p>
        <p className="observation-summary">
          One file. +1/−1. A documentation correction classified as low risk,
          with no findings and explicit coverage limitations. The PR later
          merged upstream.
        </p>
        <Link href={`/case-studies/${study.slug}`} className="text-link">
          Read the observation & verification →
        </Link>
      </div>
      <div className="observation-context">
        <p className="section-kicker">PINNED REVIEWED HEAD</p>
        <a
          href={`https://github.com/${study.repository}/commit/${study.reviewedHeadSha}`}
          className="observation-sha text-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>{study.reviewedHeadSha}</code> <span aria-hidden="true">↗︎</span>
        </a>
        <p>
          The full repository was not inspected and tests were not run. The
          original report and exact product revision were not retained in the
          public record.
        </p>
        <p>
          The upstream merge does not establish model accuracy. No Rails use,
          endorsement or validation is claimed.
        </p>
      </div>
    </section>
  );
}
