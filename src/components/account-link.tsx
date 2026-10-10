"use client";
import Link from "next/link";
import { useAccount } from "./account-context";
export function AccountLink({
  className = "account-nav-link",
}: {
  className?: string;
}) {
  const { account } = useAccount();
  return (
    <Link
      className={className}
      href={account ? "/account" : "/sign-in"}
      data-account-state={account ? "signed-in" : "guest"}
      prefetch={false}
    >
      <span className="account-link-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20v-1.5a7 7 0 0 1 14 0V20" />
        </svg>
      </span>
      <span className="account-link-label">
        {account ? "Account" : "Sign in"}
      </span>
      <svg
        className="account-link-arrow"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path d="M5 12h14m-5-5 5 5-5 5" />
      </svg>
    </Link>
  );
}

export function PricingAccountLink() {
  const { account } = useAccount();
  return (
    <Link
      className="pricing-plan-action pricing-account-action"
      href={account ? "/account" : "/sign-up"}
      prefetch={false}
    >
      {account ? "Manage Pro in your account" : "Create an account"}
      <span aria-hidden="true">↗︎</span>
    </Link>
  );
}
