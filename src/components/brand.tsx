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
        className="flex size-8 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-300/10 text-emerald-300"
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
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
      <Brand />
      <span className="font-mono text-[10px] tracking-widest text-slate-400 sm:text-xs">
        PUBLIC GITHUB PRS{" "}
        <span className="ml-2 rounded border border-white/10 px-1.5 py-1 text-slate-300">
          BETA
        </span>
      </span>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-4 border-t border-white/8 px-5 py-7 text-xs text-slate-400 sm:flex-row sm:px-8">
      <p>Release Engineer · A second perspective before you ship.</p>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3">
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
      </nav>
    </footer>
  );
}
