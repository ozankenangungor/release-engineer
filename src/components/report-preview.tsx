"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { ReleaseMark } from "./brand";
const tabs = ["Risk", "Evidence", "Next steps"] as const;
type Tab = (typeof tabs)[number];
// Authored illustration only. No generated report, real PR or live request.
export function ReportPreview() {
  const [tab, setTab] = useState<Tab>("Risk");
  const [selected, setSelected] = useState(false);
  const controls = useRef<(HTMLButtonElement | null)[]>([]);
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setTab(tabs[next]!);
    controls.current[next]?.focus();
  }
  return (
    <section
      id="report-preview"
      className="showcase-section section-shell"
      aria-labelledby="preview-title"
    >
      <div className="section-heading showcase-heading">
        <div>
          <p className="section-kicker">01 / FROM DIFF TO DECISION</p>
          <h2 id="preview-title">
            A small change.
            <br />
            <span>A different contract.</span>
          </h2>
        </div>
        <div>
          <p>
            Connect what changed to what needs checking. Evidence, uncertainty
            and next steps in one view.
          </p>
          <p className="preview-disclosure">
            <span aria-hidden="true">◌</span> Illustrative example — not a live
            analysis.
          </p>
        </div>
      </div>
      <div className="product-workspace" data-selected={selected}>
        <div className="workspace-titlebar">
          <span className="workspace-brand">
            <ReleaseMark />
            Release Engineer<span className="workspace-slash">/</span>
            <span>Review workspace</span>
          </span>
          <span className="workspace-fixture">AUTHORED EXAMPLE</span>
        </div>
        <div className="workspace-body">
          <aside className="workspace-rail" aria-hidden="true">
            <span className="rail-active">⌘</span>
            <span>≋</span>
            <span>↳</span>
            <i />
            <ReleaseMark />
          </aside>
          <div className="diff-pane">
            <div className="pane-title">
              <span>
                <span className="file-icon">TS</span>src/api/releases.ts
              </span>
              <span className="diff-stats">
                +1 <span>−1</span>
              </span>
            </div>
            <div className="diff-heading">
              <p className="workspace-kicker">SOURCE / RESPONSE CONTRACT</p>
              <h3>Wrap the release response</h3>
              <p>An authored change to GET /releases</p>
            </div>
            <div
              className="code-diff"
              aria-label="Illustrative API response diff"
            >
              <div className="code-line">
                <span>08</span>
                <code>
                  <b>export async function</b> GET() {"{"}
                </code>
              </div>
              <div className="code-line">
                <span>09</span>
                <code>
                  {" "}
                  <b>const</b> releases = <b>await</b> listReleases();
                </code>
              </div>
              <div className="code-line">
                <span>10</span>
                <code> </code>
              </div>
              <div className="code-line diff-removed">
                <span>11</span>
                <code>
                  − <b>return</b> Response.json(releases);
                </code>
              </div>
              <button
                className="code-line diff-added"
                aria-pressed={selected}
                aria-label="Select changed response line to inspect its risk"
                onClick={() => {
                  setSelected((value) => !value);
                  setTab("Risk");
                }}
              >
                <span>11</span>
                <code>
                  + <b>return</b> Response.json({"{"} items: releases {"}"});
                </code>
                <span className="line-signal" aria-hidden="true">
                  ↗︎
                </span>
              </button>
              <div className="code-line">
                <span>12</span>
                <code>{"}"}</code>
              </div>
              <div className="code-line code-muted">
                <span>13</span>
                <code>{"// Callers outside this patch are not shown."}</code>
              </div>
            </div>
            <div className="source-interaction">
              <span className="source-target" aria-hidden="true">
                ⌖
              </span>
              <p>
                {selected
                  ? "Changed line selected. Its potential risk is highlighted in the report."
                  : "Select the added line to trace its potential release risk."}
              </p>
            </div>
            <div className="source-boundary">
              <span className="workspace-kicker">THE CONTRACT BOUNDARY</span>
              <div>
                <code>Release[]</code>
                <span aria-hidden="true">→</span>
                <code>
                  {"{"} items: Release[] {"}"}
                </code>
              </div>
              <p>Same data. A different shape for every caller.</p>
            </div>
          </div>
          <div className="finding-pane">
            <div className="pane-title">
              <span>Release-readiness report</span>
              <span className="report-potential">POTENTIAL RISK</span>
            </div>
            <div
              className="workspace-tabs"
              role="tablist"
              aria-label="Example report views"
            >
              {tabs.map((item, index) => (
                <button
                  key={item}
                  ref={(node) => {
                    controls.current[index] = node;
                  }}
                  role="tab"
                  id={`example-tab-${index}`}
                  aria-selected={tab === item}
                  aria-controls="example-panel"
                  tabIndex={tab === item ? 0 : -1}
                  onClick={() => setTab(item)}
                  onKeyDown={(event) => navigate(event, index)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div
              id="example-panel"
              role="tabpanel"
              aria-labelledby={`example-tab-${tabs.indexOf(tab)}`}
              tabIndex={0}
              className="example-panel"
            >
              {tab === "Risk" && (
                <div className="risk-view" data-highlighted={selected}>
                  <div className="finding-classification">
                    <span className="risk-indicator" aria-hidden="true" />
                    <span>High risk · Human review needed</span>
                    <span>01</span>
                  </div>
                  <p className="workspace-kicker">
                    BREAKING CHANGE / API CONTRACT
                  </p>
                  <h3>The response shape changed.</h3>
                  <p>
                    GET /releases changes from an array to an object with an{" "}
                    <code>items</code> field. A caller expecting an array could
                    fail.
                  </p>
                  <p className="finding-uncertainty">
                    Callers outside the supplied patches have not been
                    inspected. This is a concern to verify, not a confirmed
                    regression.
                  </p>
                  <div className="finding-action">
                    <span aria-hidden="true">↳</span>
                    <p>
                      Verify the API contract and affected callers. Add a
                      compatibility test or document a coordinated migration
                      before merging.
                    </p>
                  </div>
                </div>
              )}
              {tab === "Evidence" && (
                <div className="evidence-view">
                  <p className="workspace-kicker">
                    SOURCE EVIDENCE / AUTHORED PATCH
                  </p>
                  <h3>From an array to an envelope.</h3>
                  <dl>
                    <div>
                      <dt>File</dt>
                      <dd>
                        <code>src/api/releases.ts</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Before</dt>
                      <dd>
                        <code>Response.json(releases)</code>
                      </dd>
                    </div>
                    <div>
                      <dt>After</dt>
                      <dd>
                        <code>
                          Response.json({"{"} items: releases {"}"})
                        </code>
                      </dd>
                    </div>
                    <div>
                      <dt>Inference</dt>
                      <dd>
                        Existing callers may expect the original top-level
                        array.
                      </dd>
                    </div>
                    <div>
                      <dt>Uncertainty</dt>
                      <dd>
                        Caller code and the intended API contract are outside
                        this illustrative patch.
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
              {tab === "Next steps" && (
                <div className="next-view">
                  <p className="workspace-kicker">
                    HUMAN VERIFICATION / BEFORE MERGE
                  </p>
                  <h3>Turn the concern into a check.</h3>
                  <ol>
                    <li>
                      <span>01</span>
                      <p>
                        Inspect callers and confirm the intended API contract.
                      </p>
                    </li>
                    <li>
                      <span>02</span>
                      <p>
                        Run a response compatibility test against the existing
                        client.
                      </p>
                    </li>
                    <li>
                      <span>03</span>
                      <p>
                        Review omitted files; document any coordinated
                        migration.
                      </p>
                    </li>
                  </ol>
                  <details className="testing-details">
                    <summary>Missing tests & suggested human checks</summary>
                    <h4>Missing test coverage</h4>
                    <p>
                      No compatibility test is visible in this example context.
                      That does not establish that the repository has no such
                      tests.
                    </p>
                  </details>
                </div>
              )}
            </div>
            <aside
              className="example-coverage"
              aria-label="Example coverage limitation"
            >
              <div>
                <span className="coverage-icon" aria-hidden="true">
                  ◐
                </span>
                <strong>Partial · Some files omitted</strong>
              </div>
              <p>
                The full repository was not inspected and tests were not run.
                This assessment does not establish release safety.
              </p>
            </aside>
          </div>
        </div>
        <div className="workspace-statusbar">
          <span>
            <span className="status-dot" aria-hidden="true" />
            Evidence → Inference → Verification
          </span>
          <span>
            Review before merging<span aria-hidden="true"> ↗︎</span>
          </span>
        </div>
      </div>
      <div className="showcase-footnote">
        <span>THE SIGNAL IS A STARTING POINT.</span>
        <p>A structured second perspective, with the limits kept in view.</p>
      </div>
    </section>
  );
}
