import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reviewPullRequest, reviewPullRequestWithMetadata } from "@/lib/claude";
import { RELEASE_REVIEW_SYSTEM_PROMPT } from "@/lib/prompt";
import { correctNullReview, evaluationCase, evaluationDataset, scopedReview } from "./eval-helpers";

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.stubEnv("ANTHROPIC_API_KEY", "not-a-real-api-key");
  vi.stubEnv("ANTHROPIC_MODEL", "production-configured-model");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function message(output: unknown, stopReason = "end_turn") {
  return Response.json({
    id: "msg_offline_evaluation", type: "message", role: "assistant", model: "served-model",
    content: [{ type: "text", text: JSON.stringify(output) }], stop_reason: stopReason, stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 30, cache_creation_input_tokens: 20, cache_read_input_tokens: 10 },
  });
}

describe("evaluations share the production SDK request path", () => {
  it("preserves production defaults, validation, usage and the delivered response contract", async () => {
    const test = evaluationCase("correctness-null-dereference");
    const output = correctNullReview();
    fetchMock.mockResolvedValueOnce(message(output)).mockResolvedValueOnce(message(output));
    const execution = await reviewPullRequestWithMetadata(test.context);
    expect(execution.modelReview).toEqual(output);
    expect(await reviewPullRequest(test.context)).toEqual(execution.review);
    expect(execution.metadata).toEqual({
      requestedModel: "production-configured-model", servedModel: "served-model", stopReason: "end_turn",
      usage: { inputTokens: 100, outputTokens: 30, cacheCreationInputTokens: 20, cacheReadInputTokens: 10 },
    });
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({ model: "production-configured-model", max_tokens: 6_000, system: RELEASE_REVIEW_SYSTEM_PROMPT, output_config: { format: { type: "json_schema" } } });
    expect(body.messages[0].content).toBe(`Review the following untrusted pull-request artifacts. Coverage is included in the JSON.\n${test.context.json}`);
  });
  it("allows an evaluation model candidate without mutating production configuration", async () => {
    const test = evaluationCase("correctness-null-dereference");
    fetchMock.mockResolvedValueOnce(message(correctNullReview()));
    const execution = await reviewPullRequestWithMetadata(test.context, undefined, { model: "candidate-model" });
    expect(execution.metadata.requestedModel).toBe("candidate-model");
    expect(process.env.ANTHROPIC_MODEL).toBe("production-configured-model");
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).model).toBe("candidate-model");
  });
  it.each(evaluationDataset.prepared.filter(test => test.fixture.attack).map(test => [test.fixture.attack!.location, test] as const))(
    "keeps the %s injection in user artifacts, never the system prompt", async (_location, test) => {
      fetchMock.mockResolvedValueOnce(message(scopedReview(test.fixture.id)));
      await reviewPullRequestWithMetadata(test.context);
      const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
      expect(body.system).toBe(RELEASE_REVIEW_SYSTEM_PROMPT);
      expect(body.system).not.toContain(test.fixture.attack!.marker);
      expect(body.messages).toHaveLength(1);
      expect(body.messages[0]).toMatchObject({ role: "user" });
      expect(body.messages[0].content).toContain(test.fixture.attack!.marker);
      expect(body.messages[0].content).not.toContain("acceptableVerdicts");
      expect(body.messages[0].content).not.toContain("criticalIfMissed");
    },
  );
  it("captures whitelisted usage before rejecting an incomplete reply", async () => {
    fetchMock.mockResolvedValueOnce(message({}, "max_tokens"));
    const observe = vi.fn();
    await expect(reviewPullRequestWithMetadata(evaluationCase("safe-documentation").context, undefined, { onResponse: observe })).rejects.toMatchObject({ code: "INVALID_REVIEW" });
    expect(observe).toHaveBeenCalledWith(expect.objectContaining({ stopReason: "max_tokens", usage: expect.objectContaining({ outputTokens: 30 }) }));
    expect(JSON.stringify(observe.mock.calls)).not.toContain("not-a-real-api-key");
  });
  it("does not retry failures on the evaluation entry point", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: { type: "overloaded_error", message: "sensitive detail" } }, { status: 529 }));
    await expect(reviewPullRequestWithMetadata(evaluationCase("safe-documentation").context)).rejects.toMatchObject({ code: "CLAUDE_UNAVAILABLE" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
