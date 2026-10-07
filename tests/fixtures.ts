import type { PullRequest, ChangedFile } from "@/lib/github";
import type { Review } from "@/lib/review-schema";

export function file(
  filename = "src/app.ts",
  patch = "@@ -1 +1 @@\n-old\n+new",
): ChangedFile {
  return { filename, patch, status: "modified", additions: 1, deletions: 1 };
}

export function pullRequest(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    owner: "octocat",
    repository: "hello-world",
    number: 1,
    url: "https://github.com/octocat/hello-world/pull/1",
    title: "Update application",
    body: "Improve the application",
    baseBranch: "main",
    headBranch: "improve-app",
    headSha: "a".repeat(40),
    additions: 1,
    deletions: 1,
    changedFileCount: 1,
    files: [file()],
    filesTruncated: false,
    ...overrides,
  };
}

export function review(overrides: Partial<Review> = {}): Review {
  return {
    overallRisk: "low",
    verdict: "merge",
    summary: "No issue detected in the supplied context.",
    findings: [],
    testingGaps: [],
    breakingChanges: [],
    recommendedActions: [],
    limitations: [],
    ...overrides,
  };
}

export function githubMetadata(changedFiles = 1) {
  return {
    title: "Update application",
    body: "Improve the application",
    base: { ref: "main", sha: "b".repeat(40), repo: { private: false } },
    head: { ref: "improve-app", sha: "a".repeat(40) },
    additions: changedFiles,
    deletions: changedFiles,
    changed_files: changedFiles,
  };
}
