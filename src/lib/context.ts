import type { ChangedFile, PullRequest } from "./github";

export const CONTEXT_LIMITS = {
  maxBytes: 60_000,
  maxFiles: 40,
  maxPatchBytes: 8_000,
  maxDescriptionBytes: 6_000,
} as const;
export type ContextLimits = { [K in keyof typeof CONTEXT_LIMITS]: number };
const encoder = new TextEncoder();
export function byteLength(value: string): number {
  return encoder.encode(value).length;
}

export function truncateUtf8(value: string, maxBytes: number): string {
  if (byteLength(value) <= maxBytes) return value;
  let bytes = 0;
  let result = "";
  for (const character of value) {
    bytes += byteLength(character);
    if (bytes > maxBytes) break;
    result += character;
  }
  return result;
}

function priority(file: ChangedFile): number {
  const path = file.filename.toLowerCase();
  if (
    /(^|\/)(vendor|dist|build|generated|fixtures)\/|(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/.test(
      path,
    )
  )
    return 4;
  if (/(^|\/)(docs?|examples)\/|\.(md|txt|svg|png|jpg)$/.test(path)) return 3;
  if (/(^|\/)(__tests__|tests?)\/|\.(test|spec)\./.test(path)) return 2;
  if (
    /auth|security|migration|(^|\/)(package\.json|.*config\.[^/]+|\.github\/)/.test(
      path,
    )
  )
    return 0;
  return 1;
}

export type Coverage = {
  totalFiles: number;
  retrievedFiles: number;
  includedFiles: number;
  truncatedPatches: number;
  missingPatches: number;
  descriptionTruncated: boolean;
  filesNotRetrieved: boolean;
  partial: boolean;
};
export type ReviewContext = {
  json: string;
  coverage: Coverage;
  warnings: string[];
};

export function buildReviewContext(
  pr: PullRequest,
  limits: ContextLimits = CONTEXT_LIMITS,
): ReviewContext {
  if (
    limits.maxBytes < 8_000 ||
    limits.maxFiles < 1 ||
    limits.maxPatchBytes < 0 ||
    limits.maxDescriptionBytes < 0
  ) {
    throw new Error("Invalid context limits");
  }
  const description = truncateUtf8(pr.body, limits.maxDescriptionBytes);
  const coverage: Coverage = {
    totalFiles: pr.changedFileCount,
    retrievedFiles: pr.files.length,
    includedFiles: 0,
    truncatedPatches: 0,
    missingPatches: pr.files.filter((file) => !file.patch).length,
    descriptionTruncated: description !== pr.body,
    filesNotRetrieved: pr.filesTruncated,
    partial: false,
  };
  const payload = {
    pullRequest: {
      owner: pr.owner,
      repository: pr.repository,
      number: pr.number,
      title: pr.title,
      description,
      baseBranch: pr.baseBranch,
      headBranch: pr.headBranch,
      headSha: pr.headSha,
      additions: pr.additions,
      deletions: pr.deletions,
    },
    coverage,
    files: [] as (Omit<ChangedFile, "patch"> & {
      patch: string | null;
      patchTruncated: boolean;
    })[],
  };
  const ordered = [...pr.files].sort(
    (a, b) =>
      priority(a) - priority(b) ||
      (a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0),
  );
  for (const file of ordered) {
    if (payload.files.length >= limits.maxFiles) break;
    const patch = file.patch
      ? truncateUtf8(file.patch, limits.maxPatchBytes)
      : null;
    const entry = {
      ...file,
      patch,
      patchTruncated: !!file.patch && patch !== file.patch,
    };
    payload.files.push(entry);
    coverage.includedFiles++;
    if (entry.patchTruncated) coverage.truncatedPatches++;
    if (byteLength(JSON.stringify(payload)) > limits.maxBytes) {
      payload.files.pop();
      coverage.includedFiles--;
      if (entry.patchTruncated) coverage.truncatedPatches--;
      // Skip a file that does not fit; later, smaller files can still contribute.
    }
  }
  coverage.partial =
    coverage.filesNotRetrieved ||
    coverage.includedFiles < coverage.totalFiles ||
    coverage.truncatedPatches > 0 ||
    coverage.missingPatches > 0 ||
    coverage.descriptionTruncated;
  const json = JSON.stringify(payload);
  if (byteLength(json) > limits.maxBytes)
    throw new Error("PR metadata exceeds the context budget");
  const warnings: string[] = [];
  if (coverage.includedFiles < coverage.totalFiles)
    warnings.push(
      `Partial analysis: ${coverage.includedFiles} of ${coverage.totalFiles} changed files included. Files are prioritized by release relevance; generated files and lockfiles have lower priority.`,
    );
  if (coverage.filesNotRetrieved)
    warnings.push(
      `GitHub retrieval was limited to ${coverage.retrievedFiles} files. Additional files were not retrieved.`,
    );
  if (coverage.truncatedPatches)
    warnings.push(
      `${coverage.truncatedPatches} included file patches were shortened to fit the context budget.`,
    );
  if (coverage.missingPatches)
    warnings.push(
      `GitHub did not expose a patch for ${coverage.missingPatches} retrieved files. Their code could not be reviewed.`,
    );
  if (coverage.descriptionTruncated)
    warnings.push(
      "The PR description was shortened to fit the context budget.",
    );
  return { json, coverage, warnings };
}
