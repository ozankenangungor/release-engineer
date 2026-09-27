"use client";
import dynamic from "next/dynamic";
import { Component, useCallback, useState, type ReactNode } from "react";
import { SceneFallback } from "./scene-fallback";
import { useSceneVisibility } from "./use-scene-visibility";
import { graphStages, type GraphPhase } from "./graph-topology";
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
  const [phase, setPhase] = useState<GraphPhase>("trace");
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
      data-phase={phase}
      role="group"
      aria-label="Conceptual release graph, not live telemetry"
    >
      <div className="scene-topline">
        <span>RELEASE / SIGNAL</span>
        <span className="scene-version">ILLUSTRATIVE TOPOLOGY</span>
      </div>
      <div className="scene-visual" aria-hidden="true">
        <div className="scene-ambient" />
        <SceneFallback phase={phase} />
        {eligible && !failed && (
          <SceneBoundary key={attempt} onFailure={onUnavailable}>
            <SceneCanvas
              active={active}
              phase={phase}
              onReady={onReady}
              onUnavailable={onUnavailable}
            />
          </SceneBoundary>
        )}
      </div>
      <div className="scene-source-note">
        <p className="scene-note-label">ILLUSTRATIVE CHANGE</p>
        <h3>A response changes.</h3>
        <code>
          Release[] <span aria-hidden="true">→</span>
          <br />
          {"{ items: Release[] }"}
        </code>
      </div>
      <div className="scene-review-note">
        <p className="scene-note-label">REVIEW THE CONSEQUENCE</p>
        <h3>
          {phase === "source"
            ? "Inspect the changed shape."
            : phase === "trace"
              ? "Follow affected paths."
              : "Verify affected callers."}
        </h3>
        <p>
          {phase === "source"
            ? "The response wraps an array in an object."
            : phase === "trace"
              ? "Caller code beyond this patch has not been inspected."
              : "Potential contract break. Human verification required."}
        </p>
      </div>
      <div
        className="scene-chapters"
        role="group"
        aria-label="Explore the release graph"
      >
        {graphStages.map((stage, index) => (
          <button
            type="button"
            key={stage.id}
            aria-pressed={phase === stage.id}
            aria-describedby="scene-phase-description"
            onClick={() => setPhase(stage.id)}
          >
            <span aria-hidden="true">0{index + 1}</span>
            {stage.label}
            <span aria-hidden="true">↗︎</span>
          </button>
        ))}
      </div>
      <p
        className="scene-phase-description"
        id="scene-phase-description"
        aria-live="polite"
      >
        {graphStages.find((stage) => stage.id === phase)?.description}
      </p>
      <a className="scene-signal-link" href="#report-preview">
        <span className="signal-link-dot" aria-hidden="true" />
        Explore an illustrative finding <span aria-hidden="true">↗︎</span>
      </a>
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
