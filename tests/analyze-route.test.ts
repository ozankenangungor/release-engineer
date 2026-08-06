import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { getPullRequest } from "@/lib/github";
import { reviewPullRequest } from "@/lib/claude";
import { AnalysisError } from "@/lib/errors";
import { pullRequest, review } from "./fixtures";

vi.mock("@/lib/github", () => ({ getPullRequest: vi.fn() }));
vi.mock("@/lib/claude", () => ({ reviewPullRequest: vi.fn() }));
const githubMock = vi.mocked(getPullRequest);
const claudeMock = vi.mocked(reviewPullRequest);
beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "test-only-api-key");
  githubMock.mockReset();
  claudeMock.mockReset();
  githubMock.mockResolvedValue(pullRequest());
  claudeMock.mockResolvedValue(review());
});
afterEach(() => vi.unstubAllEnvs());

function request(body: string, contentType = "application/json") {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body,
    headers: { "Content-Type": contentType },
  });
}

describe("analysis endpoint", () => {
  it("returns only a validated report and non-sensitive metadata with no-store headers", async () => {
    const response = await POST(
      request(JSON.stringify({ url: pullRequest().url })),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.review.summary).toBe(review().summary);
    expect(body.pullRequest).not.toHaveProperty("body");
    expect(body.pullRequest).not.toHaveProperty("files");
    expect(JSON.stringify(body)).not.toContain("test-only-api-key");
  });
  it.each([
    [
      JSON.stringify({ url: "https://evil.com/anything" }),
      "application/json",
      400,
    ],
    [
      JSON.stringify({ url: pullRequest().url, extra: true }),
      "application/json",
      400,
    ],
    ["not JSON", "application/json", 400],
    ["x".repeat(2_049), "application/json", 413],
    [JSON.stringify({ url: pullRequest().url }), "text/plain", 415],
  ])(
    "rejects invalid requests before calling upstream services",
    async (body, contentType, status) => {
      expect((await POST(request(body, contentType))).status).toBe(status);
      expect(githubMock).not.toHaveBeenCalled();
      expect(claudeMock).not.toHaveBeenCalled();
    },
  );
  it("gives an actionable configuration error", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const response = await POST(
      request(JSON.stringify({ url: pullRequest().url })),
    );
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("SERVICE_NOT_CONFIGURED");
    expect(githubMock).not.toHaveBeenCalled();
  });
  it.each([undefined, "1"])("bounds chunked input with Content-Length %s and cancels the body", async contentLength => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(1_024));
        controller.enqueue(new Uint8Array(1_025));
        controller.enqueue(new Uint8Array(1));
        controller.close();
      },
      cancel,
    });
    const init: RequestInit & { duplex: "half" } = {
      method: "POST", body, duplex: "half",
      headers: { "Content-Type": "application/json", ...(contentLength ? { "Content-Length": contentLength } : {}) },
    };
    const response = await POST(new Request("http://localhost/api/analyze", init));
    expect(response.status).toBe(413);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(githubMock).not.toHaveBeenCalled();
    expect(claudeMock).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("maps upstream errors without leaking internal details", async () => {
    githubMock.mockRejectedValueOnce(
      new AnalysisError("PR_NOT_FOUND", "Check the URL.", 404),
    );
    const response = await POST(
      request(JSON.stringify({ url: pullRequest().url })),
    );
    expect(response.status).toBe(404);
    expect((await response.json()).error.message).toBe("Check the URL.");
    githubMock.mockRejectedValueOnce(new Error("test-only-api-key"));
    const unexpected = await POST(
      request(JSON.stringify({ url: pullRequest().url })),
    );
    expect(unexpected.status).toBe(502);
    expect(await unexpected.text()).not.toContain("test-only-api-key");
  });
});
