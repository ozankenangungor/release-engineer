import type { Paddle, PaddleEventData } from "@paddle/paddle-js";

// Public sandbox configuration. This client-side token is not an API secret.
// This integration deliberately has no live environment or entitlement path.
export const PADDLE_SANDBOX = {
  token: "test_4e531de093dbde40e3d26df5e5b",
  priceId: "pri_01m4m6t655rp43w5cghy7d72r9",
  demoPrice: "$9/month",
} as const;

export const PADDLE_SCRIPT_URL = "https://cdn.paddle.com/paddle/v2/paddle.js";
export const CHECKOUT_TIMEOUT_MS = 15_000;
let scriptLoading: Promise<void> | undefined;

function loadScript(): Promise<void> {
  if (window.PaddleBillingV1) return Promise.resolve();
  if (scriptLoading) return scriptLoading;

  // Load explicitly so a blocked/failed CDN request can be retried. The SDK's
  // internal loader caches rejected promises for the lifetime of the page.
  scriptLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PADDLE_SCRIPT_URL;
    script.async = true;
    const finish = (error?: Error) => {
      clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
      if (error) {
        script.remove();
        reject(error);
      } else {
        resolve();
      }
    };
    script.onload = () => finish(window.PaddleBillingV1 ? undefined : new Error("Checkout library unavailable"));
    script.onerror = () => finish(new Error("Checkout library could not load"));
    const timer = setTimeout(() => finish(new Error("Checkout library timed out")), CHECKOUT_TIMEOUT_MS);
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    scriptLoading = undefined;
    throw error;
  });
  return scriptLoading;
}

export async function loadSandboxCheckout(eventCallback: (event: PaddleEventData) => void): Promise<Paddle> {
  if (!PADDLE_SANDBOX.token.startsWith("test_")) throw new Error("Sandbox token required");
  await loadScript();
  const { initializePaddle } = await import("@paddle/paddle-js");
  const paddle = await initializePaddle({
    environment: "sandbox",
    token: PADDLE_SANDBOX.token,
    eventCallback,
    checkout: { settings: { displayMode: "overlay", theme: "dark", locale: "en", allowedPaymentMethods: ["card"], showAddDiscounts: false, showAddTaxId: false } },
  });
  if (!paddle?.Initialized) throw new Error("Checkout could not initialize");
  return paddle;
}
