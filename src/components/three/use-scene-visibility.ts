"use client";

import { useEffect, useRef, useState } from "react";

export function useSceneVisibility(paused: boolean) {
  const container = useRef<HTMLDivElement>(null);
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(false);
  useEffect(() => {
    const desktop = matchMedia("(min-width: 1024px) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const colors = matchMedia("(forced-colors: active)");
    let inView = false;
    let capability: boolean | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function update() {
      clearTimeout(timer);
      const allowed = !reduced.matches && !colors.matches;
      const shown = inView && document.visibilityState === "visible";
      setMotionAllowed(allowed);
      setVisible(shown);
      if (!allowed || !desktop.matches) {
        setEligible(false);
        return;
      }
      // The form and copy paint first. Mobile never requests the renderer.
      timer = setTimeout(() => {
        if (!shown) return;
        if (capability === undefined) {
          try {
            const probe = document.createElement("canvas");
            const gl = probe.getContext("webgl2", {
              failIfMajorPerformanceCaveat: true,
            });
            capability = Boolean(gl);
            gl?.getExtension("WEBGL_lose_context")?.loseContext();
          } catch {
            capability = false;
          }
        }
        setEligible(capability);
      }, 650);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? false;
        update();
      },
      { threshold: 0.05 },
    );
    if (container.current) observer.observe(container.current);
    [desktop, reduced, colors].forEach((query) =>
      query.addEventListener("change", update),
    );
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      [desktop, reduced, colors].forEach((query) =>
        query.removeEventListener("change", update),
      );
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return {
    container,
    eligible,
    motionAllowed,
    active: visible && motionAllowed && !paused,
  };
}
