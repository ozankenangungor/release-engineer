import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { accountIdentity } from "@/lib/account-auth";
import { AccountWorkspace } from "@/components/account-workspace";
export const metadata: Metadata = {
  title: "Account — Release Engineer",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function AccountPage() {
  if (!(await accountIdentity())) redirect("/sign-in");
  return (
    <main id="main" className="account-page">
      <AccountWorkspace />
    </main>
  );
}
