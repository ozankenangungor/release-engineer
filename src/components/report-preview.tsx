import { Finding } from "@/components/review-report";
import type { Review } from "@/lib/review-schema";

// Authored UI example, not a generated report or an observation of a real PR.
const exampleFinding: Review["findings"][number] = {
  severity: "high",
  category: "breaking_change",
  title: "Check callers of the changed response shape",
  file: "src/api/releases.ts",
  explanation:
    "In this illustrative patch, GET /releases changes from an array to an object with an items field. A caller expecting an array could fail. Callers outside the supplied patches have not been inspected.",
  recommendation:
    "Verify the API contract and affected callers. Add a compatibility test or document a coordinated migration before merging.",
};

export function ReportPreview() {
  return (
    <section
      id="report-preview"
      aria-labelledby="preview-title"
      className="report-preview section-stage"
    >
      <div className="preview-intro">
        <div>
          <p className="section-kicker">WHAT YOU GET</p>
          <h2 id="preview-title">A report you can act on.</h2>
        </div>
        <p className="preview-disclosure">
          Illustrative example — not a live analysis.
        </p>
      </div>
      <div className="preview-grid">
        <div className="preview-assessment surface-card">
          <p className="preview-risk">High risk · Human review needed</p>
          <h3>Review before merging</h3>
          <p>
            A response contract may have changed. Verify compatibility and test
            coverage before a release.
          </p>
          <dl>
            <div>
              <dt>Evidence</dt>
              <dd>Selected metadata and patches</dd>
            </div>
            <div>
              <dt>Context</dt>
              <dd>Partial · Some files omitted</dd>
            </div>
          </dl>
          <aside
            className="preview-warning"
            aria-label="Example coverage limitation"
          >
            Incomplete context: the full repository was not inspected and tests
            were not run. This assessment does not establish release safety.
          </aside>
        </div>
        <div className="preview-finding">
          <h3 className="preview-section-title">Potential release risk</h3>
          <Finding finding={exampleFinding} index={0} />
          <details className="preview-checks">
            <summary>Illustrative source excerpt</summary>
            <pre className="report-text mt-4 text-sm leading-7 text-slate-300">
              <code>
                {
                  "// src/api/releases.ts — authored example\n− return releases;\n+ return { items: releases };"
                }
              </code>
            </pre>
          </details>
        </div>
      </div>
      <details className="preview-checks">
        <summary>Missing tests & suggested human checks</summary>
        <div>
          <section>
            <h3>Missing test coverage</h3>
            <p>
              No compatibility test is visible in this example context. That
              does not establish that the repository has no such tests.
            </p>
          </section>
          <section>
            <h3>Human verification</h3>
            <p>
              Inspect callers, confirm the intended API contract and run a
              response compatibility test. Review omitted files before making a
              merge decision.
            </p>
          </section>
        </div>
      </details>
    </section>
  );
}
