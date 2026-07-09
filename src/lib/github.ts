import "server-only";
import { z } from "zod";
import { AnalysisError } from "./errors";
import type { PullRequestReference } from "./github-url";

export const MAX_GITHUB_FILES = 500;
const MAX_RESPONSE_BYTES = 4_000_000;
const count = z.number().int().nonnegative();
const branchSchema = z.object({
  ref: z.string().max(1024),
  sha: z.string().max(64),
});
const metadataSchema = z.object({
  title: z.string().max(1024),
  body: z.string().nullable(),
  base: branchSchema.extend({ repo: z.object({ private: z.boolean() }) }),
  head: branchSchema,
  additions: count,
  deletions: count,
  changed_files: count,
});
export const changedFileSchema = z.object({
  filename: z.string().max(4096),
  previous_filename: z.string().max(4096).optional(),
  status: z.string().max(32),
  additions: count,
  deletions: count,
  patch: z.string().optional(),
});
export type ChangedFile = z.infer<typeof changedFileSchema>;
export type PullRequest = PullRequestReference & {
  title: string;
  body: string;
  baseBranch: string;
  headBranch: string;
  headSha: string;
  additions: number;
  deletions: number;
  changedFileCount: number;
  files: ChangedFile[];
  filesTruncated: boolean;
};

async function readBoundedJson(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader)
    throw new AnalysisError(
      "GITHUB_RESPONSE",
      "GitHub returned an empty response. Please try again.",
    );
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new AnalysisError(
          "PR_TOO_LARGE",
          "This PR is too large to retrieve safely. Try a smaller pull request.",
          413,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    throw new AnalysisError(
      "GITHUB_RESPONSE",
      "GitHub returned an unreadable response. Please try again.",
    );
  }
}

export async function getPullRequest(
  reference: PullRequestReference,
  signal?: AbortSignal,
): Promise<PullRequest> {
  const requestSignal = AbortSignal.any([
    AbortSignal.timeout(30_000),
    ...(signal ? [signal] : []),
  ]);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Release-Engineer",
  };
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.repository)}/pulls/${reference.number}`;

  async function request(url: string) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers,
        signal: requestSignal,
        cache: "no-store",
        redirect: "manual",
      });
    } catch {
      throw new AnalysisError(
        "GITHUB_UNAVAILABLE",
        "GitHub could not be reached in time. Please try again.",
        504,
      );
    }
    if (response.status === 404)
      throw new AnalysisError(
        "PR_NOT_FOUND",
        "That public pull request could not be found. Check the URL and repository visibility.",
        404,
      );
    if (response.status === 403 || response.status === 429)
      throw new AnalysisError(
        "GITHUB_RATE_LIMIT",
        "GitHub is limiting requests. Try again later; the site operator can configure GITHUB_TOKEN for higher limits.",
        429,
      );
    if (response.status === 401)
      throw new AnalysisError(
        "GITHUB_CONFIGURATION",
        "The server’s GitHub token is invalid. The site operator must update or remove it.",
        503,
      );
    if (response.status >= 300 && response.status < 400)
      throw new AnalysisError(
        "PR_MOVED",
        "This repository may have moved. Paste the current GitHub pull request URL.",
        400,
      );
    if (!response.ok)
      throw new AnalysisError(
        "GITHUB_UNAVAILABLE",
        "GitHub is temporarily unavailable. Please try again.",
      );
    return readBoundedJson(response);
  }

  const parsed = metadataSchema.safeParse(await request(endpoint));
  if (!parsed.success)
    throw new AnalysisError(
      "GITHUB_RESPONSE",
      "GitHub returned unexpected PR details. Please try again.",
    );
  const metadata = parsed.data;
  // A server token may have private access; it must never widen the MVP's scope.
  if (metadata.base.repo.private)
    throw new AnalysisError(
      "PUBLIC_ONLY",
      "Only public GitHub repositories are supported.",
      400,
    );
  const files: ChangedFile[] = [];
  for (
    let page = 1;
    files.length < Math.min(metadata.changed_files, MAX_GITHUB_FILES);
    page++
  ) {
    const result = z
      .array(changedFileSchema)
      .max(100)
      .safeParse(await request(`${endpoint}/files?per_page=100&page=${page}`));
    if (!result.success)
      throw new AnalysisError(
        "GITHUB_RESPONSE",
        "GitHub returned unexpected changed-file data. Please try again.",
      );
    files.push(...result.data);
    if (result.data.length < 100) break;
  }
  const latest = metadataSchema.safeParse(await request(endpoint));
  if (!latest.success)
    throw new AnalysisError(
      "GITHUB_RESPONSE",
      "GitHub returned unexpected PR details. Please try again.",
    );
  if (latest.data.base.repo.private)
    throw new AnalysisError(
      "PUBLIC_ONLY",
      "Only public GitHub repositories are supported.",
      400,
    );
  if (
    latest.data.head.sha !== metadata.head.sha ||
    latest.data.base.sha !== metadata.base.sha ||
    latest.data.changed_files !== metadata.changed_files
  ) {
    throw new AnalysisError(
      "PR_CHANGED",
      "This PR changed while its files were being retrieved. Analyze it again to review the current changes.",
      409,
    );
  }
  return {
    ...reference,
    title: metadata.title,
    body: metadata.body ?? "",
    baseBranch: metadata.base.ref,
    headBranch: metadata.head.ref,
    headSha: metadata.head.sha,
    additions: metadata.additions,
    deletions: metadata.deletions,
    changedFileCount: metadata.changed_files,
    files,
    filesTruncated: files.length < metadata.changed_files,
  };
}
