import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/account/review-feedback/route";
import { requireAccountIdentity } from "@/lib/account-auth";
import { accountDatabase } from "@/lib/accounts";
import { AnalysisError } from "@/lib/errors";
vi.mock("@/lib/account-auth",()=>({requireAccountIdentity:vi.fn()}));
vi.mock("@/lib/accounts",()=>({accountDatabase:vi.fn()}));
const query=vi.fn();
const data={recordId:"00000000-0000-4000-a000-000000000001",usefulness:"useful",action:"changed_code"};
const request=(value:unknown,origin="https://releaseengineer.tech")=>new Request("https://releaseengineer.tech/api/account/review-feedback",{method:"POST",headers:{"Content-Type":"application/json",Origin:origin},body:JSON.stringify(value)});
beforeEach(()=>{query.mockReset().mockResolvedValue([{id:data.recordId}]);vi.mocked(accountDatabase).mockReturnValue(query as unknown as ReturnType<typeof accountDatabase>);vi.mocked(requireAccountIdentity).mockReset().mockResolvedValue("user_owned");});
describe("account-owned usage feedback",()=>{
  it("accepts only choices and binds update to the authenticated owner and completed production review",async()=>{
    const response=await POST(request(data));expect(response.status).toBe(200);expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(query.mock.calls[0]?.slice(1)).toContain("user_owned");expect(String(query.mock.calls[0]?.[0])).toContain("status='succeeded'");
  });
  it("rejects another account's or missing review",async()=>{query.mockResolvedValue([]);expect((await POST(request(data))).status).toBe(404);});
  it.each([{...data,note:"private code"},{...data,usefulness:"verified_correct"},{...data,recordId:"bad"},{...data,note:"x".repeat(2000)}])("rejects extra content, unknown claims and oversized input",async value=>{expect((await POST(request(value))).status).toBe(400);expect(query).not.toHaveBeenCalled();});
  it("rejects cross-origin and unauthenticated requests",async()=>{expect((await POST(request(data,"https://attacker.example"))).status).toBe(403);vi.mocked(requireAccountIdentity).mockRejectedValue(new AnalysisError("SIGN_IN_REQUIRED","Sign in",401));expect((await POST(request(data))).status).toBe(401);expect(query).not.toHaveBeenCalled();});
});
