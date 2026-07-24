import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { reviewSchema } from "../src/lib/review-schema";
import { RELEASE_REVIEW_SYSTEM_PROMPT } from "../src/lib/prompt";

export const EVALUATOR_VERSION = "1.0.1";
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
export const fingerprint = (value: unknown) => createHash("sha256").update(stableJson(value)).digest("hex");

export function fingerprints(dataset: unknown, root = process.cwd()) {
  const sources = (paths: string[]) => paths.sort().map(path => ({ path, content: readFileSync(resolve(root, path), "utf8") }));
  const evaluatorFiles = readdirSync(resolve(root, "evals")).filter(name => /\.(?:ts|mjs)$/.test(name)).map(name => `evals/${name}`);
  return {
    datasetFingerprint: fingerprint(dataset),
    promptFingerprint: fingerprint(RELEASE_REVIEW_SYSTEM_PROMPT),
    schemaFingerprint: fingerprint(z.toJSONSchema(reviewSchema, { target: "draft-7" })),
    pipelineFingerprint: fingerprint(sources([
      "src/lib/claude.ts", "src/lib/config.ts", "src/lib/context.ts", "src/lib/github.ts",
      "src/lib/review-policy.ts", "src/lib/review-schema.ts", "src/lib/prompt.ts", "src/app/api/analyze/route.ts",
    ])),
    evaluatorFingerprint: fingerprint(sources(evaluatorFiles)),
  };
}
