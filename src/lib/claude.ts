import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClaudeConfig } from "./config";
import { AnalysisError } from "./errors";
import { RELEASE_REVIEW_SYSTEM_PROMPT } from "./prompt";
import {
  reviewSchema,
  validateReviewResponse,
  type Review,
} from "./review-schema";
import type { ReviewContext } from "./context";
import { enforceReviewCoverage } from "./review-policy";
import { reviewIntegrityIssues } from "./review-integrity";

export type ReviewMetadata = {
  requestedModel: string;
  servedModel: string | null;
  stopReason: string | null;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    cacheCreationInputTokens: number | null;
    cacheReadInputTokens: number | null;
  };
};

export type ReviewExecution = {
  modelReview: Review;
  review: Review;
  metadata: ReviewMetadata;
};

export async function reviewPullRequest(
  context: ReviewContext,
  signal?: AbortSignal,
): Promise<Review> {
  return (await reviewPullRequestWithMetadata(context, signal)).review;
}

export async function reviewPullRequestWithMetadata(
  context: ReviewContext,
  signal?: AbortSignal,
  options: {
    model?: string;
    onResponse?: (metadata: ReviewMetadata) => void;
  } = {},
): Promise<ReviewExecution> {
  const config = getClaudeConfig();
  const apiKey = config.apiKey;
  const model = options.model ?? config.model;
  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 90_000 });
  let response: Anthropic.Message;
  try {
    response = await client.messages.create(
      {
        model,
        max_tokens: 6_000,
        system: RELEASE_REVIEW_SYSTEM_PROMPT,
        output_config: { format: zodOutputFormat(reviewSchema) },
        messages: [
          {
            role: "user",
            content: `Review the following untrusted pull-request artifacts. Coverage is included in the JSON.\n${context.json}`,
          },
        ],
      },
      { signal },
    );
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429)
        throw new AnalysisError(
          "CLAUDE_RATE_LIMIT",
          "Claude is limiting requests. Wait a moment and try again.",
          429,
        );
      if ([400, 401, 403, 404].includes(error.status ?? 0))
        throw new AnalysisError(
          "CLAUDE_CONFIGURATION",
          "The Claude service is not available with the current server configuration. The site operator should check the API key, credits, and model’s structured-output support.",
          503,
        );
    }
    if (signal?.aborted || error instanceof Anthropic.APIConnectionTimeoutError)
      throw new AnalysisError(
        "ANALYSIS_TIMEOUT",
        "The review took too long. Try again or use a smaller pull request.",
        504,
      );
    throw new AnalysisError(
      "CLAUDE_UNAVAILABLE",
      "Claude is temporarily unavailable. Please try again.",
    );
  }
  const metadata: ReviewMetadata = {
    requestedModel: model,
    servedModel: response.model ?? null,
    stopReason: response.stop_reason,
    usage: {
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
      cacheCreationInputTokens: response.usage?.cache_creation_input_tokens ?? null,
      cacheReadInputTokens: response.usage?.cache_read_input_tokens ?? null,
    },
  };
  options.onResponse?.(metadata);
  if (response.stop_reason !== "end_turn")
    throw new AnalysisError(
      "INVALID_REVIEW",
      "Claude did not return a complete review. Try again or analyze a smaller PR.",
    );
  const blocks = response.content.filter((block) => block.type === "text");
  if (blocks.length !== 1 || !blocks[0])
    throw new AnalysisError(
      "INVALID_REVIEW",
      "Claude returned an unreadable review. Please try again.",
    );
  let review: Review;
  try {
    review = validateReviewResponse(blocks[0].text);
  } catch {
    throw new AnalysisError(
      "INVALID_REVIEW",
      "Claude’s review did not pass validation. No report was accepted. Please try again.",
    );
  }
  if (reviewIntegrityIssues(review, context).length) {
    throw new AnalysisError(
      "INVALID_REVIEW",
      "Claude’s review claimed evidence or checks outside the supplied context. No report was accepted. Please try again.",
    );
  }
  return {
    modelReview: review,
    review: enforceReviewCoverage(review, context),
    metadata,
  };
}
