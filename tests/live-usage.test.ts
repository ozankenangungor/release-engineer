import { afterEach, describe, expect, it, vi } from "vitest";
import { startUsageRecord } from "@/lib/live-usage";

afterEach(() => vi.unstubAllEnvs());
function capture() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "a".repeat(40));
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  return {
    log,
    events: () =>
      log.mock.calls.map(
        ([line]) => JSON.parse(String(line)) as Record<string, unknown>,
      ),
  };
}

describe("privacy-safe usage events", () => {
  it("emits one start and one success with only operational fields", () => {
    const { events } = capture();
    const record = startUsageRecord();
    record.succeeded({
      changedFileCount: 6,
      includedFileCount: 4,
      partialContext: true,
    });
    record.succeeded({
      changedFileCount: 100,
      includedFileCount: 100,
      partialContext: false,
    });
    record.failed("PR_NOT_FOUND");
    const [start, success] = events();
    expect(events()).toHaveLength(2);
    expect(start?.event).toBe("analysis_started");
    expect(start?.analysisId).toMatch(/^[0-9a-f-]{36}$/);
    expect(success?.analysisId).toBe(start?.analysisId);
    expect(success?.productCommit).toBe("a".repeat(40));
    expect(success?.changedFileCount).toBe(6);
    expect(success?.includedFileCount).toBe(4);
    expect(success?.partialContext).toBe(true);
    expect(Object.keys(success!).sort()).toEqual(
      [
        "analysisId",
        "changedFileCount",
        "durationMs",
        "environment",
        "event",
        "includedFileCount",
        "namespace",
        "partialContext",
        "productCommit",
        "schemaVersion",
        "timestamp",
      ].sort(),
    );
  });
  it("never logs unknown error codes or arbitrary environment/revision strings", () => {
    const { events } = capture();
    vi.stubEnv("VERCEL_ENV", "private@example.test");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "https://github.com/secret/repository");
    const record = startUsageRecord();
    record.failed("provider-response-includes-api-key");
    record.failed("PR_NOT_FOUND");
    expect(events()).toHaveLength(2);
    expect(events()[1]?.errorCode).toBe("ANALYSIS_FAILED");
    expect(events()[0]?.environment).toBe("local");
    expect(JSON.stringify(events())).not.toMatch(/private@|secret\/|api-key/);
    expect(events()[0]).not.toHaveProperty("productCommit");
  });
  it("sanitizes metrics, isolates attempts and cannot fail the product if logging throws", () => {
    const { events, log } = capture();
    const first = startUsageRecord();
    first.succeeded({
      changedFileCount: Infinity,
      includedFileCount: -1,
      partialContext: false,
    });
    const second = startUsageRecord();
    expect(events()[0]?.analysisId).not.toBe(events()[2]?.analysisId);
    expect(events()[1]?.changedFileCount).toBe(0);
    expect(events()[1]?.includedFileCount).toBe(0);
    log.mockImplementation(() => {
      throw new Error("hosting logging failure");
    });
    expect(() => second.failed("ANALYSIS_TIMEOUT")).not.toThrow();
  });
});
