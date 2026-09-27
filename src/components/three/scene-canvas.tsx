"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { NeutralToneMapping, PerspectiveCamera, Vector3 } from "three";
import { ReleaseGraph } from "./release-graph-scene";
import { SceneLights } from "./scene-lights";
import { graphNodes, type GraphPhase } from "./graph-topology";

// Fit the authored topology on resize. A fixed camera made the graph shrink
// within wide stages because its projected size only followed canvas height.
function GraphFraming() {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera) || !size.width || !size.height)
      return;
    const direction = new Vector3(0.4, 3.4, 12).normalize();
    camera.position.copy(direction);
    camera.lookAt(new Vector3());
    const viewRotation = camera.quaternion.clone().invert();
    const vertical = Math.tan((camera.fov * Math.PI) / 360) * 0.94;
    const horizontal = (vertical * size.width) / size.height;
    const points = [
      ...graphNodes,
      [-2.6, -0.3, -2.8],
      [2.1, -0.3, -2.8],
      [2.1, -0.3, 2.8],
      [-2.6, -0.3, 2.8],
    ];
    let left = -Infinity,
      right = -Infinity,
      top = -Infinity,
      bottom = -Infinity;
    for (const [x, y, z] of points) {
      const point = new Vector3(x, y, z).applyQuaternion(viewRotation);
      // Reserve room for hubs and the small pointer rotation, then center
      // the perspective bounds rather than framing an empty bounding volume.
      right = Math.max(right, (point.x + 0.4) / horizontal + point.z);
      left = Math.max(left, (-point.x + 0.4) / horizontal + point.z);
      top = Math.max(top, (point.y + 0.3) / vertical + point.z);
      bottom = Math.max(bottom, (-point.y + 0.3) / vertical + point.z);
    }
    const target = new Vector3(
      ((right - left) * horizontal) / 2,
      ((top - bottom) * vertical) / 2,
      0,
    ).applyQuaternion(camera.quaternion);
    const distance = Math.max((right + left) / 2, (top + bottom) / 2);
    camera.position.copy(target).addScaledVector(direction, distance);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);
  return null;
}

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
        camera={{ position: [0.4, 4.3, 12], fov: 25, near: 0.1, far: 50 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: true,
          toneMapping: NeutralToneMapping,
        }}
        onCreated={({ camera }) => camera.lookAt(new Vector3(0, 0.9, 0))}
        fallback={null}
      >
        <SceneLights />
        <GraphFraming />
        <ReleaseGraph active={active} phase={phase} onReady={onReady} />
        <ContextGuard onUnavailable={onUnavailable} />
      </Canvas>
    </div>
  );
}
