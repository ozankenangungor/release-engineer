import Link from "next/link";
import { MobileNavigation } from "./mobile-navigation";

// Source branches cross a release boundary and resolve into one signal.
export function ReleaseMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7h5l6 9-6 9H5M16 16h11M21 7v18"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="square"
      />
      <path d="M25 13l3 3-3 3" stroke="currentColor" strokeWidth="2.8" />
    </svg>
  );
}
export function Brand() {
  return (
    <Link href="/" aria-label="Release Engineer home" className="brand-link">
      <span className="brand-symbol">
        <ReleaseMark />
      </span>
      <span>
        Release<span className="brand-engineer">Engineer</span>
      </span>
    </Link>
  );
}
const navigation = [
  { href: "/#report-preview", label: "Product" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/evidence", label: "Evidence" },
  { href: "/about", label: "About" },
];
export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav aria-label="Main" className="header-navigation">
          {navigation.map((item) => (
            <Link className="nav-link" key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <a
            className="nav-link"
            href="https://github.com/ozankenangungor/release-engineer"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub <span aria-hidden="true">↗︎</span>
          </a>
        </nav>
        <Link href="/#analyze" className="header-action">
          Analyze a PR <span aria-hidden="true">↗︎</span>
        </Link>
        <MobileNavigation items={navigation} />
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Brand />
          <p>A clearer view of what you ship.</p>
          <span className="footer-origin">
            Independent early beta · Ankara, Türkiye
          </span>
        </div>
        <nav aria-label="Footer" className="footer-navigation">
          <div>
            <p className="footer-label">PRODUCT</p>
            <Link href="/#report-preview">Product</Link>
            <Link href="/evidence">Evidence</Link>
            <Link href="/about">About</Link>
          </div>
          <div>
            <p className="footer-label">OPEN SOURCE</p>
            <a
              href="https://github.com/ozankenangungor/release-engineer"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗︎
            </a>
            <a
              href="https://github.com/ozankenangungor/release-engineer/blob/main/SECURITY.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Security
            </a>
            <a href="mailto:founder@releaseengineer.tech">Contact</a>
          </div>
          <div>
            <p className="footer-label">THE DETAILS</p>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/about#beta">Beta feedback</Link>
          </div>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Ozan Kenan Güngör</span>
        <span>
          Human judgment stays in the loop.
          <span className="footer-signal" aria-hidden="true">
            {" "}
            →
          </span>
        </span>
      </div>
    </footer>
  );
}
