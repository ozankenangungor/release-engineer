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
      prefetch={false}
    >
      {account ? "Account" : "Sign in"}
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
