import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/account/route";
import { POST as checkout } from "@/app/api/billing/checkout/route";
import { POST as portal } from "@/app/api/billing/portal/route";
import { requireAccountIdentity } from "@/lib/account-auth";
import { createAccountCheckout, createAccountPortal } from "@/lib/billing";
import { ensureAccount, accountUsage } from "@/lib/accounts";
import { AnalysisError } from "@/lib/errors";
vi.mock("@/lib/account-auth", () => ({ requireAccountIdentity: vi.fn() }));
vi.mock("@/lib/accounts", () => ({
  ensureAccount: vi.fn(),
  accountUsage: vi.fn(),
}));
vi.mock("@/lib/billing", () => ({
  createAccountCheckout: vi.fn(),
  createAccountPortal: vi.fn(),
  accountSubscription: vi.fn().mockResolvedValue(null),
  billingConfiguration: vi
    .fn()
    .mockReturnValue({ environment: "sandbox", ready: false }),
}));
const req = (headers: HeadersInit = {}) =>
  new Request("http://localhost/api/billing/checkout", {
    method: "POST",
    headers,
    body: JSON.stringify({ userId: "user_attacker", plan: "pro" }),
  });
beforeEach(() => {
  vi.mocked(requireAccountIdentity)
    .mockReset()
    .mockResolvedValue("user_verified");
  vi.mocked(createAccountCheckout)
    .mockReset()
    .mockResolvedValue({
      transactionId: "txn_test",
      environment: "sandbox",
      token: "test_public",
    });
  vi.mocked(createAccountPortal)
    .mockReset()
    .mockResolvedValue("https://customer-portal.paddle.com/session");
  vi.mocked(accountUsage)
    .mockReset()
    .mockResolvedValue({
      plan: "free",
      used: 0,
      pending: 0,
      limit: 10,
      remaining: 10,
      resetsAt: "2026-10-12T00:00:00Z",
    });
  vi.mocked(ensureAccount).mockReset();
});
describe("account API authorization", () => {
  it("requires a verified session for account data, checkout and portal", async () => {
    vi.mocked(requireAccountIdentity).mockRejectedValue(
      new AnalysisError("SIGN_IN_REQUIRED", "Sign in", 401),
    );
    for (const response of [
      await GET(),
      await checkout(req()),
      await portal(req()),
    ])
      expect(response.status).toBe(401);
    expect(createAccountCheckout).not.toHaveBeenCalled();
    expect(createAccountPortal).not.toHaveBeenCalled();
    expect(ensureAccount).not.toHaveBeenCalled();
  });
  it("rejects cross-site billing mutations before provider access", async () => {
    for (const action of [checkout, portal])
      expect(
        (await action(req({ Origin: "https://other.example" }))).status,
      ).toBe(403);
    expect(createAccountCheckout).not.toHaveBeenCalled();
    expect(createAccountPortal).not.toHaveBeenCalled();
  });
  it("uses server identity rather than any account or plan sent by the browser", async () => {
    expect((await checkout(req())).status).toBe(200);
    expect(createAccountCheckout).toHaveBeenCalledExactlyOnceWith(
      "user_verified",
    );
    expect((await portal(req())).status).toBe(200);
    expect(createAccountPortal).toHaveBeenCalledExactlyOnceWith(
      "user_verified",
    );
  });
  it("keeps account data private, uncached, and scoped to the verified account", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("vary")).toContain("Cookie");
    expect(accountUsage).toHaveBeenCalledWith("user_verified");
    const body = await response.text();
    expect(body).not.toMatch(/secret|customerId|user_verified/);
  });
});
