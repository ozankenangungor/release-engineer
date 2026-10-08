import { requireAccountIdentity } from "@/lib/account-auth";
import { createAccountCheckout } from "@/lib/billing";
import { accountFailure, privateHeaders } from "@/lib/account-response";
import { assertBrowserOrigin } from "@/lib/analysis-admission";
export async function POST(request: Request) {
  try {
    assertBrowserOrigin(request);
    const userId = await requireAccountIdentity();
    return Response.json(await createAccountCheckout(userId), {
      headers: privateHeaders,
    });
  } catch (error) {
    return accountFailure(error);
  }
}
