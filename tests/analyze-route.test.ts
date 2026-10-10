import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { getPullRequest } from "@/lib/github";
import { reviewPullRequest } from "@/lib/claude";
import { acquireAnalysisSlot } from "@/lib/analysis-admission";
import { reserveInference, finishInference } from "@/lib/inference-measurement";
vi.mock("@/lib/inference-measurement", () => ({ reserveInference: vi.fn(), finishInference: vi.fn() }));
import { AnalysisError } from "@/lib/errors";
import { pullRequest, review } from "./fixtures";
import { accountIdentity } from "@/lib/account-auth";
import { reserveAccountReview, finishAccountReview } from "@/lib/accounts";
vi.mock("@/lib/account-auth", () => ({ accountIdentity: vi.fn() }));
vi.mock("@/lib/accounts", () => ({
  reserveAccountReview: vi.fn(),
  finishAccountReview: vi.fn(),
}));

vi.mock("@/lib/analysis-admission", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analysis-admission")>()),
  acquireAnalysisSlot: vi.fn(),
}));
vi.mock("@/lib/github", () => ({ getPullRequest: vi.fn() }));
vi.mock("@/lib/claude", () => ({ reviewPullRequest: vi.fn() }));
const githubMock = vi.mocked(getPullRequest);
const claudeMock = vi.mocked(reviewPullRequest);
beforeEach(() => {
  vi.mocked(reserveInference).mockReset().mockResolvedValue({ id: "00000000-0000-4000-a000-000000000002", reserved: 200000 });
  vi.mocked(finishInference).mockReset().mockResolvedValue(undefined);
  vi.mocked(accountIdentity).mockReset().mockResolvedValue(null);
  vi.mocked(reserveAccountReview)
    .mockReset()
    .mockResolvedValue({
      userId: "user_test",
      id: "00000000-0000-4000-a000-000000000001",
    });
  vi.mocked(finishAccountReview).mockReset().mockResolvedValue(undefined);
  vi.stubEnv("ANTHROPIC_API_KEY", "test-only-api-key");
  vi.mocked(acquireAnalysisSlot).mockReset();
  vi.mocked(acquireAnalysisSlot).mockReturnValue(vi.fn());
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
  it("reserves signed-in usage before paid inference and completes only a validated report", async () => {
    vi.mocked(accountIdentity).mockResolvedValue("user_test");
    const response = await POST(
      request(JSON.stringify({ url: pullRequest().url })),
    );
    expect(response.status).toBe(200);
    expect(reserveAccountReview).toHaveBeenCalledWith("user_test");
    expect(
      vi.mocked(reserveAccountReview).mock.invocationCallOrder[0],
    ).toBeLessThan(claudeMock.mock.invocationCallOrder[0]!);
    expect(finishAccountReview).toHaveBeenCalledExactlyOnceWith(
      { userId: "user_test", id: "00000000-0000-4000-a000-000000000001" },
      true,
    );
  });
  it.each(["DAILY_LIMIT", "MONTHLY_LIMIT", "ACCOUNT_BUSY"])(
    "rejects %s before retrieval and inference",
    async (code) => {
      vi.mocked(accountIdentity).mockResolvedValue("user_test");
      vi.mocked(reserveAccountReview).mockRejectedValue(
        new AnalysisError(code, "Limit", 429),
      );
      expect(
        (await POST(request(JSON.stringify({ url: pullRequest().url }))))
          .status,
      ).toBe(429);
      expect(githubMock).not.toHaveBeenCalled();
      expect(claudeMock).not.toHaveBeenCalled();
    },
  );
  it("stops before Claude when the shared budget refuses admission and releases the account reservation", async () => {
    vi.mocked(accountIdentity).mockResolvedValue("user_test");
    vi.mocked(reserveInference).mockRejectedValueOnce(new AnalysisError("REVIEW_CAPACITY", "Capacity reached", 429));
    const response = await POST(request(JSON.stringify({ url: pullRequest().url })));
    expect(response.status).toBe(429);
    expect(claudeMock).not.toHaveBeenCalled();
    expect(finishAccountReview).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({userId:"user_test"}), false);
    expect(finishInference).not.toHaveBeenCalled();
  });
  it("rolls back completed account usage when inference measurement cannot be persisted", async () => {
    vi.mocked(accountIdentity).mockResolvedValue("user_test");
    vi.mocked(finishInference).mockRejectedValueOnce(new Error("database unavailable"));
    const response = await POST(request(JSON.stringify({ url: pullRequest().url })));
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain(review().summary);
    expect(finishAccountReview).toHaveBeenNthCalledWith(1, expect.anything(), true);
    expect(finishAccountReview).toHaveBeenNthCalledWith(2, expect.anything(), false);
    expect(finishInference).toHaveBeenLastCalledWith(expect.anything(), false, null, expect.any(Number), expect.any(Boolean));
  });
  it("releases failed and invalid reports without completing account usage", async () => {
    vi.mocked(accountIdentity).mockResolvedValue("user_test");
    claudeMock.mockResolvedValueOnce({ ...review(), summary: "" });
    expect(
      (await POST(request(JSON.stringify({ url: pullRequest().url })))).status,
    ).toBe(502);
    expect(finishAccountReview).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ userId: "user_test" }),
      false,
    );
  });
  it("does not perform paid inference for an already interrupted request", async () => {
    vi.mocked(accountIdentity).mockResolvedValue("user_test");
    const controller = new AbortController();
    controller.abort();
    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: pullRequest().url }),
      signal: controller.signal,
    });
    expect((await POST(req)).status).toBe(502);
    expect(claudeMock).not.toHaveBeenCalled();
    expect(finishAccountReview).toHaveBeenCalledWith(expect.anything(), false);
  });
  it("does not return a report if durable completion could not be recorded", async () => {
    vi.mocked(accountIdentity).mockResolvedValue("user_test");
    vi.mocked(finishAccountReview).mockRejectedValueOnce(
      new AnalysisError("ACCOUNT_UNAVAILABLE", "Unavailable", 503),
    );
    const response = await POST(
      request(JSON.stringify({ url: pullRequest().url })),
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain(review().summary);
  });
  it("releases completion if the request is interrupted during the database round trip", async () => {
    vi.mocked(accountIdentity).mockResolvedValue("user_test");
    const controller = new AbortController();
    vi.mocked(finishAccountReview).mockImplementationOnce(async () => {
      controller.abort();
    });
    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: pullRequest().url }),
      signal: controller.signal,
    });
    expect((await POST(req)).status).toBe(502);
    expect(finishAccountReview).toHaveBeenCalledTimes(2);
    expect(finishAccountReview).toHaveBeenLastCalledWith(
      expect.anything(),
      false,
    );
  });
  it("rejects cross-site browser requests before upstream access", async () => {
    for (const headers of [
      { Origin: "https://other.example" },
      { Origin: "null" },
      { "Sec-Fetch-Site": "cross-site" },
    ] as Record<string, string>[]) {
      const response = await POST(
        new Request("http://localhost/api/analyze", {
          method: "POST",
          body: JSON.stringify({ url: pullRequest().url }),
          headers: { "Content-Type": "application/json", ...headers },
        }),
      );
      expect(response.status).toBe(403);
    }
    expect(githubMock).not.toHaveBeenCalled();
    expect(claudeMock).not.toHaveBeenCalled();
    expect(acquireAnalysisSlot).not.toHaveBeenCalled();
  });
  it("returns an uncached retryable limit without fetching or invoking Claude", async () => {
    vi.mocked(acquireAnalysisSlot).mockImplementationOnce(() => {
      throw new AnalysisError("SERVICE_BUSY", "Wait a minute.", 429);
    });
    const response = await POST(
      request(JSON.stringify({ url: pullRequest().url })),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(githubMock).not.toHaveBeenCalled();
    expect(claudeMock).not.toHaveBeenCalled();
  });
  it("releases admission on both successful and failed pipelines", async () => {
    const release = vi.fn();
    vi.mocked(acquireAnalysisSlot).mockReturnValue(release);
    expect(
      (await POST(request(JSON.stringify({ url: pullRequest().url })))).status,
    ).toBe(200);
    expect(release).toHaveBeenCalledTimes(1);
    githubMock.mockRejectedValueOnce(
      new AnalysisError("GITHUB_UNAVAILABLE", "Unavailable"),
    );
    expect(
      (await POST(request(JSON.stringify({ url: pullRequest().url })))).status,
    ).toBe(502);
    expect(release).toHaveBeenCalledTimes(2);
  });
  it("records only a successful validated pipeline, without PR/provider content or browser identity", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const response = await POST(
      request(JSON.stringify({ url: pullRequest().url })),
    );
    const events = log.mock.calls.map(([line]) => JSON.parse(String(line)));
    expect(events.map((event) => event.event)).toEqual([
      "analysis_started",
      "analysis_succeeded",
    ]);
    expect(events[1].includedFileCount).toBe(1);
    expect(JSON.stringify(events)).not.toMatch(
      /octocat|hello-world|Update application|test-only-api-key|github.com/,
    );
    expect(await response.text()).not.toContain(events[0].analysisId);
  });
  it("records failures after start, never success for a malformed report, and no event for rejected input", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    claudeMock.mockResolvedValueOnce({ ...review(), summary: "" });
    expect(
      (await POST(request(JSON.stringify({ url: pullRequest().url })))).status,
    ).toBe(502);
    expect(
      log.mock.calls.map(([line]) => JSON.parse(String(line)).event),
    ).toEqual(["analysis_started", "analysis_failed"]);
    log.mockClear();
    expect(
      (
        await POST(
          request(JSON.stringify({ url: "https://evil.example/path" })),
        )
      ).status,
    ).toBe(400);
    expect(log).not.toHaveBeenCalled();
  });
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
  it.each([undefined, "1"])(
    "bounds chunked input with Content-Length %s and cancels the body",
    async (contentLength) => {
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
        method: "POST",
        body,
        duplex: "half",
        headers: {
          "Content-Type": "application/json",
          ...(contentLength ? { "Content-Length": contentLength } : {}),
        },
      };
      const response = await POST(
        new Request("http://localhost/api/analyze", init),
      );
      expect(response.status).toBe(413);
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(githubMock).not.toHaveBeenCalled();
      expect(claudeMock).not.toHaveBeenCalled();
      expect(response.headers.get("cache-control")).toBe("no-store");
    },
  );
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
