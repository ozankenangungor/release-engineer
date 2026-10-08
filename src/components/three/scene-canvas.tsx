"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Vector3 } from "three";
import { ReleaseReactor } from "./release-reactor-scene";
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
        camera={{ position: [6.8, 5.6, 10.5], fov: 33, near: 0.1, far: 40 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: true,
        }}
        onCreated={({ camera }) => camera.lookAt(new Vector3(0, 0.65, 0))}
        fallback={null}
      >
        <SceneLights />
        <ReleaseReactor active={active} onReady={onReady} />
        <ContextGuard onUnavailable={onUnavailable} />
      </Canvas>
    </div>
  );
}
