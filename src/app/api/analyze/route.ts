import { NextResponse } from "next/server";
import { z } from "zod";
import { parseGitHubPullRequestUrl, PR_URL_ERROR } from "@/lib/github-url";
import { getPullRequest } from "@/lib/github";
import { buildReviewContext } from "@/lib/context";
import { reviewPullRequest } from "@/lib/claude";
import { getClaudeConfig } from "@/lib/config";
import { AnalysisError } from "@/lib/errors";
import { analysisResponseSchema } from "@/lib/review-schema";
import { startUsageRecord } from "@/lib/live-usage";

export const runtime = "nodejs";
export const maxDuration = 120;
const requestSchema = z.strictObject({ url: z.string().min(1).max(512) });
const responseHeaders = { "Cache-Control": "no-store" };

function failure(code: string, message: string, status: number) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: responseHeaders },
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
  let usage: ReturnType<typeof startUsageRecord> | undefined;
  try {
    const input = requestSchema.safeParse(await readInput(request));
    if (!input.success) return failure("INVALID_URL", PR_URL_ERROR, 400);
    let reference;
    try {
      reference = parseGitHubPullRequestUrl(input.data.url);
    } catch {
      return failure("INVALID_URL", PR_URL_ERROR, 400);
    }
    getClaudeConfig();
    usage = startUsageRecord();
    const signal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(115_000),
    ]);
    const pr = await getPullRequest(reference, signal);
    const context = buildReviewContext(pr);
    const review = await reviewPullRequest(context, signal);
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
    const response = NextResponse.json(result, { headers: responseHeaders });
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
  }
}
