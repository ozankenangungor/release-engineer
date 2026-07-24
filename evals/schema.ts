import { z } from "zod";
import { reviewSchema, severitySchema } from "../src/lib/review-schema";
import { changedFileSchema } from "../src/lib/github";
import { CONTEXT_LIMITS } from "../src/lib/context";

const text = z.string().trim().min(1).max(4_096);
const id = z.string().regex(/^[a-z][a-z0-9-]{2,79}$/);
export const categorySchema = reviewSchema.shape.findings.element.shape.category;
export const severityRank = { low: 0, medium: 1, high: 2, critical: 3 } as const;
export const severityBoundsSchema = z.strictObject({
  min: severitySchema,
  max: severitySchema,
}).refine(value => severityRank[value.min] <= severityRank[value.max], {
  message: "Severity bounds are reversed",
});

export const conceptRuleSchema = z.strictObject({
  allOf: z.array(z.array(text).min(1).max(12)).min(1).max(8),
  noneOf: z.array(text).max(12).default([]),
});
export type ConceptRule = z.infer<typeof conceptRuleSchema>;

const evidenceSchema = z.strictObject({
  path: text,
  anchors: z.array(text).min(1).max(8),
});
const riskSchema = z.strictObject({
  id,
  description: text,
  categories: z.array(categorySchema).min(1).max(8),
  severity: severityBoundsSchema,
  concepts: conceptRuleSchema,
  evidence: z.array(evidenceSchema).min(1).max(4),
  requireAllEvidence: z.boolean().default(false),
  criticalIfMissed: z.boolean().default(false),
});
export const noteSchema = z.strictObject({
  id,
  description: text,
  section: z.enum(["testingGaps", "breakingChanges", "limitations", "uncertainty"]),
  concepts: conceptRuleSchema,
});

export const tagsSchema = z.enum([
  "safe", "correctness", "security", "breaking-change", "testing",
  "dependency", "configuration", "operations", "ambiguous", "partial",
  "injection", "false-positive-trap", "cross-file", "grounding",
]);
export const coverageExpectationSchema = z.strictObject({
  partial: z.boolean(),
  includedFiles: z.number().int().nonnegative().optional(),
  truncatedPatches: z.number().int().nonnegative().optional(),
  missingPatches: z.number().int().nonnegative().optional(),
  descriptionTruncated: z.boolean().optional(),
  filesNotRetrieved: z.boolean().optional(),
});

export const evaluationCaseSchema = z.strictObject({
  id,
  name: text,
  purpose: text,
  tags: z.array(tagsSchema).min(1).max(14),
  pullRequest: z.strictObject({
    title: z.string().min(1).max(1_024),
    description: z.string().max(20_000),
    files: z.array(changedFileSchema.strict()).min(1).max(20),
    changedFileCount: z.number().int().positive().max(3_000).optional(),
    filesTruncated: z.boolean().default(false),
  }),
  limits: z.strictObject({
    maxBytes: z.number().int().min(8_000).max(CONTEXT_LIMITS.maxBytes).optional(),
    maxFiles: z.number().int().min(1).max(CONTEXT_LIMITS.maxFiles).optional(),
    maxPatchBytes: z.number().int().min(0).max(CONTEXT_LIMITS.maxPatchBytes).optional(),
    maxDescriptionBytes: z.number().int().min(0).max(CONTEXT_LIMITS.maxDescriptionBytes).optional(),
  }).optional(),
  expected: z.strictObject({
    acceptableVerdicts: z.array(reviewSchema.shape.verdict).min(1).max(3),
    overallRisk: severityBoundsSchema,
    requiredRisks: z.array(riskSchema).max(8),
    requiredNotes: z.array(noteSchema).max(8).default([]),
    forbiddenClaims: z.array(z.strictObject({
      id,
      description: text,
      concepts: conceptRuleSchema,
      critical: z.boolean().default(true),
    })).max(8).default([]),
    safe: z.boolean().default(false),
    maxMaterialFindings: z.number().int().nonnegative().max(20).optional(),
    coverage: coverageExpectationSchema,
  }),
  attack: z.strictObject({
    location: z.enum(["title", "description", "filename", "comment", "string", "documentation"]),
    marker: z.string().regex(/^EVAL_ATTACK_[A-Z0-9_]+$/),
  }).optional(),
}).superRefine((value, ctx) => {
  const unique = (values: string[], path: (string | number)[]) => {
    if (new Set(values).size !== values.length)
      ctx.addIssue({ code: "custom", message: "Duplicate values", path });
  };
  unique(value.tags, ["tags"]);
  unique(value.pullRequest.files.map(file => file.filename), ["pullRequest", "files"]);
  unique(value.expected.acceptableVerdicts, ["expected", "acceptableVerdicts"]);
  unique(value.expected.requiredRisks.map(risk => risk.id), ["expected", "requiredRisks"]);
  unique(value.expected.requiredNotes.map(note => note.id), ["expected", "requiredNotes"]);
  if (value.expected.safe && (value.expected.requiredRisks.length || value.expected.maxMaterialFindings !== 0))
    ctx.addIssue({ code: "custom", message: "Safe negative controls need zero required risks and maxMaterialFindings: 0" });
  if (value.expected.coverage.partial && value.expected.acceptableVerdicts.includes("merge"))
    ctx.addIssue({ code: "custom", message: "Partial cases cannot accept merge" });
  if (!!value.attack !== value.tags.includes("injection"))
    ctx.addIssue({ code: "custom", message: "Injection tag and attack must agree" });
  if (value.attack && !value.expected.requiredRisks.length)
    ctx.addIssue({ code: "custom", message: "Adversarial cases need a substantive risk to review" });
});
export type EvaluationCase = z.infer<typeof evaluationCaseSchema>;
export type RequiredRisk = EvaluationCase["expected"]["requiredRisks"][number];

export const datasetSchema = z.strictObject({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  provenance: z.literal("Original synthetic fixtures; no third-party source copied."),
  cases: z.array(evaluationCaseSchema).min(1).max(100),
}).refine(value => new Set(value.cases.map(test => test.id)).size === value.cases.length, {
  message: "Duplicate case IDs",
});
