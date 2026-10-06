import "server-only";
import { AnalysisError } from "./errors";

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5-5";

export function getClaudeConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey)
    throw new AnalysisError(
      "SERVICE_NOT_CONFIGURED",
      "Analysis is not configured yet. The site operator must set ANTHROPIC_API_KEY on the server.",
      503,
    );
  return {
    apiKey,
    model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL,
  };
}
