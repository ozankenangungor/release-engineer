import { describe, expect, it } from "vitest";
import { compareReviews, parseComparisonInput, reviewSnapshot, type ComparisonInput } from "@/lib/review-comparison";
import { handoffResponse } from "./verification-fixtures";
import { createVerificationRecord, EMPTY_FEEDBACK } from "@/lib/verification-record";
const input = (head: string, titles: string[]): ComparisonInput => ({ url:"https://github.com/example/repo/pull/1",head,partial:false,source:"report",findings:titles.map(title=>({title,file:"src/app.ts"})) });
describe("local revision comparison",()=>{
  it("accepts an existing verification export without using reviewer notes as findings",()=>{
    const response = handoffResponse();
    const record = createVerificationRecord(response, {receivedAt:null,interfaceRevision:null}, EMPTY_FEEDBACK,
      response.review.findings.map(({title,file},findingIndex)=>({title,file, findingIndex, assessment:"not_checked",note:"Private reviewer notes"})),
      {recordId:"00000000-0000-4000-a000-000000000001",recordedAt:"2026-10-11T00:00:00Z"});
    const parsed = parseComparisonInput(JSON.stringify(record));
    expect(parsed.source).toBe("verification");
    expect(parsed.head).toBe(response.pullRequest.headSha);
    expect(JSON.stringify(parsed)).not.toContain("Private reviewer notes");
  });
  it("accepts exported validated review JSON and preserves pinned identity",()=>{
    const result=handoffResponse(); const parsed=parseComparisonInput(JSON.stringify(reviewSnapshot(result)));
    expect(parsed.head).toBe(result.pullRequest.headSha); expect(parsed.findings).toHaveLength(result.review.findings.length);
  });
  it("does not label a missing finding fixed and does not equate new wording",()=>{
    const result=compareReviews(input("a".repeat(40),["Old","Same"]),input("b".repeat(40),["Same","New"]));
    expect(result.rows.map(r=>r.status)).toEqual(["reported_again","newly_reported","not_reported_again"]);
    expect(result.sameHead).toBe(false);
  });
  it("rejects different PRs and inconsistent report identities",()=>{
    expect(()=>compareReviews(input("a",[]),{...input("b",[]),url:"https://github.com/example/repo/pull/2"})).toThrow("same public");
    const snapshot=reviewSnapshot(handoffResponse()); snapshot.result.pullRequest.number++;
    expect(()=>parseComparisonInput(JSON.stringify(snapshot))).toThrow("identity");
  });
  it("keeps partial context and identical revision warnings",()=>{
    expect(compareReviews(input("a",[]),{...input("a",[]),partial:true})).toMatchObject({sameHead:true,partial:true});
  });
  it.each(["{broken",JSON.stringify({kind:"release_engineer_review",schemaVersion:1,result:{}})," ".repeat(1_048_577)])("rejects malformed or oversized files",text=>expect(()=>parseComparisonInput(text)).toThrow());
});
