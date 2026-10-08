import type { Metadata } from "next";

const title = "Terms — Release Engineer";
const description =
  "Beta terms and limitations for Release Engineer’s public GitHub pull-request reviews.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/terms" },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
  openGraph: {
    title,
    description,
    url: "/terms",
    siteName: "Release Engineer",
    type: "website",
  },
};

export default function Terms() {
  return (
    <main id="main" className="page-shell legal-page">
      <p className="section-kicker">
        RELEASE ENGINEER / BETA
      </p>
      <h1 className="page-title">Terms</h1>
      <p className="mt-4 text-xs text-muted">
        Last updated: <time dateTime="2026-10-11">October 11, 2026</time>
      </p>
      <div className="mt-8 space-y-7 text-sm leading-7 text-muted">
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">
            Who operates this product
          </h2>
          <p>
            Release Engineer is built and operated by Ozan Kenan Güngör in
            Ankara, Türkiye. It is an independent, self-funded project in early
            beta. No legal company has been incorporated or registered.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">
            Using the beta
          </h2>
          <p>
            Release Engineer provides AI-assisted release-readiness reviews for
            public GitHub pull requests. Use it responsibly, submit only public
            content you are entitled to have processed, and do not abuse the
            service or attempt to access private data.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">
            Data handling
          </h2>
          <p>
            Public PR contents are processed by GitHub, Anthropic and our
            hosting provider to produce a review. The application records
            content-free operational events to assess service usage and
            availability. See the{" "}
            <a
              href="/privacy"
              className="text-signal underline underline-offset-4"
            >
              Privacy notice
            </a>{" "}
            for fields and retention boundaries.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">
            Your release decision
          </h2>
          <p>
            Reports are decision support and may contain mistakes or omit
            issues. They do not guarantee correctness, security or release
            safety. Verify findings, run appropriate tests, and obtain human
            review. You remain responsible for merge and release decisions.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">
            Availability and limits
          </h2>
          <p>
            This MVP is provided as available. Reviews depend on GitHub and
            Anthropic availability, API limits and the context we can retrieve.
            Large or incomplete changes may be analyzed only in part, with
            warnings. The service may change or be unavailable during the beta.
          </p>
          <p className="mt-3">
            Free homepage use allows 10 completed, validated reviews per UTC day
            in each browser, tracked in local storage. Failed or interrupted
            reviews do not count. Rate and concurrency limits also apply. The
            Pro plan at $9/month on the <a href="/pricing" className="text-signal underline underline-offset-4">Pricing page</a>{" "}
            lists a 100-review daily subscription allowance, resetting at 00:00 UTC.
            Account registration and server-verified billing activation are being
            connected; the production Pro allowance is not available yet. Both
            plans support public repositories only. Requesting access
            does not create a subscription or authorize a charge.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">Sandbox checkout</h2>
          <p>
            Preview checkout on Pricing opens a Paddle test checkout. Use test
            cards only. The $9/month sandbox price matches the proposed Pro
            price. Completing a sandbox transaction does not collect real
            payment, establish a paid service subscription, increase your free
            review allowance or activate production Pro access. Paddle may create
            simulated transactions and subscriptions in its sandbox account.
            Pro will have confirmed prices and terms before paid access opens.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">MVP notice</h2>
          <p>
            These brief beta terms describe the intended use and limits of the
            product. They are not a custom legal assessment.
          </p>
        </section>
        <p>
          Contact:{" "}
          <a
            href="mailto:founder@releaseengineer.tech"
            className="text-signal underline underline-offset-4"
          >
            founder@releaseengineer.tech
          </a>
        </p>
      </div>
    </main>
  );
}
