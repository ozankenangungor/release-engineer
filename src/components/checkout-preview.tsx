"use client";

import { useEffect, useRef, useState } from "react";
import type { Paddle, PaddleEventData } from "@paddle/paddle-js";
import { CHECKOUT_TIMEOUT_MS, loadSandboxCheckout, PADDLE_SANDBOX } from "@/lib/paddle-sandbox";

type Status = "idle" | "loading" | "open" | "complete" | "error";
const DEFAULT_ERROR = "The test checkout could not open. Check your connection or content blocker, then retry. Free PR analysis is still available.";

export function CheckoutPreview() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorText, setErrorText] = useState(DEFAULT_ERROR);
  const button = useRef<HTMLButtonElement>(null);
  const active = useRef(false);
  const mounted = useRef(false);
  const paddle = useRef<Paddle | undefined>(undefined);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTimer = () => {
    clearTimeout(timeout.current);
    timeout.current = undefined;
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timeout.current);
      // Prevent a checkout overlay surviving navigation to another page.
      if (active.current) paddle.current?.Checkout.close();
    };
  }, []);

  function onCheckoutEvent(event: PaddleEventData) {
    if (!mounted.current || !active.current) return;
    if (event.name === "checkout.loaded") {
      clearTimer();
      setStatus("open");
    } else if (event.name === "checkout.completed") {
      clearTimer();
      active.current = false;
      paddle.current?.Checkout.close();
      setStatus("complete");
      button.current?.focus();
    } else if (event.name === "checkout.closed") {
      clearTimer();
      active.current = false;
      setStatus("idle");
      button.current?.focus();
    } else if (event.name === "checkout.error" || event.name === "checkout.failed") {
      failCheckout(event.code === "transaction_default_checkout_url_not_set"
        ? "Checkout preview is being configured. Please try again later or request Pro access below. Free PR analysis is still available."
        : DEFAULT_ERROR);
    }
  }

  function failCheckout(message = DEFAULT_ERROR) {
    clearTimer();
    active.current = false;
    paddle.current?.Checkout.close();
    if (mounted.current) {
      setErrorText(message);
      setStatus("error");
      button.current?.focus();
    }
  }

  async function openCheckout() {
    if (active.current) return;
    active.current = true;
    setStatus("loading");
    try {
      const instance = await loadSandboxCheckout(onCheckoutEvent);
      if (!mounted.current) { active.current = false; return; }
      paddle.current = instance;
      // Checkout.open is not a promise. Wait for an actual checkout.loaded
      // event, and recover if an iframe or its request never becomes ready.
      timeout.current = setTimeout(failCheckout, CHECKOUT_TIMEOUT_MS);
      instance.Checkout.open({ items: [{ priceId: PADDLE_SANDBOX.priceId, quantity: 1 }] });
    } catch {
      failCheckout();
    }
  }

  const busy = status === "loading" || status === "open";
  return (
    <div className="checkout-preview">
      <button ref={button} type="button" className="pricing-plan-action pricing-checkout-action" onClick={openCheckout} aria-describedby="checkout-preview-note" aria-disabled={busy} aria-busy={status === "loading"}>
        {status === "loading" ? "Loading checkout…" : status === "open" ? "Checkout is open" : status === "error" ? "Retry checkout preview" : "Preview checkout"}<span aria-hidden="true">↗︎</span>
      </button>
      <p id="checkout-preview-note" className="checkout-preview-note"><span>Sandbox demo · {PADDLE_SANDBOX.demoPrice} test amount</span>No real charge or paid access. Use test cards only.</p>
      <details className="checkout-test-details"><summary>Test card details</summary><p>Card: <code>4242 4242 4242 4242</code><br />Expiry: any future date · CVC: <code>100</code><br />Use an email address you own. Details entered in checkout are processed by Paddle.</p></details>
      <div className="checkout-status" role="status" aria-live="polite" aria-atomic="true">{status === "complete" ? "Sandbox checkout complete. No payment was taken and no paid plan was activated." : status === "loading" ? "Opening the Paddle test checkout…" : ""}</div>
      {status === "error" && <p className="checkout-error" role="alert" aria-label="Checkout error">{errorText}</p>}
    </div>
  );
}
