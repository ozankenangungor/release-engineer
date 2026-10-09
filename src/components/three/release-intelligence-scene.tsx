"use client";
import dynamic from "next/dynamic";
import { Component, useCallback, useState, type ReactNode } from "react";
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
  const [attempt, setAttempt] = useState(0);
  const { container, eligible, active, motionAllowed } = useSceneVisibility(
    paused,
    true,
  );
  const onReady = useCallback(() => {
    performance.mark("release-graph-ready");
    setReady(true);
  }, []);
  const onUnavailable = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);
  return (
    <div
      ref={container}
      className={`hero-stage intelligence-scene ${ready && eligible && !failed ? "scene-ready" : ""}`}
      data-scene={failed ? "fallback" : ready && eligible ? "webgl" : "static"}
      data-motion-active={eligible && ready && active && !failed}
      role="group"
      aria-label="Conceptual release graph, not live telemetry"
    >
      <div className="scene-topline">
        <span>RELEASE / SIGNAL</span>
        <span className="scene-version">CONCEPT 01</span>
      </div>
      <p className="scene-intro">
        The Release Graph<span>Follow the change. Trace the consequence.</span>
      </p>
      <div className="scene-visual" aria-hidden="true">
        <div className="scene-ambient" />
        <SceneFallback />
        {eligible && !failed && (
          <SceneBoundary key={attempt} onFailure={onUnavailable}>
            <SceneCanvas
              active={active}
              onReady={onReady}
              onUnavailable={onUnavailable}
            />
          </SceneBoundary>
        )}
        <div className="graph-label graph-label-source">
          <span>01 / SOURCE</span>Changes enter
        </div>
        <div className="graph-label graph-label-engine">
          <span>02 / TRACE</span>Relationships matter
        </div>
        <div className="graph-label graph-label-risk">
          <span>03 / SIGNAL</span>Risks surface
          <span className="graph-risk-line" />
        </div>
      </div>
      <div className="scene-bottomline">
        <span>
          <i />
          Stable path
        </span>
        <span>
          <i />
          Potential risk
        </span>
      </div>
      <p className="scene-caption">
        Conceptual visualization · No live telemetry
      </p>
      {ready && motionAllowed && !failed && (
        <button
          className="scene-motion-control"
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
          {paused ? "Play animation" : "Pause animation"}
        </button>
      )}
      {failed && eligible && (
        <button
          className="scene-motion-control"
          type="button"
          onClick={() => {
            setFailed(false);
            setReady(false);
            setAttempt((value) => value + 1);
          }}
        >
          Retry visualization ↗︎
        </button>
      )}
    </div>
  );
}
