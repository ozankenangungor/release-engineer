import { z } from "zod";
import { requireAccountIdentity } from "@/lib/account-auth";
import { assertBrowserOrigin } from "@/lib/analysis-admission";
import { accountDatabase } from "@/lib/accounts";
import { accountFailure, privateHeaders } from "@/lib/account-response";
import { AnalysisError } from "@/lib/errors";
const schema = z.strictObject({ recordId: z.uuid(), usefulness: z.enum(["useful","mixed","not_useful"]), action: z.enum(["checked_evidence","changed_code","added_or_changed_tests","requested_human_review","none_recorded"]) });
export async function POST(request: Request) {
  try {
    assertBrowserOrigin(request);
    const userId = await requireAccountIdentity();
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new AnalysisError("INVALID_FEEDBACK", "Use the feedback form.", 400);
    const reader = request.body?.getReader();
    if (!reader) throw new AnalysisError("INVALID_FEEDBACK", "Feedback could not be read.", 400);
    const chunks: Uint8Array[] = []; let length = 0;
    try { while (true) { const { done, value } = await reader.read(); if (done) break; length += value.byteLength; if (length > 1024) { await reader.cancel(); throw new AnalysisError("INVALID_FEEDBACK", "Feedback is too large.", 400); } chunks.push(value); } }
    finally { reader.releaseLock(); }
    const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let value: unknown; try { value = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new AnalysisError("INVALID_FEEDBACK", "Feedback could not be read.", 400); }
    const parsed = schema.safeParse(value);
    if (!parsed.success) throw new AnalysisError("INVALID_FEEDBACK", "Choose a usefulness rating and action.", 400);
    const { recordId, usefulness, action } = parsed.data;
    const sql = accountDatabase();
    const rows = await sql`UPDATE release_engineer.inference_usage SET usefulness=${usefulness},action=${action}
      WHERE id=${recordId}::uuid AND user_id=${userId} AND scope='production' AND status='succeeded' RETURNING id`;
    if (!rows.length) throw new AnalysisError("REVIEW_NOT_FOUND", "Feedback can only be recorded for your completed production review.", 404);
    return Response.json({ saved: true }, { headers: privateHeaders });
  } catch (error) { return accountFailure(error); }
}
