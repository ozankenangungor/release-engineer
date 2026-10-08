import "server-only";
import { auth } from "@clerk/nextjs/server";
import { AnalysisError } from "./errors";

export async function accountIdentity() {
  if (
    !process.env.CLERK_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  )
    return null;
  const session = await auth();
  return session.isAuthenticated && session.sessionStatus === "active"
    ? session.userId
    : null;
}

export async function requireAccountIdentity() {
  const userId = await accountIdentity();
  if (!userId)
    throw new AnalysisError(
      "SIGN_IN_REQUIRED",
      "Sign in to manage your account.",
      401,
    );
  return userId;
}
