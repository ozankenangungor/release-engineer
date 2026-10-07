"use client";

import dynamic from "next/dynamic";
import { Component, useState, type ReactNode } from "react";
import { SceneFallback } from "./scene-fallback";
import { useSceneVisibility } from "./use-scene-visibility";

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
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const { container, eligible, active, motionAllowed } =
    useSceneVisibility(paused);
  return (
    <div
      ref={container}
      className={`intelligence-scene ${ready && eligible && !failed ? "scene-ready" : ""}`}
      data-scene={failed ? "fallback" : ready && eligible ? "webgl" : "static"}
      data-motion-active={active}
    >
      <div className="scene-visual" aria-hidden="true">
        <div className="scene-ambient" />
        <div className="scene-coordinate scene-coordinate-top">
          RE / RELEASE INTELLIGENCE REACTOR
        </div>
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
        <div className="scene-label scene-label-input">
          <span>01 / INPUT</span>Public PR changes
        </div>
        <div className="scene-label scene-label-context">
          <span>02 / CONTEXT</span>Bounded selection
        </div>
        <div className="scene-label scene-label-core">
          <span>03 / REASONING</span>Claude at the core
        </div>
        <div className="scene-label scene-label-output">
          <span>04 / OUTPUT</span>Structured review
        </div>
        <div className="scene-caption">
          CONCEPTUAL PIPELINE · NO LIVE TELEMETRY
        </div>
      </div>
      {motionAllowed && (
        <button
          className="scene-motion-control"
          type="button"
          onClick={() => setPaused((value) => !value)}
        >
          <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
          {paused ? "Play animation" : "Pause animation"}
        </button>
      )}
    </div>
  );
}
