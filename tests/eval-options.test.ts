import { afterEach, describe, expect, it, vi } from "vitest";
import { liveOptions, redact } from "../evals/options";
import { main } from "../evals/cli";
import { evaluationDataset } from "./eval-helpers";

const env = { EVAL_LIVE: "1", ANTHROPIC_API_KEY: "not-a-real-api-key" };
const cases = evaluationDataset.prepared;
afterEach(() => vi.restoreAllMocks());

describe("evaluation CLI preflight", () => {
  it.each([{}, { ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY }, { EVAL_LIVE: "true" }])("requires the exact explicit live opt-in", input => {
    expect(() => liveOptions([], input, cases)).toThrow("EVAL_LIVE=1");
  });
  it.each([undefined, "", "short", "key with spaces invalid", "key\nunsafe-data-string"])("rejects missing or malformed credentials without printing them", apiKey => {
    expect(() => liveOptions([], { EVAL_LIVE: "1", ANTHROPIC_API_KEY: apiKey }, cases)).toThrow("valid-format");
  });
  it("defaults to one tiny correctness case without overriding the production model", () => {
    const options = liveOptions([], env, cases);
    expect(options.selected.map(test => test.fixture.id)).toEqual(["correctness-null-dereference"]);
    expect(options.model).toBeUndefined();
    expect(options.includeReviews).toBe(false);
  });
  it("requires an explicit higher cap for the full dataset", () => {
    expect(() => liveOptions(["--cases", "all"], env, cases)).toThrow("exceeds");
    expect(liveOptions(["--cases", "all", "--max-cases", "32"], env, cases).selected).toHaveLength(32);
  });
  it.each([
    ["--cases", "unknown-case"], ["--cases", ""],
    ["--cases", "safe-documentation,safe-documentation"],
    ["--max-cases", "0"], ["--max-cases", "101"], ["--max-cases", "1.5"],
    ["--label", "../../escape"], ["--other"], ["--cases"], ["--include-reviews", "--include-reviews"],
  ].map(args => ({ args })))("rejects invalid options before any provider work: $args", ({ args }) => {
    expect(() => liveOptions(args, env, cases)).toThrow();
  });
  it("selects cases in stable dataset order and permits an explicit model candidate", () => {
    const options = liveOptions(["--cases", "safe-documentation,correctness-null-dereference", "--include-reviews"], { ...env, EVAL_MODEL: "candidate-model" }, cases);
    expect(options.selected.map(test => test.fixture.id)).toEqual(["correctness-null-dereference", "safe-documentation"]);
    expect(options).toMatchObject({ model: "candidate-model", includeReviews: true });
    expect(() => liveOptions([], { ...env, EVAL_MODEL: "" }, cases)).toThrow("EVAL_MODEL");
  });
  it("validates offline with no key and explicitly makes no quality claim", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(main(["validate"], {})).resolves.toBe(0);
    expect(log.mock.calls.flat().join("\n")).toContain("not a quality baseline");
    await expect(main(["live"], {})).rejects.toThrow("EVAL_LIVE=1");
  });
  it("redacts configured secrets and recognizable token patterns", () => {
    const secret = "private-test-value";
    const token = "sk-ant-" + "x".repeat(30);
    expect(redact(`${secret} ${token}`, [secret])).toBe("[REDACTED] [REDACTED]");
  });
});
