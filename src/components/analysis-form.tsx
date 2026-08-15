"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { parseGitHubPullRequestUrl, PR_URL_ERROR } from "@/lib/github-url";
import {
  analysisResponseSchema,
  type AnalysisResponse,
} from "@/lib/review-schema";
import { ReviewReport } from "./review-report";

export function AnalysisForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => setElapsed((value) => value + 1), 1_000);
    return () => clearInterval(interval);
  }, [loading]);
  useEffect(() => () => controllerRef.current?.abort(), []);
  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(null);
    setResult(null);
    let parsed;
    try {
      parsed = parseGitHubPullRequestUrl(url);
    } catch {
      setError(PR_URL_ERROR);
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
      const data: unknown = await response.json();
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

  return (
    <>
      <section
        id="analyze"
        tabIndex={-1}
        aria-label="Pull request analysis"
        className="console-module workspace-card w-full min-w-0 rounded-[18px]"
      >
        <div className="console-titlebar flex items-center justify-between gap-3 rounded-t-[22px] px-5 py-3 sm:px-7">
          <p className="font-mono text-[10px] tracking-widest text-slate-300">
            RELEASE REVIEW / NEW
          </p>
          <span className="text-sm text-emerald-200" aria-hidden="true">
            ↗︎
          </span>
        </div>
        <div className="p-5 sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <h2 className="text-xl font-medium tracking-[-0.025em] text-slate-100 sm:text-2xl">
              What are you shipping?
            </h2>
            <span
              aria-hidden="true"
              className="console-heading-arrow text-xl text-emerald-200"
            >
              ↗︎
            </span>
          </div>
          <form onSubmit={analyze} aria-busy={loading}>
            <label
              htmlFor="pr-url"
              className="mb-3 block text-xs text-slate-300"
            >
              Public GitHub pull request URL
            </label>
            <div className="flex flex-col gap-3">
              <input
                id="pr-url"
                type="url"
                name="url"
                autoComplete="off"
                spellCheck={false}
                required
                maxLength={512}
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={error ? "analysis-error" : "privacy-note"}
                placeholder="https://github.com/owner/repo/pull/123"
                className="console-input min-w-0 flex-1 rounded-xl px-4 py-4 font-mono text-xs text-slate-100 placeholder:text-slate-400 disabled:opacity-60 sm:text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="primary-action flex min-w-36 items-center justify-between gap-2 rounded-xl px-5 py-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
              >
                {loading ? (
                  <span className="inline-flex w-full items-center justify-center gap-2">
                    <svg
                      aria-hidden="true"
                      className="size-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity=".25"
                      />
                      <path
                        d="M12 3a9 9 0 0 1 9 9"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                    </svg>
                    Analyzing…
                  </span>
                ) : (
                  <>
                    Analyze PR{" "}
                    <span aria-hidden="true" className="text-lg leading-5">
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
            <p
              id="privacy-note"
              className="mt-4 text-xs leading-5 text-slate-400"
            >
              Public PR contents are sent to Claude to produce your review. We
              do not store submitted PR contents.{" "}
              <Link
                href="/privacy"
                className="text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-white"
              >
                Privacy details
              </Link>
            </p>
          </form>
          <noscript>
            <p className="mt-4 text-sm text-amber-200">
              Enable JavaScript to submit a pull request for analysis. Company
              information, feedback and evidence links are available without
              JavaScript.
            </p>
          </noscript>
          {error && (
            <div
              id="analysis-error"
              role="alert"
              className="mt-5 rounded-xl border border-rose-300/25 bg-rose-300/5 p-4"
            >
              <p className="text-sm font-medium text-rose-200">
                Review could not be completed
              </p>
              <p className="mt-1 text-sm leading-6 text-rose-100/80">{error}</p>
            </div>
          )}
          {loading && (
            <div
              role="status"
              aria-live="polite"
              className="console-status mt-5 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4"
            >
              <p className="text-sm text-emerald-100">
                Retrieving GitHub changes and preparing your Claude review.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                This may take up to two minutes. Keep this page open.{" "}
                <span aria-hidden="true">{elapsed}s elapsed.</span>
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t border-white/8 px-5 py-3 font-mono text-[8px] tracking-wide text-slate-400 sm:px-7">
          <span>BOUNDED CONTEXT</span>
          <span>SCHEMA-VALIDATED OUTPUT</span>
        </div>
      </section>
      {result && (
        <div
          ref={resultRef}
          tabIndex={-1}
          aria-label="Completed release review"
          className="completed-report min-w-0 rounded-2xl"
        >
          <ReviewReport result={result} />
        </div>
      )}
    </>
  );
}
