import { processBillingEvent, verifyPaddleSignature } from "@/lib/billing";
import { accountFailure, privateHeaders } from "@/lib/account-response";
import { AnalysisError } from "@/lib/errors";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (!process.env.PADDLE_WEBHOOK_SECRET)
      throw new AnalysisError(
        "BILLING_UNAVAILABLE",
        "Billing notifications are not configured.",
        503,
      );
    const reader = request.body?.getReader();
    if (!reader)
      throw new AnalysisError("INVALID_EVENT", "Missing notification.", 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 131072) {
          await reader.cancel();
          throw new AnalysisError(
            "INVALID_EVENT",
            "Notification too large.",
            413,
          );
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    verifyPaddleSignature(
      raw,
      request.headers.get("paddle-signature"),
      process.env.PADDLE_WEBHOOK_SECRET,
    );
    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      throw new AnalysisError("INVALID_EVENT", "Invalid notification.", 400);
    }
    await processBillingEvent(input);
    return Response.json({ received: true }, { headers: privateHeaders });
  } catch (error) {
    return accountFailure(error);
  }
}
