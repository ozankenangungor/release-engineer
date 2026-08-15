import "server-only";
import { randomUUID } from "node:crypto";

const errorCodes = new Set([
  "PR_NOT_FOUND",
  "PUBLIC_ONLY",
  "PR_TOO_LARGE",
  "PR_MOVED",
  "GITHUB_RATE_LIMIT",
  "GITHUB_UNAVAILABLE",
  "GITHUB_RESPONSE",
  "GITHUB_CONFIGURATION",
  "ANALYSIS_TIMEOUT",
  "PR_CHANGED",
  "CLAUDE_RATE_LIMIT",
  "CLAUDE_UNAVAILABLE",
  "CLAUDE_CONFIGURATION",
  "INVALID_REVIEW",
  "ANALYSIS_FAILED",
  "REQUEST_ABORTED",
]);
type Metrics = {
  changedFileCount: number;
  includedFileCount: number;
  partialContext: boolean;
};

function count(value: number): number {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(1_000_000, Math.floor(value)))
    : 0;
}

// One random ID per analysis attempt, never a browser/session/person identifier.
// Explicit field construction prevents PR context, provider errors or headers
// from accidentally reaching logs. Logs are operational records, not user counts.
export function startUsageRecord() {
  const analysisId = randomUUID();
  const startedAt = performance.now();
  const environment = ["production", "preview", "development"].includes(
    process.env.VERCEL_ENV ?? "",
  )
    ? process.env.VERCEL_ENV!
    : "local";
  const revision = process.env.VERCEL_GIT_COMMIT_SHA;
  const productCommit =
    revision && /^[a-f0-9]{40}$/.test(revision) ? revision : undefined;
  let finished = false;

  function emit(event: string, details: Record<string, unknown> = {}) {
    if (process.env.NODE_ENV === "test") return;
    try {
      console.info(
        JSON.stringify({
          namespace: "release_engineer_usage",
          schemaVersion: 1,
          event,
          timestamp: new Date().toISOString(),
          analysisId,
          environment,
          ...(productCommit ? { productCommit } : {}),
          ...details,
        }),
      );
    } catch {
      // Evidence collection must not change a report or its availability.
    }
  }
  emit("analysis_started");
  return {
    succeeded(metrics: Metrics) {
      if (finished) return;
      finished = true;
      emit("analysis_succeeded", {
        durationMs: count(performance.now() - startedAt),
        changedFileCount: count(metrics.changedFileCount),
        includedFileCount: count(metrics.includedFileCount),
        partialContext: metrics.partialContext === true,
      });
    },
    failed(code: string) {
      if (finished) return;
      finished = true;
      emit("analysis_failed", {
        durationMs: count(performance.now() - startedAt),
        errorCode: errorCodes.has(code) ? code : "ANALYSIS_FAILED",
      });
    },
  };
}
