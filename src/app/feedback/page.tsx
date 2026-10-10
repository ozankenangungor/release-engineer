import type { Metadata } from "next";
import Link from "next/link";
import { ReleaseMark } from "@/components/brand";
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
  const [featured, ...perspectives] = testimonials.filter(
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

      {featured && (
        <section
          id="perspectives"
          className="developer-perspectives"
          aria-labelledby="perspectives-title"
        >
          <div className="feedback-section-heading">
            <h2 id="perspectives-title">Developer perspectives</h2>
            <span>IN THEIR OWN WORDS</span>
          </div>
          <figure className="feedback-feature">
            <figcaption className="feedback-feature-author">
              <span className="feedback-wordmark" aria-hidden="true">
                <ReleaseMark />
              </span>
              <div>
                <p className="feedback-author-role">{featured.role}</p>
                <p className="feedback-author-name">{featured.displayName}</p>
              </div>
              <span className="feedback-source">PUBLIC PR REVIEW</span>
            </figcaption>
            <div className="feedback-feature-quote">
              <span className="feedback-open-quote" aria-hidden="true">“</span>
              <blockquote>
                <p>{featured.quote}</p>
              </blockquote>
            </div>
          </figure>

          <div className="feedback-perspective-list">
            {perspectives.map((item, index) => (
              <figure className="feedback-perspective" key={item.id}>
                <figcaption>
                  <span className="feedback-perspective-index" aria-hidden="true">
                    {String(index + 2).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="feedback-author-role">{item.role}</p>
                    <p className="feedback-author-name">{item.displayName}</p>
                  </div>
                </figcaption>
                <blockquote>
                  <p>“{item.quote}”</p>
                </blockquote>
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
