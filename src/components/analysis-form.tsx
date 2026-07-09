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
      requestAnimationFrame(() => resultRef.current?.focus());
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
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#111a20] p-5 shadow-[0_24px_80px_#00000030] sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium text-slate-100">
            What are you shipping?
          </h2>
          <span className="font-mono text-[10px] text-slate-400">
            PR → RELEASE REVIEW
          </span>
        </div>
        <form onSubmit={analyze} aria-busy={loading}>
          <label htmlFor="pr-url" className="mb-2 block text-xs text-slate-400">
            Public GitHub pull request URL
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
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
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#0b1217] px-4 py-3.5 font-mono text-xs text-slate-100 placeholder:text-slate-500 disabled:opacity-60 sm:text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex min-w-36 items-center justify-center gap-2 rounded-lg bg-emerald-200 px-5 py-3.5 text-sm font-semibold text-[#10251e] transition hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? (
                <>
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
                </>
              ) : (
                <>
                  Analyze PR <span aria-hidden="true">↗</span>
                </>
              )}
            </button>
          </div>
          <p
            id="privacy-note"
            className="mt-4 text-xs leading-5 text-slate-400"
          >
            Public PR contents are sent to Claude to produce your review. We do
            not store submitted PR contents.{" "}
            <Link
              href="/privacy"
              className="text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-white"
            >
              Privacy details
            </Link>
          </p>
        </form>
        {error && (
          <div
            id="analysis-error"
            role="alert"
            className="mt-5 rounded-lg border border-rose-300/20 bg-rose-300/5 p-4"
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
            className="mt-5 rounded-lg border border-emerald-300/10 bg-emerald-300/5 p-4"
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
      {result && (
        <div
          ref={resultRef}
          tabIndex={-1}
          aria-label="Completed release review"
          className="mt-12 rounded-2xl"
        >
          <ReviewReport result={result} />
        </div>
      )}
    </>
  );
}
