import "server-only";
import { randomUUID } from "node:crypto";
import { accountDatabase } from "./accounts";
import { getClaudeConfig } from "./config";
import { RELEASE_REVIEW_SYSTEM_PROMPT } from "./prompt";
import { AnalysisError } from "./errors";
import type { ReviewMetadata } from "./claude";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { reviewSchema } from "./review-schema";

const schemaBytes = new TextEncoder().encode(JSON.stringify(zodOutputFormat(reviewSchema))).byteLength;

export function tokenCost(metadata: ReviewMetadata): number | null {
  if (metadata.servedModel !== "claude-sonnet-5-5") return null;
  const u = metadata.usage;
  const values = [u.inputTokens, u.outputTokens, u.cacheCreationInputTokens, u.cacheReadInputTokens];
  if (values.some((v) => v === null || !Number.isSafeInteger(v) || v < 0 || v > 2_000_000)) return null;
  // USD micro-units; standard Sonnet 5.5 tariff, 5-minute cache writes. An estimate, not an invoice.
  return Math.ceil((u.inputTokens! * 20 + u.outputTokens! * 100 + u.cacheCreationInputTokens! * 25 + u.cacheReadInputTokens!) / 10);
}
export async function reserveInference(userId: string | null, contextBytes: number) {
  const model = getClaudeConfig().model;
  if (model !== "claude-sonnet-5-5")
    throw new AnalysisError("MODEL_BUDGET_CONFIGURATION", "The operator must configure a measured tariff for this model before reviews can resume.", 503);
  const scope = process.env.VERCEL_ENV === "production" ? "production" : process.env.VERCEL_ENV === "preview" ? "preview" : "development";
  const configured = process.env.ANALYSIS_DAILY_BUDGET_USD ?? "5";
  if (!/^\d+(?:\.\d{1,2})?$/.test(configured) || Number(configured) <= 0 || Number(configured) > 1000)
    throw new AnalysisError("BUDGET_CONFIGURATION", "The review budget is not configured correctly.", 503);
  const id = randomUUID();
  const maxInput = contextBytes + new TextEncoder().encode(RELEASE_REVIEW_SYSTEM_PROMPT).byteLength + schemaBytes + 4096;
  const reserved = maxInput * 2 + 6000 * 10;
  const commit = process.env.VERCEL_GIT_COMMIT_SHA;
  const sql = accountDatabase();
  const rows = await sql`SELECT release_engineer.reserve_inference(${id}::uuid,${scope},${userId},${model},${commit && /^[a-f0-9]{40}$/.test(commit) ? commit : null},${reserved},${Math.floor(Number(configured)*1_000_000)}) AS admitted`;
  if (rows[0]?.admitted !== true)
    throw new AnalysisError("REVIEW_CAPACITY", "Today’s review capacity is reached. Please try again after 00:00 UTC. Existing reports and comparison remain available.", 429);
  return { id, reserved };
}
export async function finishInference(reservation: { id: string; reserved: number }, success: boolean, metadata: ReviewMetadata | null, durationMs: number, partial: boolean) {
  const cost = metadata ? tokenCost(metadata) : null;
  const u = metadata?.usage;
  const bounded = (v: number | null | undefined) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= 2_000_000 ? v : null;
  const sql = accountDatabase();
  await sql`UPDATE release_engineer.inference_usage SET status=${success ? "succeeded" : "failed"},
    cost_micros=${cost ?? reservation.reserved},cost_known=${cost !== null},input_tokens=${bounded(u?.inputTokens)},
    output_tokens=${bounded(u?.outputTokens)},cache_write_tokens=${bounded(u?.cacheCreationInputTokens)},cache_read_tokens=${bounded(u?.cacheReadInputTokens)},
    duration_ms=${Math.min(1_000_000,Math.max(0,Math.floor(durationMs)))},partial_context=${partial}
    WHERE id=${reservation.id}::uuid AND status='reserved'`;
}
