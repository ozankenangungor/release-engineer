import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Create an account — Release Engineer",
  robots: { index: false, follow: false },
};
export default function SignUpPage() {
  return (
    <main id="main" className="identity-page">
      <section className="identity-story">
        <p className="section-kicker">RELEASE ENGINEER / CREATE AN ACCOUNT</p>
        <h1>
          Your changes.
          <br />
          <span>Your review workspace.</span>
        </h1>
        <p>
          Start with 10 public PR reviews a day. Track your allowance across
          devices and manage your subscription from one place.
        </p>
        <ul>
          <li>No credit card to create an account</li>
          <li>PR contents and reports stay outside account storage</li>
          <li>Human verification stays in the loop</li>
        </ul>
      </section>
      <section className="identity-form" aria-label="Create an account">
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/account"
          />
        ) : (
          <p>
            Registration is temporarily unavailable.{" "}
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
