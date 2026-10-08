"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { z } from "zod";
import type { Paddle } from "@paddle/paddle-js";
import { useAccount } from "./account-context";

export function AccountWorkspace() {
  const { account, error, refresh } = useAccount();
  const { user } = useUser();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const checkout = useRef<Paddle | null>(null);
  const billingButton = useRef<HTMLButtonElement>(null);
  const active = useRef(false);
  const mounted = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      clearTimeout(timeout.current);
      if (active.current) {
        active.current = false;
        try {
          checkout.current?.Checkout.close();
        } catch {}
      }
    };
  }, []);
  function settle(text = "", close = false) {
    clearTimeout(timeout.current);
    active.current = false;
    if (close) {
      try {
        checkout.current?.Checkout.close();
      } catch {}
    }
    if (!mounted.current) return;
    setMessage(text);
    setBusy(false);
    requestAnimationFrame(() => billingButton.current?.focus());
  }
  async function billing(action: "checkout" | "portal") {
    if (active.current || !account?.billing.ready) return;
    active.current = true;
    controller.current = new AbortController();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/billing/${action}`, {
        method: "POST",
        signal: AbortSignal.any([
          controller.current.signal,
          AbortSignal.timeout(20000),
        ]),
      });
      const data = await response.json();
      if (!mounted.current) return;
      if (!response.ok)
        throw new Error(
          data.error?.message ?? "Billing is temporarily unavailable.",
        );
      if (action === "portal") {
        const url = new URL(z.object({ url: z.url() }).parse(data).url);
        if (url.protocol !== "https:" || !url.hostname.endsWith(".paddle.com"))
          throw new Error("Invalid billing link.");
        window.location.assign(url.href);
        return;
      }
      const details = z
        .object({
          transactionId: z.string().regex(/^txn_[a-z0-9]+$/),
          environment: z.enum(["sandbox", "live"]),
          token: z.string().min(10),
        })
        .parse(data);
      const { loadAccountCheckout, CHECKOUT_TIMEOUT_MS } =
        await import("@/lib/paddle-sandbox");
      const instance = await loadAccountCheckout(details, (event) => {
        if (!mounted.current || !active.current) return;
        if (event.name === "checkout.loaded") clearTimeout(timeout.current);
        else if (event.name === "checkout.completed") {
          settle(
            "Checkout complete. Your account updates after Paddle verifies the subscription.",
            true,
          );
          void refresh();
        } else if (event.name === "checkout.closed") {
          settle();
          void refresh();
        } else if (
          event.name === "checkout.error" ||
          event.name === "checkout.failed"
        )
          settle(
            "Checkout could not be completed. Please retry. Free analysis remains available.",
            true,
          );
      });
      if (!mounted.current) return;
      checkout.current = instance;
      timeout.current = setTimeout(
        () =>
          settle(
            "Checkout did not become ready. Please retry. Free analysis remains available.",
            true,
          ),
        CHECKOUT_TIMEOUT_MS,
      );
      instance.Checkout.open({ transactionId: details.transactionId });
    } catch (failure) {
      settle(
        failure instanceof Error
          ? failure.message
          : "Billing could not be reached.",
        true,
      );
    }
  }
  const usage = account?.usage;
  const managedSubscription = Boolean(
    account?.subscription && account.subscription.status !== "canceled",
  );
  return (
    <>
      <header className="account-heading">
        <div>
          <p className="section-kicker">RELEASE ENGINEER / ACCOUNT</p>
          <h1>Your release workspace.</h1>
          <p>{user?.primaryEmailAddress?.emailAddress ?? "Your account"}</p>
        </div>
        <SignOutButton redirectUrl="/">
          <button type="button" className="account-secondary">
            Sign out ↗︎
          </button>
        </SignOutButton>
      </header>
      {error && (
        <div role="alert" className="account-notice">
          Your account could not be refreshed.{" "}
          <button onClick={() => void refresh()}>Retry</button>
        </div>
      )}
      <section className="account-usage" aria-labelledby="account-usage-title">
        <div>
          <p className="section-kicker">TODAY / UTC</p>
          <h2 id="account-usage-title">Your daily review allowance.</h2>
          <p>
            Only completed, validated reviews count. Failed requests release
            their reservation.
          </p>
        </div>
        <div className="account-counter" aria-live="polite">
          <strong>
            {usage?.remaining ?? "—"}
            <span> / {usage?.limit ?? "—"}</span>
          </strong>
          <p>reviews remaining</p>
          <progress
            aria-label="Daily reviews used"
            value={usage?.used ?? 0}
            max={usage?.limit ?? 10}
          />
          <p>
            {usage
              ? `${usage.used} completed${usage.pending ? " · 1 review in progress" : ""} · Resets at 00:00 UTC`
              : "Loading account usage…"}
          </p>
          <Link className="account-primary" href="/#analyze">
            Analyze a public PR ↗︎
          </Link>
        </div>
      </section>
      <section className="account-billing" aria-labelledby="account-plan-title">
        <div>
          <p className="section-kicker">YOUR PLAN</p>
          <h2 id="account-plan-title">
            {usage?.plan === "pro" ? "Pro" : "Free"}
            <span>{usage?.plan === "pro" ? "$9 / month" : "$0"}</span>
          </h2>
          <p>
            {usage?.plan === "pro"
              ? "100 public PR reviews a day, linked to your account."
              : "10 public PR reviews a day, linked to your account."}
          </p>
        </div>
        <div>
          <p className="account-plan-option">
            Pro · $9/month · 100 reviews/day
          </p>
          <p>
            Keep the same evidence and verification standard, with more daily
            review capacity.
          </p>
          {account?.billing.environment === "sandbox" && (
            <p className="account-sandbox">
              Sandbox billing · Test subscriptions appear here. Your production
              review allowance remains Free until live billing is activated.
            </p>
          )}
          {account?.subscription && (
            <p className="account-subscription-status">
              {account.subscription.environment === "sandbox"
                ? "Test subscription"
                : "Subscription"}
              : <strong>{account.subscription.status}</strong>
              {account.subscription.renewsAt && (
                <span>
                  {" "}
                  · Current period ends{" "}
                  {new Date(account.subscription.renewsAt).toLocaleDateString(
                    "en-GB",
                    { timeZone: "UTC" },
                  )}
                </span>
              )}
            </p>
          )}
          {!account?.billing.ready && (
            <p className="account-notice">
              Account billing is being configured. Free reviews are available.
            </p>
          )}
          <button
            ref={billingButton}
            type="button"
            className="account-primary"
            disabled={!account?.billing.ready}
            aria-disabled={busy}
            aria-busy={busy}
            onClick={() =>
              void billing(managedSubscription ? "portal" : "checkout")
            }
          >
            {busy
              ? "Checkout is opening or open…"
              : !account
                ? "Loading billing…"
                : managedSubscription
                  ? "Manage subscription ↗︎"
                  : account?.billing.environment === "sandbox"
                    ? "Try Pro sandbox checkout ↗︎"
                    : "Subscribe to Pro ↗︎"}
          </button>
          {account?.subscription?.status === "canceled" && (
            <button
              type="button"
              className="account-secondary"
              disabled={!account.billing.ready}
              aria-disabled={busy}
              onClick={() => void billing("portal")}
            >
              View past billing ↗︎
            </button>
          )}
          <p role="status" aria-live="polite">
            {message}
          </p>
        </div>
      </section>
      <section className="account-data">
        <p className="section-kicker">ACCOUNT DATA</p>
        <h2>A small account footprint.</h2>
        <p>
          Clerk manages your sign-in details and sessions. Release Engineer
          keeps your account ID, daily usage and subscription state. PR contents
          and reports are not saved to your account.
        </p>
        <div>
          <Link href="/privacy">Privacy and data requests ↗︎</Link>
          <Link href="/sign-in">Sign-in and password recovery ↗︎</Link>
          <Link href="/pricing">Compare plans ↗︎</Link>
        </div>
      </section>
    </>
  );
}
