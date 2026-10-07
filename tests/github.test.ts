import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPullRequest, MAX_GITHUB_FILES } from "@/lib/github";
import { parseGitHubPullRequestUrl } from "@/lib/github-url";
import { file, githubMetadata } from "./fixtures";

const reference = parseGitHubPullRequestUrl(
  "https://github.com/octocat/hello-world/pull/1",
);
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GITHUB_TOKEN", "");
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status });

describe("GitHub retrieval", () => {
  it("paginates changed files through a short final page without a token", async () => {
    const metadata = githubMetadata(101);
    fetchMock
      .mockResolvedValueOnce(json(metadata))
      .mockResolvedValueOnce(
        json(Array.from({ length: 100 }, (_, i) => file(`src/${i}.ts`))),
      )
      .mockResolvedValueOnce(json([file("src/100.ts")]))
      .mockResolvedValueOnce(json(metadata));
    const pr = await getPullRequest(reference);
    expect(pr.files).toHaveLength(101);
    expect(pr.filesTruncated).toBe(false);
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "https://api.github.com/repos/octocat/hello-world/pulls/1/files?per_page=100&page=2",
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      cache: "no-store",
      redirect: "manual",
    });
    expect(fetchMock.mock.calls[0]?.[1]?.headers).not.toHaveProperty(
      "Authorization",
    );
  });
  it("stops pagination at the retrieval cap and marks omitted files", async () => {
    fetchMock.mockImplementation(async (url) =>
      String(url).includes("/files?")
        ? json(Array.from({ length: 100 }, (_, i) => file(`src/${i}.ts`)))
        : json(githubMetadata(700)),
    );
    const pr = await getPullRequest(reference);
    expect(pr.files).toHaveLength(MAX_GITHUB_FILES);
    expect(pr.filesTruncated).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(7);
  });
  it("rejects private repositories even with a server token", async () => {
    vi.stubEnv("GITHUB_TOKEN", "test-only-token");
    const metadata = githubMetadata();
    metadata.base.repo.private = true;
    fetchMock.mockResolvedValueOnce(json(metadata));
    await expect(getPullRequest(reference)).rejects.toMatchObject({
      code: "PUBLIC_ONLY",
      status: 400,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer test-only-token",
    });
  });
  it.each([
    [404, "PR_NOT_FOUND"],
    [403, "GITHUB_RATE_LIMIT"],
    [429, "GITHUB_RATE_LIMIT"],
    [401, "GITHUB_CONFIGURATION"],
    [500, "GITHUB_UNAVAILABLE"],
  ])("maps GitHub HTTP %s to an actionable error", async (status, code) => {
    fetchMock.mockResolvedValueOnce(json({}, Number(status)));
    await expect(getPullRequest(reference)).rejects.toMatchObject({ code });
  });
  it("rejects malformed upstream data", async () => {
    fetchMock.mockResolvedValueOnce(json({ title: "Missing metadata" }));
    await expect(getPullRequest(reference)).rejects.toMatchObject({
      code: "GITHUB_RESPONSE",
    });
  });
  it("rejects a PR that changes during pagination", async () => {
    const metadata = githubMetadata();
    fetchMock
      .mockResolvedValueOnce(json(metadata))
      .mockResolvedValueOnce(json([file()]))
      .mockResolvedValueOnce(
        json({ ...metadata, head: { ...metadata.head, sha: "c".repeat(40) } }),
      );
    await expect(getPullRequest(reference)).rejects.toMatchObject({
      code: "PR_CHANGED",
      status: 409,
    });
  });
  it("rejects a repository made private during retrieval", async () => {
    const metadata = githubMetadata();
    fetchMock
      .mockResolvedValueOnce(json(metadata))
      .mockResolvedValueOnce(json([file()]))
      .mockResolvedValueOnce(
        json({
          ...metadata,
          base: { ...metadata.base, repo: { private: true } },
        }),
      );
    await expect(getPullRequest(reference)).rejects.toMatchObject({
      code: "PUBLIC_ONLY",
      status: 400,
    });
  });
  it("bounds upstream response bytes", async () => {
    fetchMock.mockResolvedValueOnce(new Response("x".repeat(4_000_001)));
    await expect(getPullRequest(reference)).rejects.toMatchObject({
      code: "PR_TOO_LARGE",
      status: 413,
    });
  });
  it("does not follow upstream redirects", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 301,
        headers: { Location: "https://evil.com" },
      }),
    );
    await expect(getPullRequest(reference)).rejects.toMatchObject({
      code: "PR_MOVED",
      status: 400,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("shares the retrieval deadline across pages and stops on an upstream abort", async () => {
    const deadline = new AbortController();
    const abortReceived = vi.fn();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
    fetchMock.mockResolvedValueOnce(json(githubMetadata()));
    fetchMock.mockImplementationOnce((_url, options) =>
      new Promise((_, reject) => {
        options!.signal!.addEventListener("abort", () => {
          abortReceived();
          reject(new DOMException("Aborted", "AbortError"));
        }, { once: true });
        deadline.abort();
      }),
    );
    try {
      await expect(getPullRequest(reference)).rejects.toMatchObject({ code: "GITHUB_UNAVAILABLE", status: 504 });
      expect(timeout).toHaveBeenCalledWith(30_000);
      expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
      expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(fetchMock.mock.calls[1]?.[1]?.signal);
      expect(fetchMock.mock.calls[1]?.[1]?.signal?.aborted).toBe(true);
      expect(abortReceived).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      timeout.mockRestore();
    }
  });
});
