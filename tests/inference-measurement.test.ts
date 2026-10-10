import { afterEach, describe, expect, it, vi } from "vitest";
import { tokenCost, reserveInference, finishInference } from "@/lib/inference-measurement";
import { accountDatabase } from "@/lib/accounts";
import type { ReviewMetadata } from "@/lib/claude";
vi.mock("@/lib/accounts",()=>({accountDatabase:vi.fn()}));
const metadata: ReviewMetadata={requestedModel:"claude-sonnet-5-5",servedModel:"claude-sonnet-5-5",stopReason:"end_turn",usage:{inputTokens:8000,outputTokens:1500,cacheCreationInputTokens:0,cacheReadInputTokens:0}};
afterEach(()=>vi.unstubAllEnvs());
describe("content-free inference budget",()=>{
  it("calculates the documented standard tariff, without calling it an invoice",()=>expect(tokenCost(metadata)).toBe(31000));
  it("keeps unknown models and missing usage conservative",()=>{
    expect(tokenCost({...metadata,servedModel:"unknown"})).toBeNull();
    expect(tokenCost({...metadata,usage:{...metadata.usage,inputTokens:null}})).toBeNull();
    expect(tokenCost({...metadata,usage:{...metadata.usage,outputTokens:-1}})).toBeNull();
  });
  it("rejects exhausted global capacity before inference",async()=>{
    vi.stubEnv("ANTHROPIC_API_KEY","test-only-key"); vi.stubEnv("ANTHROPIC_MODEL","claude-sonnet-5-5");
    const query=vi.fn().mockResolvedValue([{admitted:false}]); vi.mocked(accountDatabase).mockReturnValue(query as unknown as ReturnType<typeof accountDatabase>);
    await expect(reserveInference(null,60000)).rejects.toMatchObject({code:"REVIEW_CAPACITY",status:429});
    expect(query.mock.calls[0]?.slice(1)).not.toContain("test-only-key");
  });
  it("rejects invalid budget configuration and unknown tariffs before DB admission",async()=>{
    vi.stubEnv("ANTHROPIC_API_KEY","test-only-key");vi.stubEnv("ANTHROPIC_MODEL","claude-sonnet-5-5");vi.stubEnv("ANALYSIS_DAILY_BUDGET_USD","0");
    await expect(reserveInference(null,10)).rejects.toMatchObject({code:"BUDGET_CONFIGURATION"});
    vi.stubEnv("ANTHROPIC_MODEL","unknown");await expect(reserveInference(null,10)).rejects.toMatchObject({code:"MODEL_BUDGET_CONFIGURATION"});
  });
  it("records failed charged responses and retains an unknown charge reservation",async()=>{
    const query=vi.fn().mockResolvedValue([]);vi.mocked(accountDatabase).mockReturnValue(query as unknown as ReturnType<typeof accountDatabase>);
    await finishInference({id:"00000000-0000-4000-a000-000000000001",reserved:200000},false,metadata,1200,true);
    expect(query.mock.calls[0]?.slice(1)).toContain(31000);expect(query.mock.calls[0]?.slice(1)).toContain("failed");
    await finishInference({id:"00000000-0000-4000-a000-000000000001",reserved:200000},false,null,1200,true);
    expect(query.mock.calls[1]?.slice(1)).toContain(200000);
  });
});
