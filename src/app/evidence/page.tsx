import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCaseStudies } from "@/content/case-studies";

const title = "Evidence — Release Engineer";
const description =
  "Sources, dated synthetic evaluations, approved beta feedback and the limits of current Release Engineer evidence.";
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
const deploymentCommit = process.env.VERCEL_GIT_COMMIT_SHA;
const sourceRevision = /^[a-f0-9]{40}$/.test(deploymentCommit ?? "")
  ? deploymentCommit
  : "main";

export default function Evidence() {
  const studies = getPublishedCaseStudies();
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
          A clear view of what exists, where it can be inspected, and what it
          establishes. Technical checks, qualitative feedback and usage records
          answer different questions.
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
              A live public-PR review interface with Claude as the core
              reasoning engine. Bounded retrieval, prompt-injection defenses,
              structured output validation and deterministic coverage safeguards
              are visible in the source.
            </p>
            <div className="flex flex-wrap gap-x-6">
              <Link className="text-link" href="/">
                Open the product →
              </Link>
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
          <span className="evidence-status">QUALITATIVE FEEDBACK</span>
          <div>
            <h2>Approved early developer feedback.</h2>
            <p>
              Three exact quotes supplied by the founder, with permission to
              publish the approved display names and roles. PR links were not
              approved. This is informal external beta feedback; it does not
              independently verify a finding or establish a unique developer
              count.
            </p>
            <Link className="text-link" href="/#developer-feedback">
              Read the approved quotes →
            </Link>
          </div>
        </section>
        <section className="evidence-entry" data-reveal="0">
          <span className="evidence-status">
            {studies.length ? "PINNED OBSERVATIONS" : "NOT YET PUBLISHED"}
          </span>
          <div>
            <h2>Public PR case studies.</h2>
            <p>
              {studies.length
                ? "Published observations identify a reviewed head SHA, participation source, human verification, outcome and limitations. Founder tests are explicitly distinguished from external tester observations."
                : "No case with a pinned public PR, reviewed head SHA and documented human verification has been supplied for publication. Informal feedback is not a substitute for this evidence."}
            </p>
            {studies.length ? (
              <Link className="text-link" href="/case-studies">
                Read the public observations →
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
          <span className="evidence-status">MEASUREMENT METHOD</span>
          <div>
            <h2>Live usage, without a vanity counter.</h2>
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
              Founded by Ozan Kenan Güngör in October 2026, in Ankara, Türkiye.
              Bootstrapped and in early beta, with no external funding raised.
              These company facts are founder-supplied.
            </p>
            <div className="flex flex-wrap gap-x-6">
              <Link className="text-link" href="/about">
                Founder & company →
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
    </main>
  );
}
