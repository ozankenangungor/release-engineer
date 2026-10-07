"use client";

import { useSyncExternalStore } from "react";
import { FREE_DAILY_REVIEWS, FREE_USAGE_KEY, readFreeUsage } from "@/lib/free-plan";

const changed = "release-engineer:free-usage-changed";

function remaining() {
  try { return FREE_DAILY_REVIEWS - readFreeUsage(window.localStorage).used; }
  catch { return null; }
}

function subscribe(refresh: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === FREE_USAGE_KEY || event.key === null) refresh();
  };
  window.addEventListener("storage", storage);
  window.addEventListener(changed, refresh);
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);
  // Refresh an open page after UTC midnight, including when no input occurs.
  const timer = window.setInterval(refresh, 30_000);
  return () => {
    window.removeEventListener("storage", storage);
    window.removeEventListener(changed, refresh);
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", refresh);
    window.clearInterval(timer);
  };
}

export function notifyFreeUsageChanged() { window.dispatchEvent(new Event(changed)); }
export function useFreeAllowance() {
  return useSyncExternalStore(subscribe, remaining, () => FREE_DAILY_REVIEWS);
}
