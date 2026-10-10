"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
export function MobileNavigation({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function dismiss(event: KeyboardEvent) {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    }
    function outside(event: PointerEvent) {
      if (menu.current?.open && !menu.current.contains(event.target as Node))
        menu.current.open = false;
    }
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  return (
    <details className="mobile-menu" ref={menu}>
      <summary aria-label="Toggle navigation">
        <span>Menu</span>
        <span className="menu-icon" aria-hidden="true">
          <i />
          <i />
        </span>
      </summary>
      <nav
        aria-label="Mobile"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a") && menu.current)
            menu.current.open = false;
        }}
      >
        {items.map((item, index) => (
          <Link key={item.href} href={item.href}>
            <span className="menu-index" aria-hidden="true">
              0{index + 1}
            </span>
            {item.label}
            <span aria-hidden="true">↗︎</span>
          </Link>
        ))}
        <a
          href="https://github.com/ozankenangungor/release-engineer"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="menu-index" aria-hidden="true">
            {String(items.length + 1).padStart(2, "0")}
          </span>
          GitHub<span aria-hidden="true">↗︎</span>
        </a>
        <Link href="/#analyze" className="mobile-analyze">
          Analyze a public PR →
        </Link>
      </nav>
    </details>
  );
}
