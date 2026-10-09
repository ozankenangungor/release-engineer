"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Vector3 } from "three";
import { ReleaseGraph } from "./release-graph-scene";
import { SceneLights } from "./scene-lights";

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
  onReady,
  onUnavailable,
}: {
  active: boolean;
  onReady: () => void;
  onUnavailable: () => void;
}) {
  return (
    <div className="scene-webgl">
      <Canvas
        aria-hidden="true"
        tabIndex={-1}
        dpr={[1, 1.5]}
        frameloop={active ? "demand" : "never"}
        camera={{ position: [4.6, 3.1, 11.4], fov: 43, near: 0.1, far: 40 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: true,
        }}
        onCreated={({ camera }) => camera.lookAt(new Vector3(0, 0, 0))}
        fallback={null}
      >
        <SceneLights />
        <ReleaseGraph active={active} onReady={onReady} />
        <ContextGuard onUnavailable={onUnavailable} />
      </Canvas>
    </div>
  );
}
