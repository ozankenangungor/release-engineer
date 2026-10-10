import type { Metadata } from "next";
import Link from "next/link";
import { testimonials } from "@/content/testimonials";
import "./feedback.css";

const title = "Developer feedback — Release Engineer";
const description =
  "In developers’ own words: feedback on using Release Engineer for a structured second perspective on public GitHub pull requests.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/feedback" },
  openGraph: { title, description, url: "/feedback", type: "website" },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};

export default function Feedback() {
  const approvedFeedback = testimonials.filter(
    (item) => item.permission === "approved",
  );

  return (
    <main id="main" className="feedback-page">
      <section className="feedback-hero" aria-labelledby="feedback-page-title">
        <div>
          <p className="section-kicker">
            <span className="feedback-signal" aria-hidden="true" />
            RELEASE ENGINEER / DEVELOPER FEEDBACK
          </p>
          <h1 id="feedback-page-title">
            Useful review.
            <br />
            <span>In developers’ words.</span>
          </h1>
        </div>
        <div className="feedback-hero-context">
          <p>
            A second perspective before the merge. Hear from developers who
            tried Release Engineer on public pull requests.
          </p>
          <a className="text-link" href="#perspectives">
            Read their feedback <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      {approvedFeedback.length > 0 && (
        <section
          id="perspectives"
          className="developer-perspectives"
          aria-labelledby="perspectives-title"
        >
          <div className="feedback-section-heading">
            <h2 id="perspectives-title">Developer perspectives</h2>
            <span>IN THEIR OWN WORDS</span>
          </div>
          <div className="feedback-review-grid">
            {approvedFeedback.map((item, index) => (
              <figure
                className={`feedback-review-card${index === 0 ? " feedback-review-featured" : ""}`}
                key={item.id}
              >
                <div className="feedback-card-heading" aria-hidden="true">
                  <span className="feedback-open-quote">“</span>
                  <span className="feedback-source">PUBLIC PR REVIEW</span>
                </div>
                <blockquote>
                  <p>{item.quote}</p>
                </blockquote>
                <figcaption className="feedback-card-author">
                  <span className="feedback-author-monogram" aria-hidden="true">
                    {(item.role ?? item.displayName)
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="feedback-author-name">{item.displayName}</p>
                    {item.role && (
                      <p className="feedback-author-role">{item.role}</p>
                    )}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="feedback-publication-note">
            <p>
              Quotes published with permission, using approved display aliases.
            </p>
            <Link className="text-link" href="/evidence#developer-feedback">
              Feedback provenance <span aria-hidden="true">↗︎</span>
            </Link>
          </div>
        </section>
      )}

      <section className="feedback-invitation" aria-labelledby="feedback-invitation-title">
        <div>
          <p className="section-kicker">YOUR NEXT PULL REQUEST</p>
          <h2 id="feedback-invitation-title">
            Try it on your change.
            <br />
            Tell us what helped.
          </h2>
          <p>
            Bring a public GitHub PR. Get a structured review, check the evidence
            and share your experience.
          </p>
        </div>
        <div className="feedback-invitation-actions">
          <Link className="feedback-primary-action" href="/#analyze">
            Analyze a public PR <span aria-hidden="true">↗︎</span>
          </Link>
          <a
            className="feedback-share-action"
            href="mailto:founder@releaseengineer.tech?subject=Release%20Engineer%20feedback"
          >
            Share your feedback <span aria-hidden="true">↗︎</span>
          </a>
          <span className="feedback-access-note">Public PRs · No account required</span>
        </div>
      </section>
    </main>
  );
}
