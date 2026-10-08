import { testimonials } from "@/content/testimonials";

export function Testimonials() {
  const approved = testimonials.filter(
    (item) => item.permission === "approved",
  );
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
          <p className="section-kicker">FROM THE EARLY BETA</p>
          <h2 id="feedback-title">Early developer feedback.</h2>
        </div>
        <p>
          Qualitative feedback from developers who tried the early beta on
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
                <p className="quote-attribution">External beta tester</p>
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
        Published with permission, using approved display names. Informal
        feedback is not a measure of accuracy or a verified case study.
      </p>
    </section>
  );
}
