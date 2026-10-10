import type { Metadata } from "next";

const title = "Privacy — Release Engineer";
const description =
  "Privacy and data handling for Release Engineer’s public GitHub pull-request reviews.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacy" },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
  openGraph: {
    title,
    description,
    url: "/privacy",
    siteName: "Release Engineer",
    type: "website",
  },
};

export default function Privacy() {
  return (
    <main id="main" className="page-shell legal-page">
      <p className="section-kicker">
        RELEASE ENGINEER / BETA
      </p>
      <h1 className="page-title">Privacy</h1>
      <p className="mt-4 text-xs text-muted">
        Last updated: <time dateTime="2026-10-11">October 11, 2026</time>
      </p>
      <div className="mt-8 space-y-7 text-sm leading-7 text-muted">
        <section><h2 className="mb-2 text-base font-medium text-ink">Usage measurement and local comparison</h2><p>The application records an inference ID, UTC time, environment, model, product revision, account ID when signed in, server outcome, duration, partial-context status and provider token counts. Estimated API cost is calculated using a documented tariff. No PR identifiers, code, report text or free-text notes are stored in these records. Records older than 90 days are deleted on subsequent inference admission; account deletion also removes linked usage records.</p><p className="mt-3">Signed-in reviewers can explicitly submit a usefulness choice and action choice for their own completed production review. These are user reports, not independent verification. Reports and verification files opened on Compare reviews are read locally in tab memory, never uploaded or saved. Reloading clears the comparison. The guest counter stores the UTC day/month and review counts in local storage.</p></section>
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
            What happens when you analyze a PR
          </h2>
          <p>
            We send the submitted URL to our server, retrieve public
            pull-request metadata and changed-file patches from GitHub, and send
            a bounded selection of those contents to Anthropic’s Claude API to
            produce your review. Submit only public pull requests you are
            comfortable having processed this way.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">
            Operational usage evidence
          </h2>
          <p>
            When a valid, configured analysis starts, the server records
            structured operational events in hosting logs: start, success or
            failure; timestamp; environment; product commit when available;
            duration; file counts and partial-context status on success; or a
            high-level error code on failure. A random analysis ID links events
            for one attempt and helps deduplicate exported logs. It is not a
            user or session identifier and is never stored in a cookie.
          </p>
          <p className="mt-3">
            These application events do not contain the PR URL, repository or
            owner, patches, descriptions, reports, model output, emails, user
            identity, IP addresses, request headers or secrets. Hosting
            providers may separately record request metadata under their own
            policies. Operational events are retained according to the hosting
            plan; selected event records may be preserved privately to
            substantiate a dated aggregate analysis count. Such counts are not
            user counts.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">
            Storage and providers
          </h2>
          <p>
            The application does not persist submitted PR contents or review
            reports. They are held in memory while processing and displayed in
            your browser. Optional accounts use Clerk for identity, verification,
            passwords, recovery and session cookies, and Neon for account IDs,
            daily and monthly review usage and subscription state. There are no application
            advertising trackers. Our hosting provider, GitHub and
            Anthropic may process request metadata or contents under their own
            policies; this application does not control their retention.
          </p>
          <p className="mt-3">Clerk may also store its public instance configuration
            and security state in browser storage, including for signed-out
            visitors while its sign-in SDK initializes. This is separate from
            report or verification-note storage; those notes remain in page
            memory and local downloads.</p>
          <p className="mt-3">
            <a
              href="https://www.anthropic.com/legal/privacy"
              className="text-signal underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anthropic privacy policy
            </a>{" "}
            ·{" "}
            <a
              href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
              className="text-signal underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub privacy statement
            </a>{" "}
            ·{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              className="text-signal underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel privacy policy
            </a>
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">Checkout preview</h2>
          <p>
            The Pricing page offers an optional Paddle sandbox checkout. Paddle’s
            checkout code is loaded when you select Preview checkout, not when
            you open the page. Paddle then receives connection metadata and any
            email, address or test payment details you enter in its checkout,
            under its own privacy and retention policies. Use test cards only.
            No PR contents or review reports are passed to Paddle.
          </p>
          <p className="mt-3">
            Sandbox checkout does not collect real payment or grant production Pro
            access. An account checkout stores only the account ID, transaction ID,
            subscription and customer IDs, environment, status and billing-period
            dates. Card and address details remain with Paddle. Browser callbacks
            never grant access. Paddle
            may retain sandbox records in the operator’s Paddle account and
            generate test subscription emails. The on-page completion message
            stays in page memory and clears on navigation or reload. See the{" "}
            <a href="https://www.paddle.com/legal/privacy" className="text-signal underline underline-offset-4" target="_blank" rel="noopener noreferrer">Paddle privacy policy</a>.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">Free review allowance</h2>
          <p>
            When you are signed out, the homepage stores a UTC date and completed-review count in your
            browser’s local storage to track 10 free reviews per day in that
            browser. This counter contains no PR URL, code, report or identity
            and is not sent to our server. It resets at 00:00 UTC; clearing site
            storage removes it. It is a device-local allowance, not an account
            quota. Browser storage must be available to submit through the
            homepage as a guest. For signed-in users, the server stores an opaque
            review reservation ID, UTC date, completion status and expiry against
            the account ID; it does not store the PR URL or report. This enforces
            one daily account allowance across devices. Server admission limits
            separately protect availability.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">Account retention and requests</h2>
          <p>Detailed usage records older than 31 days are removed when the account
            starts another review. Checkout association records and notification
            deduplication IDs older than 90 days are removed during billing event
            processing. Account and subscription records remain until an account
            deletion request is handled; provider retention and database backups
            follow their own policies. To request access, correction or deletion,
            contact founder@releaseengineer.tech from your account email. Cancel
            any active subscription through Manage subscription before requesting
            deletion; deletion alone does not cancel provider billing.</p>
          <p className="mt-3"><a href="https://clerk.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-signal underline underline-offset-4">Clerk privacy policy</a>{' · '}<a href="https://neon.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-signal underline underline-offset-4">Neon privacy policy</a></p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">MVP notice</h2>
          <p>
            This page describes the current beta application’s data handling. It
            is a brief product notice, not a custom legal assessment. We will
            update it if the product’s data handling changes.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-medium text-ink">Downloads and voluntary feedback</h2>
          <p>
            If you choose to download a report or verification record, your
            browser saves a file on your device. Verification notes are held
            in page memory; they are not sent to our server, saved in browser
            storage or included in operational logs. Reloading clears them.
            Downloads can contain public PR identifiers, report text or notes
            you entered. Review the file before sharing it.
          </p>
          <p className="mt-3">
            If you separately email feedback, your mail provider processes that
            message and the founder receives the material you chose to send.
            Agree permission and a retention period before a pilot record is
            retained. Publication of feedback, quotes or identity requires
            separate permission. Do not send secrets, private code or sensitive
            vulnerability details.
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
