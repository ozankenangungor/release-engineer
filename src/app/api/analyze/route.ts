import { NextResponse } from "next/server";
import { z } from "zod";
import { parseGitHubPullRequestUrl, PR_URL_ERROR } from "@/lib/github-url";
import { getPullRequest } from "@/lib/github";
import { buildReviewContext } from "@/lib/context";
import { reviewPullRequest } from "@/lib/claude";
import { getClaudeConfig } from "@/lib/config";
import { AnalysisError } from "@/lib/errors";
import { analysisResponseSchema } from "@/lib/review-schema";
import {
  acquireAnalysisSlot,
  assertBrowserOrigin,
} from "@/lib/analysis-admission";
import { startUsageRecord } from "@/lib/live-usage";
import { accountIdentity } from "@/lib/account-auth";
import { reserveAccountReview, finishAccountReview } from "@/lib/accounts";
import { reserveInference, finishInference } from "@/lib/inference-measurement";
import type { ReviewMetadata } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 120;
const requestSchema = z.strictObject({ url: z.string().min(1).max(512) });
const responseHeaders = { "Cache-Control": "no-store" };

function failure(code: string, message: string, status: number) {
  return NextResponse.json(
    { error: { code, message } },
    {
      status,
      headers:
        code === "SERVICE_BUSY"
          ? { ...responseHeaders, "Retry-After": "60" }
          : responseHeaders,
    },
  );
}

async function readInput(request: Request): Promise<unknown> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    throw new AnalysisError("INVALID_REQUEST", "Send the PR URL as JSON.", 415);
  }
  // Bound the actual body, even when Content-Length is missing or inaccurate.
  const reader = request.body?.getReader();
  if (!reader) throw new AnalysisError("INVALID_REQUEST", PR_URL_ERROR, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2_048) {
        await reader.cancel();
        throw new AnalysisError(
          "INVALID_REQUEST",
          "The request is too large. Submit only the GitHub PR URL.",
          413,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    throw new AnalysisError(
      "INVALID_REQUEST",
      "The request could not be read. Submit a valid GitHub PR URL.",
      400,
    );
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  let releaseSlot: (() => void) | undefined;
  let usage: ReturnType<typeof startUsageRecord> | undefined;
  let reservation: Awaited<ReturnType<typeof reserveAccountReview>> | undefined;
  let recorded = false;
  let inference: Awaited<ReturnType<typeof reserveInference>> | null = null;
  let modelMetadata: ReviewMetadata | null = null;
  let inferenceRecorded = false;
  let partialContext = false;
  try {
    assertBrowserOrigin(request);
    const input = requestSchema.safeParse(await readInput(request));
    if (!input.success) return failure("INVALID_URL", PR_URL_ERROR, 400);
    let reference;
    try {
      reference = parseGitHubPullRequestUrl(input.data.url);
    } catch {
      return failure("INVALID_URL", PR_URL_ERROR, 400);
    }
    getClaudeConfig();
    releaseSlot = acquireAnalysisSlot();
    const userId = await accountIdentity();
    if (userId) reservation = await reserveAccountReview(userId);
    usage = startUsageRecord();
    const signal = AbortSignal.any([
      request.signal,
      // Leave 25 seconds inside the 120s deadline for durable completion or rollback.
      reservation
        ? AbortSignal.timeout(Math.max(1, 95_000 - (Date.now() - startedAt)))
        : AbortSignal.timeout(115_000),
    ]);
    signal.throwIfAborted();
    const pr = await getPullRequest(reference, signal);
    const context = buildReviewContext(pr);
    partialContext = context.coverage.partial;
    signal.throwIfAborted();
    inference = await reserveInference(userId, new TextEncoder().encode(context.json).byteLength);
    signal.throwIfAborted();
    const review = await reviewPullRequest(context, signal, (metadata) => { modelMetadata = metadata; });
    const pullRequest = {
      url: pr.url,
      owner: pr.owner,
      repository: pr.repository,
      number: pr.number,
      title: pr.title,
      baseBranch: pr.baseBranch,
      headBranch: pr.headBranch,
      headSha: pr.headSha,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFileCount: pr.changedFileCount,
    };
    const result = analysisResponseSchema.parse({
      review,
      pullRequest,
      coverage: context.coverage,
      warnings: context.warnings,
    });
    signal.throwIfAborted();
    if (reservation) {
      await finishAccountReview(reservation, true);
      signal.throwIfAborted();
    }
    await finishInference(inference, true, modelMetadata, Date.now() - startedAt, partialContext);
    inferenceRecorded = true;
    signal.throwIfAborted();
    recorded = true;
    const response = NextResponse.json(result, { headers: { ...responseHeaders, "X-Review-Record": inference.id } });
    usage.succeeded({
      changedFileCount: pr.changedFileCount,
      includedFileCount: context.coverage.includedFiles,
      partialContext: context.coverage.partial,
    });
    return response;
  } catch (error) {
    usage?.failed(
      request.signal.aborted
        ? "REQUEST_ABORTED"
        : error instanceof AnalysisError
          ? error.code
          : "ANALYSIS_FAILED",
    );
    if (error instanceof AnalysisError)
      return failure(error.code, error.message, error.status);
    // Never include provider responses, submitted content or credentials in errors/logs.
    return failure(
      "ANALYSIS_FAILED",
      "The review could not be completed. Please try again with a smaller PR.",
      502,
    );
  } finally {
    if (reservation && !recorded) {
      // A crashed invocation's reservation expires after three minutes.
      try {
        await finishAccountReview(reservation, false);
      } catch {
        /* fail closed until expiry */
      }
    }
    if (inference && !inferenceRecorded) {
      try { await finishInference(inference, false, modelMetadata, Date.now() - startedAt, partialContext); }
      catch { /* Keep the conservative reservation charged after an uncertain outcome. */ }
    }
    releaseSlot?.();
  }
}
