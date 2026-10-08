import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Sign in — Release Engineer",
  robots: { index: false, follow: false },
};
export default function SignInPage() {
  return (
    <main id="main" className="identity-page">
      <section className="identity-story">
        <p className="section-kicker">RELEASE ENGINEER / YOUR ACCOUNT</p>
        <h1>
          Pick up
          <br />
          <span>your next review.</span>
        </h1>
        <p>
          A daily allowance that follows your account. Clear findings, coverage
          limits and the evidence to verify them.
        </p>
        <Link href="/">Continue with a public PR ↗</Link>
      </section>
      <section className="identity-form" aria-label="Sign in">
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/account"
          />
        ) : (
          <p>
            Sign-in is temporarily unavailable.{" "}
            <Link href="/">Free analysis remains available.</Link>
          </p>
        )}
        <p className="identity-terms">
          By continuing, you agree to our <Link href="/terms">Terms</Link> and
          acknowledge our <Link href="/privacy">Privacy notice</Link>.
        </p>
      </section>
    </main>
  );
}
