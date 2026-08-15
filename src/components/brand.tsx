import Link from "next/link";

export function ReleaseMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 4v10a4 4 0 0 0 4 4h6M7 9h8a3 3 0 0 0 3-3V4" />
      <circle cx="7" cy="4" r="2" />
      <circle cx="18" cy="4" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

export function Brand() {
  return (
    <Link
      href="/"
      aria-label="Release Engineer home"
      className="brand-link inline-flex items-center gap-3 text-sm font-semibold tracking-tight text-white"
    >
      <span
        aria-hidden="true"
        className="brand-symbol flex size-10 shrink-0 items-center justify-center rounded-xl text-emerald-200"
      >
        <ReleaseMark className="size-5" />
      </span>
      Release Engineer
    </Link>
  );
}

export function Header() {
  return (
    <header className="site-header flex w-full items-center justify-between gap-3 py-5 sm:py-6">
      <Brand />
      <nav
        aria-label="Main"
        className="flex shrink-0 items-center gap-6 text-xs text-slate-300 sm:gap-8"
      >
        <Link href="/about" className="nav-link hidden sm:block">
          About
        </Link>
        <Link href="/evidence" className="nav-link hidden md:block">
          Evidence
        </Link>
        <a
          href="https://github.com/ozankenangungor/release-engineer"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link hidden md:block"
        >
          Source <span aria-hidden="true">↗︎</span>
        </a>
        <span className="beta-badge inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 font-mono text-[9px] tracking-wide text-emerald-200 sm:px-3 sm:text-[10px]">
          <span
            aria-hidden="true"
            className="size-1 rounded-full bg-emerald-300"
          />
          EARLY BETA
        </span>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer flex w-full flex-col justify-between gap-8 py-10 text-xs text-slate-400 lg:flex-row lg:items-start">
      <div>
        <Brand />
        <p className="mt-3 leading-6">A second perspective before you ship.</p>
        <p className="mt-2 font-mono text-[9px] text-slate-400">
          ANKARA, TÜRKİYE · BOOTSTRAPPED · EARLY BETA
        </p>
      </div>
      <nav
        aria-label="Footer"
        className="grid grid-cols-3 gap-x-7 gap-y-4 sm:gap-x-14"
      >
        <div className="flex flex-col gap-3">
          <p className="footer-label">PRODUCT</p>
          <Link className="transition hover:text-white" href="/about">
            About
          </Link>
          <Link className="transition hover:text-white" href="/evidence">
            Evidence
          </Link>
          <a
            className="transition hover:text-white"
            href="mailto:founder@releaseengineer.tech"
          >
            Contact
          </a>
        </div>
        <div className="flex flex-col gap-3">
          <p className="footer-label">SOURCE</p>
          <a
            className="transition hover:text-white"
            href="https://github.com/ozankenangungor/release-engineer"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            className="transition hover:text-white"
            href="https://github.com/ozankenangungor/release-engineer/blob/main/SECURITY.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Security
          </a>
        </div>
        <div className="flex flex-col gap-3">
          <p className="footer-label">LEGAL</p>
          <Link className="transition hover:text-white" href="/privacy">
            Privacy
          </Link>
          <Link className="transition hover:text-white" href="/terms">
            Terms
          </Link>
        </div>
      </nav>
    </footer>
  );
}
