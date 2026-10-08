import { requireAccountIdentity } from "@/lib/account-auth";
import { createAccountPortal } from "@/lib/billing";
import { accountFailure, privateHeaders } from "@/lib/account-response";
import { assertBrowserOrigin } from "@/lib/analysis-admission";
export async function POST(request: Request) {
  try {
    assertBrowserOrigin(request);
    return Response.json(
      { url: await createAccountPortal(await requireAccountIdentity()) },
      { headers: privateHeaders },
    );
  } catch (error) {
    return accountFailure(error);
  }
}
