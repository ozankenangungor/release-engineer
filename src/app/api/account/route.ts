import { requireAccountIdentity } from "@/lib/account-auth";
import { accountUsage, ensureAccount } from "@/lib/accounts";
import { accountSubscription, billingConfiguration } from "@/lib/billing";
import { accountFailure, privateHeaders } from "@/lib/account-response";

export async function GET() {
  try {
    const userId = await requireAccountIdentity();
    await ensureAccount(userId);
    const [usage, subscription] = await Promise.all([
      accountUsage(userId),
      accountSubscription(userId),
    ]);
    const config = billingConfiguration();
    return Response.json(
      {
        usage,
        subscription: subscription
          ? {
              status: subscription.status,
              environment: subscription.environment,
              renewsAt: subscription.renewsAt,
            }
          : null,
        billing: { environment: config.environment, ready: config.ready },
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    return accountFailure(error);
  }
}
