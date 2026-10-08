"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { accountStateSchema, type AccountState } from "@/lib/account-types";
import { useUser } from "@clerk/nextjs";

type AccountContextValue = {
  account: AccountState | null;
  error: boolean;
  refresh: () => Promise<void>;
};
const Context = createContext<AccountContextValue>({
  account: null,
  error: false,
  refresh: async () => {},
});
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountState | null>(null);
  const [error, setError] = useState(false);
  const pending = useRef(false);
  const queued = useRef(false);
  const signedIn = useRef(false);
  const refresh = useCallback(async () => {
    if (pending.current) {
      queued.current = true;
      return;
    }
    pending.current = true;
    try {
      do {
        queued.current = false;
        try {
          const response = await fetch("/api/account", {
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
          });
          if (response.status === 401) {
            signedIn.current = false;
            setAccount(null);
            setError(false);
          } else {
            if (!response.ok) throw new Error("Account unavailable");
            const state = accountStateSchema.parse(await response.json());
            signedIn.current = true;
            setAccount(state);
            setError(false);
          }
        } catch {
          setError(true);
        }
      } while (queued.current);
    } finally {
      pending.current = false;
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(refresh);
    const update = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    const interval = window.setInterval(() => {
      if (signedIn.current) update();
    }, 30000);
    return () => {
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
      clearInterval(interval);
    };
  }, [refresh]);
  return (
    <Context.Provider value={{ account, error, refresh }}>
      {children}
    </Context.Provider>
  );
}
export function useAccount() {
  return useContext(Context);
}

// Clerk can finish registration without reloading the root layout. Refresh the
// durable account state on that transition instead of showing the guest quota.
export function AccountSessionSync() {
  const { isLoaded, user } = useUser();
  const { refresh } = useAccount();
  const userId = user?.id;
  useEffect(() => {
    if (isLoaded) void Promise.resolve().then(refresh);
  }, [isLoaded, userId, refresh]);
  return null;
}
