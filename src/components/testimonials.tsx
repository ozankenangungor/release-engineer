import Link from "next/link";
import { testimonials } from "@/content/testimonials";

export function Testimonials() {
  const approved = testimonials.filter(
    (item) => item.permission === "approved",
  ).slice(0, 3);
  if (!approved.length) return null;
  return (
    <section
      id="developer-feedback"
      aria-labelledby="feedback-title"
      className="feedback-section section-stage"
      data-reveal="0"
    >
      <div className="section-heading">
        <div>
          <p className="section-kicker">DEVELOPER PERSPECTIVES</p>
          <h2 id="feedback-title">Developer feedback.</h2>
        </div>
        <p>
          A selection of feedback from developers who tried Release Engineer on
          public pull requests.
        </p>
      </div>
      <div className="quote-grid">
        {approved.map((item, index) => (
          <figure
            className={`quote-card ${index === 0 ? "quote-featured" : ""}`}
            key={item.id}
            data-reveal={String(index * 100)}
          >
            <span className="quote-mark" aria-hidden="true">
              “
            </span>
            <blockquote>
              <p>{item.quote}</p>
            </blockquote>
            <figcaption>
              <span className="quote-avatar" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="quote-name">{item.displayName}</p>
                <p className="quote-role">
                  {[item.role, item.organization].filter(Boolean).join(" · ")}
                </p>
                <p className="quote-attribution">
                  {item.attribution === "external-beta"
                    ? "External beta tester"
                    : "Developer feedback"}
                </p>
              </div>
            </figcaption>
            {item.publicPrUrl && (
              <a
                href={item.publicPrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                {item.publicPrLabel ?? "Public pull request"} ↗︎
              </a>
            )}
          </figure>
        ))}
      </div>
      <p className="evidence-note">
        Exact quotes published with permission. Names, aliases and roles are
        publication-approved; contact details and PR links are not disclosed.
        Informal feedback is not a measure of accuracy or a verified case study.
      </p>
      <Link className="text-link mt-4 inline-block" href="/feedback">
        Read all developer feedback →
      </Link>
    </section>
  );
}
