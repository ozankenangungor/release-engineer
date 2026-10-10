"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { NeutralToneMapping, Vector3 } from "three";
import { ReleaseGraph } from "./release-graph-scene";
import { SceneLights } from "./scene-lights";
import type { GraphPhase } from "./graph-topology";

function ContextGuard({ onUnavailable }: { onUnavailable: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onUnavailable();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onUnavailable]);
  return null;
}

export default function SceneCanvas({
  active,
  phase,
  onReady,
  onUnavailable,
}: {
  active: boolean;
  phase: GraphPhase;
  onReady: () => void;
  onUnavailable: () => void;
}) {
  return (
    <div className="scene-webgl">
      <Canvas
        aria-hidden="true"
        tabIndex={-1}
        dpr={[1, 1.5]}
        frameloop="demand"
        camera={{ position: [5.8, 5.3, 10.5], fov: 36, near: 0.1, far: 50 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: true,
          toneMapping: NeutralToneMapping,
        }}
        onCreated={({ camera }) => camera.lookAt(new Vector3(0, 0.2, 0))}
        fallback={null}
      >
        <SceneLights />
        <ReleaseGraph active={active} phase={phase} onReady={onReady} />
        <ContextGuard onUnavailable={onUnavailable} />
      </Canvas>
    </div>
  );
}
