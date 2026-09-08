import { z } from "zod";
import type { Review } from "./review-schema";
import type { ReviewContext } from "./context";

const contextEvidence = z.object({
  files: z.array(z.object({ filename: z.string(), patch: z.string().nullable() })),
});

// These bounded English checks reject explicit claims of access/execution that
// this product never performs. They are not a semantic verifier or a complete
// prompt-injection detector. The independent evaluator remains unchanged.
const executionClaims = [
  /\b(?:I|we)\s+(?:have\s+)?(?:ran|executed|run)\s+(?:the\s+)?(?:tests?|test suite|application|code)\b/gi,
  /\b(?:tests?|test suite|CI|checks?|pipeline)\s+(?:(?:all|has|have|is|are)\s+)?(?:passed|succeeded|green|failed)\b/gi,
  /\b(?:tests?|test suite)\s+(?:were|was|have been|has been)\s+(?:run|executed)\b/gi,
  /\btests?\s+(?:confirm|prove|demonstrate|verify)\b/gi,
  /\b(?:I|we)\s+(?:have\s+)?(?:reviewed|inspected|checked)\s+(?:the\s+)?(?:entire|full|whole)\s+(?:repository|codebase)\b/gi,
  /\b(?:entire|full|whole)\s+(?:repository|codebase)\s+(?:was|has been)\s+(?:reviewed|inspected|checked)\b/gi,
];

function containsExecutionClaim(text: string): boolean {
  for (const sentence of text.normalize("NFKC").split(/(?<=[.!?;])\s+|\n/u)) {
    for (const pattern of executionClaims) {
      // matchAll uses a copy of the regexp, so no shared lastIndex state leaks.
      for (const match of sentence.matchAll(pattern)) {
        const prefix = sentence.slice(Math.max(0, match.index - 100), match.index);
        const suffix = sentence.slice(match.index + match[0].length, match.index + match[0].length + 100);
        const negated = /\b(?:not|never|cannot|can't|didn't|did not|don't|do not|doesn't|does not)\s*(?:claim\s*(?:that\s*)?)?$/i.test(prefix)
          || /\b(?:no|without|missing)\s+(?:independent\s+)?(?:evidence|confirmation|proof|verification)(?:\s+(?:that|whether|of))?\s*$/i.test(prefix)
          || /\b(?:unknown|unclear)\s+(?:whether|if)\s*$/i.test(prefix)
          || /^\s+(?:nothing|neither)\b/i.test(suffix);
        const proposed = /\b(?:if|when|once|until|unless|ensure|verify|check|confirm|run|rerun|add|write|recommend|require)\b[^.!?;]{0,75}$/i.test(prefix);
        const attributed = /\b(?:claims?|states?|reports?|says?|asserts?|quotes?|untrusted text|PR description|PR body)\s*(?:that\s*)?["'“`]*\s*$/i.test(prefix)
          || /^\s*["'”`)]*\s*(?:but (?:this |that )?(?:is )?(?:unverified|not verified)|\((?:unverified|untrusted))/i.test(suffix);
        if (!negated && !proposed && !attributed) return true;
      }
    }
  }
  return false;
}

export function reviewIntegrityIssues(
  review: Review,
  context: ReviewContext,
): ("unavailable_finding_file" | "unsupported_execution_claim")[] {
  const { files } = contextEvidence.parse(JSON.parse(context.json));
  const visible = new Set(files.filter((file) => file.patch?.trim()).map((file) => file.filename));
  const issues: ReturnType<typeof reviewIntegrityIssues> = [];
  if (review.findings.some((finding) => finding.file !== null && !visible.has(finding.file)))
    issues.push("unavailable_finding_file");
  const text = [
    review.summary,
    ...review.findings.flatMap((finding) => [finding.title, finding.explanation, finding.recommendation]),
    ...review.testingGaps,
    ...review.breakingChanges,
    ...review.recommendedActions,
    ...review.limitations,
  ];
  if (text.some(containsExecutionClaim)) issues.push("unsupported_execution_claim");
  return issues;
}
