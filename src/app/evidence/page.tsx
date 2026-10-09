import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCaseStudies } from "@/content/case-studies";
import { Testimonials } from "@/components/testimonials";
import { DeploymentProvenance } from "@/components/deployment-provenance";
import { getDeploymentProvenance } from "@/lib/deployment-provenance";

const title = "Evidence — Release Engineer";
const description =
  "The live product, public source, approved external beta feedback, pinned Rails PR observation and limits of Release Engineer evidence.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/evidence" },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
  openGraph: { title, description, url: "/evidence", type: "website" },
};
const repository = "https://github.com/ozankenangungor/release-engineer";

export default function Evidence() {
  const studies = getPublishedCaseStudies();
  const railsObservation = studies.find(
    (item) => item.slug === "rails-doc-typo-58968",
  );
  const sourceRevision =
    getDeploymentProvenance({
      sha: process.env.VERCEL_GIT_COMMIT_SHA,
    })?.sha ?? "main";
  return (
    <main id="main" className="page-shell evidence-page">
      <div className="evidence-hero">
        <p className="section-kicker">RELEASE ENGINEER / EVIDENCE INDEX</p>
        <h1 className="page-title">
          The record
          <br />
          <span>behind the beta.</span>
        </h1>
        <p className="page-intro">
          Start with the live product, external beta feedback and a real public
          PR observation. Then inspect Claude’s role, evaluation results and the
          boundaries of each record.
        </p>
        <div className="evidence-principles" aria-label="Evidence principles">
          <span>Inspectable source</span>
          <span>Dated observations</span>
          <span>Explicit boundaries</span>
        </div>
      </div>
      <div className="evidence-ledger">
        <section className="evidence-entry" data-reveal="0">
          <span className="evidence-status">PUBLIC PRODUCT & SOURCE</span>
          <div>
            <h2>Working software, inspectable engineering.</h2>
            <p>
              Release Engineer is live in early beta. Paste a public GitHub PR
              for a structured second review of release risks, testing gaps and
              breaking changes, with explicit limits and human verification. The
              application source and CI history are public.
            </p>
            <p className="mt-3">
              Reports can be downloaded with the reviewed PR head and coverage
              limitations. A local verification worksheet lets reviewers record
              what they checked and did. These self-reported records become
              evidence only after separate source, permission and human review.
            </p>
            <div className="flex flex-wrap gap-x-6">
              <Link className="text-link" href="/">
                Open the product →
              </Link>
              <Link className="text-link" href="/pilot">Verification & beta feedback →</Link>
              <a
                className="text-link"
                href={repository}
                target="_blank"
                rel="noopener noreferrer"
              >
                Public repository ↗︎
              </a>
              <a
                className="text-link"
                href={`${repository}/actions/workflows/ci.yml`}
                target="_blank"
                rel="noopener noreferrer"
              >
                CI history ↗︎
              </a>
            </div>
            <DeploymentProvenance />
          </div>
        </section>
        <section className="evidence-entry" data-reveal="0">
          <span className="evidence-status">SOURCE & RUNTIME CHECKS</span>
          <div>
            <h2>Public changes, checked against pinned sources.</h2>
            <p>
              An assistant-executed technical walkthrough compares two upstream
              PRs before and after their changes. It records TypeScript compiler
              diagnostics, Bun request behavior and 106 passing tests from two
              selected Hono request-test files, with commands and source revisions.
            </p>
            <p className="mt-3">
              This is source and runtime verification. No Claude analysis or
              external developer session was performed; no finding, customer or
              model-quality claim is added. Failures and coverage limits remain
              visible in the record.
            </p>
            <div className="flex flex-wrap gap-x-6">
              <a
                className="text-link"
                href={`${repository}/blob/${sourceRevision}/docs/technical-walkthrough/README.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Sources, observations & reproduction ↗︎
              </a>
              <a className="text-link" href="/technical-walkthrough-kit.zip" download>
                Download the reproduction kit ↓
              </a>
            </div>
          </div>
        </section>
        <section className="evidence-entry" data-reveal="0">
          <span className="evidence-status">EXTERNAL BETA FEEDBACK</span>
          <div>
            <h2>Approved early developer feedback.</h2>
            <p>
              Three exact quotes from external beta testers, supplied by the
              founder and published with permission. Display aliases and roles
              are publication-approved; private identities and PR links are not
              disclosed.
            </p>
            <p className="mt-3">
              This is informal qualitative feedback. It does not independently
              verify findings, establish unique developer counts or demonstrate
              customer traction.
            </p>
            <Link className="text-link" href="#developer-feedback">
              Read the approved quotes →
            </Link>
          </div>
        </section>
        <section className="evidence-entry" data-reveal="0">
          <span className="evidence-status">
            {studies.length
              ? "PINNED PUBLIC PR OBSERVATION"
              : "NOT YET PUBLISHED"}
          </span>
          <div>
            <h2>
              {railsObservation
                ? "rails/rails #58968"
                : "Public PR case studies."}
            </h2>
            <p>
              {railsObservation
                ? "A one-file, +1/−1 Rails documentation correction, classified as low risk with no findings and explicit coverage limits in a founder-run check. The reviewed head is pinned and the PR later merged upstream."
                : studies.length
                  ? "Published observations identify a reviewed head SHA, participation source, human verification, outcome and limitations."
                  : "No case with a pinned public PR, reviewed head SHA and documented human verification has been supplied for publication."}
            </p>
            <p className="mt-3">
              {railsObservation
                ? "Founder test — not external validation. The original report and exact product commit are not in the public record. The upstream merge does not prove model accuracy; no Rails endorsement is claimed."
                : "Founder tests are distinguished from external tester observations. Informal feedback is not a substitute for pinned evidence."}
            </p>
            {studies.length ? (
              <Link
                className="text-link"
                href={
                  railsObservation
                    ? `/case-studies/${railsObservation.slug}`
                    : "/case-studies"
                }
              >
                Observation, sources & limitations →
              </Link>
            ) : (
              <a
                className="text-link"
                href={`${repository}/blob/main/docs/public-pr-case-study-template.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Case-study publication requirements ↗︎
              </a>
            )}
          </div>
        </section>
        <section className="evidence-entry" data-reveal="0">
          <span className="evidence-status">CLAUDE INTEGRATION</span>
          <div>
            <h2>Claude reasons. Application code sets the scope.</h2>
            <p>
              Claude is the core reasoning engine for cross-file review,
              evidence versus inference, and structured findings with explicit
              uncertainty. Deterministic application code handles GitHub
              retrieval, bounded context selection, schema validation and
              coverage enforcement.
            </p>
            <div className="flex flex-wrap gap-x-6">
              <a
                className="text-link"
                href={`${repository}/blob/${sourceRevision}/src/lib/claude.ts`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Production Claude integration ↗︎
              </a>
              <a
                className="text-link"
                href={`${repository}/blob/${sourceRevision}/src/lib/review-policy.ts`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Coverage safeguards ↗︎
              </a>
            </div>
          </div>
        </section>
        <section className="evidence-entry" data-reveal="0">
          <span className="evidence-status">SYNTHETIC OBSERVATIONS</span>
          <div>
            <h2>Evaluation with failures in view.</h2>
            <p>
              Two manually dispatched complete 32-case synthetic Claude runs are
              documented. The October 7, 2026 candidate completed 32/32 cases
              with 0 infrastructure errors, with 22 PASS / 10 FAIL under the
              strict evaluator and one critical violation remaining.
            </p>
            <p className="mt-3">
              These are dated synthetic observations, not real-world accuracy,
              customer traction, production reliability proof or external
              validation.
            </p>
            <a
              className="text-link"
              href={`${repository}/blob/main/docs/live-evaluation-evidence.md`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Metrics, failures, source runs & provenance ↗︎
            </a>
          </div>
        </section>
        <section className="evidence-entry" data-reveal="0">
          <span className="evidence-status">MEASUREMENT METHOD</span>
          <div>
            <h2>How live usage is measured.</h2>
            <p>
              The server emits privacy-safe operational events when an analysis
              starts, succeeds or fails. A success means the server prepared a
              schema-valid report. It does not prove correctness, browser
              delivery, a unique developer or a customer.
            </p>
            <p className="mt-3">
              No verified production count is published. A future count requires
              a preserved, complete production log window, deduplication and
              explicit exclusion or disclosure of operator testing.
            </p>
            <a
              className="text-link"
              href={`${repository}/blob/${sourceRevision}/docs/live-usage-evidence.md`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Usage evidence methodology ↗︎
            </a>
          </div>
        </section>
        <section className="evidence-entry" data-reveal="0">
          <span className="evidence-status">IDENTITY & BOUNDARIES</span>
          <div>
            <h2>A founder, a public record, a way to contact us.</h2>
            <p>
              Launched by Ozan Kenan Güngör in October 2026, in Ankara, Türkiye.
              Independently built and operated, self-funded and in early beta.
              No external investment has been raised. No legal company has been
              incorporated or registered. These project facts are
              founder-supplied.
            </p>
            <div className="flex flex-wrap gap-x-6">
              <Link className="text-link" href="/about">
                Founder & project →
              </Link>
              <a
                className="text-link"
                href={`${repository}/blob/main/SECURITY.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Security policy ↗︎
              </a>
              <Link className="text-link" href="/privacy">
                Privacy →
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Testimonials />
    </main>
  );
}
