import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/"
      aria-label="Release Engineer home"
      className="inline-flex items-center gap-3 text-sm font-semibold tracking-tight text-white"
    >
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/25 bg-linear-to-b from-emerald-300/15 to-emerald-300/5 text-emerald-200 shadow-[inset_0_1px_0_#ffffff0a]"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 4v10a4 4 0 0 0 4 4h6M7 9h8a3 3 0 0 0 3-3V4" />
          <circle cx="7" cy="4" r="2" />
          <circle cx="18" cy="4" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      </span>
      Release Engineer
    </Link>
  );
}

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 border-b border-white/8 px-5 py-5 sm:px-8">
      <Brand />
      <nav aria-label="Main" className="flex shrink-0 items-center gap-6 text-xs text-slate-400">
        <Link href="/about" className="hidden transition hover:text-white sm:block">About</Link>
        <a href="https://github.com/ozankenangungor/release-engineer" target="_blank" rel="noopener noreferrer" className="hidden transition hover:text-white md:block">
          Source <span aria-hidden="true">↗</span>
        </a>
        <span className="rounded-full border border-emerald-300/15 bg-emerald-300/5 px-3 py-1.5 font-mono text-[10px] tracking-wide text-emerald-200">
          EARLY BETA
        </span>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-8 border-t border-white/10 px-5 py-9 text-xs text-slate-400 sm:px-8 lg:flex-row lg:items-center">
      <div>
        <Brand />
        <p className="mt-3 leading-6">A second perspective before you ship.</p>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-4">
        <Link className="transition hover:text-white" href="/about">
          About
        </Link>
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
          href="mailto:founder@releaseengineer.tech"
        >
          Contact
        </a>
        <Link className="transition hover:text-white" href="/privacy">
          Privacy
        </Link>
        <Link className="transition hover:text-white" href="/terms">
          Terms
        </Link>
        <a
          className="transition hover:text-white"
          href="https://github.com/ozankenangungor/release-engineer/blob/main/SECURITY.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          Security
        </a>
      </nav>
    </footer>
  );
}
