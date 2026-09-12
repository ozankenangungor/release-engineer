"use client";

import { useState } from "react";

// Fixed, authored data only. This playground never fetches or executes PR code.
const sampleReleases = [
  { id: "r_01", version: "v1.8.0" },
  { id: "r_02", version: "v1.9.0" },
];
type Caller = "array" | "envelope";
type Result = { compatible: boolean; message: string; versions?: string[] };

export function ExampleContractLab() {
  const [version, setVersion] = useState<"before" | "after">("after");
  const [caller, setCaller] = useState<Caller>("array");
  const [result, setResult] = useState<Result | null>(null);
  const payload = version === "before" ? sampleReleases : { items: sampleReleases };

  function runExample() {
    const rows =
      caller === "array"
        ? payload
        : "items" in payload
          ? payload.items
          : undefined;
    if (!Array.isArray(rows)) {
      setResult({
        compatible: false,
        message:
          caller === "array"
            ? "This caller expects a top-level array. The changed response is an object with an items field."
            : "This caller expects payload.items. The original response is a top-level array.",
      });
      return;
    }
    setResult({
      compatible: true,
      message: "The example caller can read both release versions from this response.",
      versions: rows.map((release) => release.version),
    });
  }

  return (
    <div className="contract-lab">
      <div className="diff-heading">
        <p className="workspace-kicker">INTERACTIVE / RESPONSE PLAYGROUND</p>
        <h3 id="example-playground-title">Try both sides of the contract.</h3>
        <p>Same releases. Switch the shape, then try a caller.</p>
      </div>
      <div
        className="response-controls"
        role="group"
        aria-label="Example response version"
      >
        {(["before", "after"] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={version === item}
            onClick={() => {
              setVersion(item);
              setResult(null);
            }}
          >
            <span>{item === "before" ? "Before change" : "After change"}</span>
            <code>
              {item === "before" ? "Release[]" : "{ items: Release[] }"}
            </code>
          </button>
        ))}
      </div>
      <div className="response-payload">
        <span className="workspace-kicker">AUTHORED RESPONSE / JSON</span>
        <pre aria-label="Example response payload">
          <code>{JSON.stringify(payload, null, 2)}</code>
        </pre>
      </div>
      <div className="caller-controls">
        <label htmlFor="example-caller">Example caller</label>
        <select
          id="example-caller"
          value={caller}
          onChange={(event) => {
            setCaller(event.target.value as Caller);
            setResult(null);
          }}
        >
          <option value="array">Existing caller · expects an array</option>
          <option value="envelope">Updated caller · expects items</option>
        </select>
        <code className="caller-expression">
          {caller === "array"
            ? "payload.map(release => release.version)"
            : "payload.items.map(release => release.version)"}
        </code>
        <button
          className="workspace-action workspace-action-primary"
          type="button"
          onClick={runExample}
        >
          <span aria-hidden="true">▷</span> Run example caller
        </button>
        <div
          className="caller-result"
          role="status"
          aria-label="Example caller result"
          data-outcome={
            result ? (result.compatible ? "compatible" : "incompatible") : "idle"
          }
        >
          {result ? (
            <>
              <strong>
                {result.compatible
                  ? "Compatible in this example"
                  : "Incompatible in this example"}
              </strong>
              <p>{result.message}</p>
              {result.versions ? (
                <code>{JSON.stringify(result.versions)}</code>
              ) : null}
            </>
          ) : (
            <p>
              Run the example to see how this caller reads the selected response.
            </p>
          )}
        </div>
        <p className="playground-disclosure">
          Browser-only example data. No PR code or repository tests are run.
        </p>
      </div>
    </div>
  );
}
