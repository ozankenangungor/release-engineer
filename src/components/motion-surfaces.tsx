"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Content is always visible in the server HTML. Enhance it only as it enters
// the viewport, with no dependency on animation for access to the product.
export function MotionSurfaces({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const colors = matchMedia("(forced-colors: active)");
    const seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          if (motion.matches || colors.matches) return;
          const animation = entry.target.animate(
            [
              { opacity: 0.55, transform: "translateY(22px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 750,
              delay: Number(entry.target.getAttribute("data-reveal") || 0),
              easing: "cubic-bezier(.2,.75,.25,1)",
            },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        });
      },
      { threshold: 0.08 },
    );
    function collect() {
      root.current?.querySelectorAll("[data-reveal]").forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        observer.observe(element);
      });
    }
    function preferences() {
      if (motion.matches || colors.matches) {
        animations.forEach((animation) => animation.cancel());
        animations.clear();
      }
    }
    collect();
    // Reports enter after submission, and receive the same reveal treatment.
    const mutations = new MutationObserver(collect);
    if (root.current)
      mutations.observe(root.current, { childList: true, subtree: true });
    motion.addEventListener("change", preferences);
    colors.addEventListener("change", preferences);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      animations.forEach((animation) => animation.cancel());
      motion.removeEventListener("change", preferences);
      colors.removeEventListener("change", preferences);
    };
  }, []);
  return (
    <div ref={root} className="motion-surfaces">
      {children}
    </div>
  );
}
