import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="page-shell">
      <p className="section-kicker">RELEASE ENGINEER / 404</p>
      <h1 className="page-title">Page not available.</h1>
      <p className="page-intro">
        This page has not been published or could not be found.
      </p>
      <Link href="/" className="secondary-action">
        Return to the product →
      </Link>
    </main>
  );
}
