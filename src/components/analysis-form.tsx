"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { parseGitHubPullRequestUrl, PR_URL_ERROR } from "@/lib/github-url";
import {
  analysisResponseSchema,
  type AnalysisResponse,
} from "@/lib/review-schema";
import { ReviewReport } from "./review-report";
import { createPortal } from "react-dom";

export function AnalysisForm({ examplePrUrl }: { examplePrUrl?: string }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [invalidUrl, setInvalidUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => setElapsed((value) => value + 1), 1_000);
    return () => clearInterval(interval);
  }, [loading]);
  useEffect(() => () => controllerRef.current?.abort(), []);
  useEffect(() => {
    if (result) {
      resultRef.current?.focus({ preventScroll: true });
      resultRef.current?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    }
  }, [result]);

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(null);
    setInvalidUrl(false);
    setResult(null);
    let parsed;
    try {
      parsed = parseGitHubPullRequestUrl(url);
    } catch {
      setError(PR_URL_ERROR);
      setInvalidUrl(true);
      inputRef.current?.focus();
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setElapsed(0);
    setLoading(true);
    const timeout = setTimeout(() => controller.abort(), 125_000);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: parsed.url }),
        signal: controller.signal,
      });
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new Error(
          response.status === 429
            ? "The service is limiting requests. Wait a moment, then try again."
            : response.status === 504
              ? "The review took too long. Try again, or use a smaller PR."
              : "The service returned an unreadable response. Please try again later.",
        );
      }
      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "object" &&
          data.error !== null &&
          "message" in data.error &&
          typeof data.error.message === "string"
            ? data.error.message
            : "The analysis could not be completed. Please try again.";
        throw new Error(message);
      }
      const validated = analysisResponseSchema.safeParse(data);
      if (!validated.success)
        throw new Error("The report could not be validated. Please try again.");
      setResult(validated.data);
    } catch (failure) {
      if (controller.signal.aborted)
        setError(
          "The review took too long or was interrupted. Please try again, or use a smaller PR.",
        );
      else
        setError(
          failure instanceof Error && !(failure instanceof TypeError)
            ? failure.message
            : "Could not connect to the analysis service. Check your connection and try again.",
        );
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      controllerRef.current = null;
    }
  }

  const output =
    typeof document === "undefined"
      ? null
      : document.getElementById("analysis-results");
  return (
    <>
      <section
        id="analyze"
        tabIndex={-1}
        aria-label="Pull request analysis"
        className="hero-analyzer"
        data-loading={loading}
      >
        <h2 className="sr-only">Analyze a pull request</h2>
        <form onSubmit={analyze} aria-busy={loading} noValidate>
          <div className="analysis-label-row">
            <label htmlFor="pr-url">GitHub pull request URL</label>
            <span>Public PRs · No account</span>
          </div>
          <div className="analysis-controls">
            <input
              ref={inputRef}
              id="pr-url"
              type="url"
              inputMode="url"
              name="url"
              autoComplete="off"
              spellCheck={false}
              required
              maxLength={512}
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                if (error) setError(null);
                setInvalidUrl(false);
              }}
              disabled={loading}
              aria-invalid={invalidUrl}
              aria-describedby={
                error ? "analysis-error privacy-note" : "privacy-note"
              }
              placeholder="https://github.com/owner/repo/pull/123"
            />
            <button type="submit" disabled={loading} className="primary-action">
              {loading ? (
                <>
                  <span className="loading-spinner" aria-hidden="true" />
                  Analyzing…
                </>
              ) : (
                <>
                  Analyze PR <span aria-hidden="true">↗︎</span>
                </>
              )}
            </button>
          </div>
          <div className="analysis-support">
            <p id="privacy-note">
              Public PR contents are sent to Claude. PR contents and reports are
              not persisted by the application.{" "}
              <Link href="/privacy">Privacy</Link>
            </p>
            {examplePrUrl && (
              <button
                type="button"
                disabled={loading}
                className="example-action"
                title="Prefill Rails PR #58968. Analysis starts only when you choose Analyze PR."
                onClick={() => {
                  setUrl(examplePrUrl);
                  setError(null);
                  setInvalidUrl(false);
                  setResult(null);
                  inputRef.current?.focus();
                }}
              >
                Load example PR <span aria-hidden="true">↗︎</span>
              </button>
            )}
          </div>
        </form>
        <noscript>
          <p className="analysis-notice">
            Enable JavaScript to submit a pull request for analysis. Project
            information, feedback and evidence links are available without
            JavaScript.
          </p>
        </noscript>
        {error && (
          <div
            id="analysis-error"
            role="alert"
            aria-label="Analysis error"
            className="analysis-error"
          >
            <p>Review could not be completed</p>
            <p>{error}</p>
          </div>
        )}
        {loading && (
          <div role="status" aria-live="polite" className="analysis-status">
            <span className="analysis-progress" aria-hidden="true" />
            <p>Retrieving GitHub changes and preparing your Claude review.</p>
            <p>
              This may take up to two minutes. Keep this page open.{" "}
              <span aria-hidden="true">{elapsed}s elapsed.</span>
            </p>
          </div>
        )}
      </section>
      {result &&
        output &&
        createPortal(
          <div
            ref={resultRef}
            tabIndex={-1}
            role="region"
            aria-label="Completed release review"
            className="completed-report"
          >
            <ReviewReport result={result} />
          </div>,
          output,
        )}
    </>
  );
}
