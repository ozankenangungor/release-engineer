"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { SceneFallback } from "./scene-fallback";

const SceneCanvas = dynamic(() => import("./scene-canvas"), {
  ssr: false,
  loading: () => null,
});

class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function ReleaseIntelligenceScene() {
  const container = useRef<HTMLDivElement>(null);
  const [eligible, setEligible] = useState(false);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const queries = [
      matchMedia("(min-width: 1024px) and (pointer: fine)"),
      matchMedia("(prefers-reduced-motion: reduce)"),
      matchMedia("(forced-colors: active)"),
    ];
    let visible = false;
    let capability: boolean | undefined;
    let deferred: ReturnType<typeof setTimeout> | undefined;
    function update() {
      clearTimeout(deferred);
      const allowed =
        queries[0]!.matches && !queries[1]!.matches && !queries[2]!.matches;
      setActive(allowed && visible && document.visibilityState === "visible");
      if (!allowed) {
        setEligible(false);
        setReady(false);
        return;
      }
      // Defer GPU work until the form has hydrated; never gate product usability.
      deferred = setTimeout(() => {
        if (!visible || document.visibilityState !== "visible") return;
        if (capability === undefined) {
          try {
            const canvas = document.createElement("canvas");
            const gl = canvas.getContext("webgl2", {
              failIfMajorPerformanceCaveat: true,
            });
            capability = !!gl;
            gl?.getExtension("WEBGL_lose_context")?.loseContext();
          } catch {
            capability = false;
          }
        }
        setEligible(capability);
      }, 650);
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      update();
    });
    if (container.current) observer.observe(container.current);
    queries.forEach((query) => query.addEventListener("change", update));
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      clearTimeout(deferred);
      observer.disconnect();
      queries.forEach((query) => query.removeEventListener("change", update));
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <div
      ref={container}
      className={`intelligence-scene ${ready && eligible && !failed ? "scene-ready" : ""}`}
      aria-hidden="true"
      data-scene={failed ? "fallback" : ready && eligible ? "webgl" : "static"}
    >
      <div className="scene-ambient" />
      <SceneFallback />
      {eligible && !failed && (
        <SceneBoundary onFailure={() => setFailed(true)}>
          <SceneCanvas
            active={active}
            onReady={() => setReady(true)}
            onUnavailable={() => setFailed(true)}
          />
        </SceneBoundary>
      )}
      <div className="scene-caption">
        <span>RELEASE INTELLIGENCE CORE</span>
        <span>CONCEPTUAL PIPELINE</span>
      </div>
    </div>
  );
}
