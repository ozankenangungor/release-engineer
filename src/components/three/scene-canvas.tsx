"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  Shape,
  Vector3,
} from "three";

type Point = [number, number, number];
const paths: Point[][] = [
  [
    [-4, -0.05, -0.75],
    [-3.2, -0.05, -0.75],
    [-2.5, -0.05, 0],
    [-0.9, -0.05, 0],
  ],
  [
    [-4.1, -0.05, 0.45],
    [-3, -0.05, 0.45],
    [-2.5, -0.05, 0],
  ],
  [
    [-3.4, -0.05, 1.2],
    [-2.7, -0.05, 1.2],
    [-2, -0.05, 0.45],
    [-0.9, -0.05, 0.45],
  ],
  [
    [0.9, -0.05, 0],
    [2.1, -0.05, 0],
    [2.7, -0.05, -0.85],
    [3.8, -0.05, -0.85],
  ],
  [
    [1, -0.05, 0.4],
    [2.4, -0.05, 0.4],
    [3.1, -0.05, 0.7],
    [4, -0.05, 0.7],
  ],
];

function Circuit() {
  const geometry = useMemo(() => {
    const points = paths.flatMap((path) =>
      path.slice(1).flatMap((point, index) => [...path[index]!, ...point]),
    );
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
    return geometry;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#8bbfae" transparent opacity={0.55} />
    </lineSegments>
  );
}

function Layer({
  y,
  width,
  depth,
  glass = false,
}: {
  y: number;
  width: number;
  depth: number;
  glass?: boolean;
}) {
  const edges = useMemo(() => {
    const box = new BoxGeometry(width, 0.055, depth);
    const result = new EdgesGeometry(box);
    box.dispose();
    return result;
  }, [width, depth]);
  useEffect(() => () => edges.dispose(), [edges]);
  return (
    <group position={[0, y, 0]}>
      <mesh>
        <boxGeometry args={[width, 0.055, depth]} />
        <meshStandardMaterial
          color={glass ? "#71ae97" : "#142c2c"}
          metalness={glass ? 0.25 : 0.8}
          roughness={glass ? 0.25 : 0.36}
          transparent={glass}
          opacity={glass ? 0.15 : 1}
          depthWrite={!glass}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial
          color={glass ? "#aadac6" : "#75a292"}
          transparent
          opacity={glass ? 0.42 : 0.8}
        />
      </lineSegments>
    </group>
  );
}

function OutputPlane({
  position,
  amber = false,
}: {
  position: Point;
  amber?: boolean;
}) {
  return (
    <group position={position} rotation={[0, -0.15, 0]}>
      <mesh>
        <boxGeometry args={[0.75, 1.05, 0.025]} />
        <meshStandardMaterial
          color="#538b7e"
          transparent
          opacity={0.23}
          metalness={0.4}
          roughness={0.25}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-0.25, 0.32, 0.024]}>
        <boxGeometry args={[0.055, 0.055, 0.025]} />
        <meshBasicMaterial color={amber ? "#e9c88f" : "#b3ead4"} />
      </mesh>
      {[0.3, 0.04, -0.12, -0.28].map((y, i) => (
        <mesh key={y} position={[i === 0 ? 0.03 : -0.015, y, 0.025]}>
          <boxGeometry
            args={[i === 0 ? 0.36 : 0.48 - i * 0.05, 0.016, 0.016]}
          />
          <meshBasicMaterial
            color="#c5d8d1"
            transparent
            opacity={i === 0 ? 0.75 : 0.38}
          />
        </mesh>
      ))}
    </group>
  );
}

function ReasoningCore() {
  const geometry = useMemo(() => {
    const shape = new Shape();
    const x = 0.88,
      y = 0.62,
      r = 0.13;
    shape.moveTo(-x + r, -y);
    shape.lineTo(x - r, -y);
    shape.quadraticCurveTo(x, -y, x, -y + r);
    shape.lineTo(x, y - r);
    shape.quadraticCurveTo(x, y, x - r, y);
    shape.lineTo(-x + r, y);
    shape.quadraticCurveTo(-x, y, -x, y - r);
    shape.lineTo(-x, -y + r);
    shape.quadraticCurveTo(-x, -y, -x + r, -y);
    return new ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.035,
      bevelThickness: 0.03,
      curveSegments: 5,
      steps: 1,
    });
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group>
      {[0.1, 0.3, 0.5].map((y, i) => (
        <mesh
          key={y}
          geometry={geometry}
          position={[0, y, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color={i === 2 ? "#b5dfc8" : "#234b43"}
            metalness={i === 2 ? 0.35 : 0.7}
            roughness={i === 2 ? 0.28 : 0.35}
            emissive={i === 2 ? "#56886a" : "#103328"}
            emissiveIntensity={0.12}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.69, 0]}>
        <boxGeometry args={[1.24, 0.018, 0.77]} />
        <meshStandardMaterial
          color="#193c32"
          metalness={0.45}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, 0.705, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.23, 0.255, 4]} />
        <meshBasicMaterial color="#c0edd4" side={2} />
      </mesh>
      {[-0.6, -0.3, 0, 0.3, 0.6].flatMap((x) =>
        [-1, 1].map((side) => (
          <mesh key={`${x}-${side}`} position={[x, 0.06, side * 0.74]}>
            <boxGeometry args={[0.11, 0.1, 0.24]} />
            <meshStandardMaterial
              color="#a9b8ad"
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
        )),
      )}
      <pointLight
        position={[0, 1.3, 0.8]}
        color="#d3ebd8"
        intensity={3}
        distance={4}
      />
    </group>
  );
}

function Sculpture({
  active,
  onReady,
}: {
  active: boolean;
  onReady: () => void;
}) {
  const group = useRef<Group>(null);
  const pulse = useRef<Mesh>(null);
  const firstFrame = useRef(true);
  const target = useRef({ x: 0, y: 0 });
  const started = useRef<number | null>(null);
  const nextFrame = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const { invalidate, gl } = useThree();

  useEffect(() => {
    if (!active) return;
    const hero = gl.domElement.closest(".hero-stage");
    const move = (event: Event) => {
      const pointer = event as PointerEvent;
      if (pointer.pointerType !== "mouse" || !hero) return;
      const rect = hero.getBoundingClientRect();
      target.current = {
        x: (pointer.clientX - rect.left) / rect.width - 0.5,
        y: (pointer.clientY - rect.top) / rect.height - 0.5,
      };
      invalidate();
    };
    const reset = () => {
      target.current = { x: 0, y: 0 };
      invalidate();
    };
    hero?.addEventListener("pointermove", move, { passive: true });
    hero?.addEventListener("pointerleave", reset);
    invalidate();
    return () => {
      clearTimeout(nextFrame.current);
      hero?.removeEventListener("pointermove", move);
      hero?.removeEventListener("pointerleave", reset);
    };
  }, [active, gl, invalidate]);

  useFrame(() => {
    if (!active || !group.current) return;
    if (firstFrame.current) {
      firstFrame.current = false;
      queueMicrotask(onReady);
    }
    const now = performance.now();
    started.current ??= now;
    const elapsed = (now - started.current) / 1000;
    const x = target.current.y * 0.055;
    const y = target.current.x * 0.075;
    group.current.rotation.x += (x - group.current.rotation.x) * 0.16;
    group.current.rotation.y += (y - group.current.rotation.y) * 0.16;
    if (pulse.current) {
      pulse.current.visible = elapsed < 5;
      const travel = Math.min(elapsed / 5, 1);
      pulse.current.position.set(
        -4 + travel * 8,
        0.03,
        Math.sin(travel * Math.PI * 2) * 0.32,
      );
    }
    // Demand rendering: one five-second signal, then stop when parallax settles.
    // No continuous idle loop. Hidden/offscreen scenes use frameloop="never".
    if (
      elapsed < 5 ||
      Math.abs(x - group.current.rotation.x) +
        Math.abs(y - group.current.rotation.y) >
        0.0005
    ) {
      clearTimeout(nextFrame.current);
      nextFrame.current = setTimeout(invalidate, 1000 / 30);
    }
  });

  return (
    <group ref={group}>
      <Layer y={-0.63} width={3.5} depth={2.5} />
      <Layer y={-0.35} width={3.15} depth={2.25} glass />
      <Layer y={-0.07} width={2.8} depth={2} glass />
      <Circuit />
      {paths.slice(0, 3).map((path, i) => (
        <mesh key={i} position={path[0]}>
          <sphereGeometry args={[0.06, 12, 8]} />
          <meshStandardMaterial
            color="#ceefdf"
            emissive="#79bda4"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
      <ReasoningCore />
      <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <ringGeometry args={[0.78, 0.8, 4]} />
        <meshBasicMaterial color="#bcebd6" transparent opacity={0.7} side={2} />
      </mesh>
      <OutputPlane position={[2.8, 0.52, -0.85]} />
      <OutputPlane position={[3.3, 0.38, -0.1]} amber />
      <OutputPlane position={[3.8, 0.24, 0.65]} />
      <mesh ref={pulse}>
        <sphereGeometry args={[0.045, 12, 8]} />
        <meshBasicMaterial color="#e3fff3" />
      </mesh>
      <mesh position={[0, -0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.4, 3.2]} />
        <meshBasicMaterial color="#050b0d" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

function ContextGuard({ onUnavailable }: { onUnavailable: () => void }) {
  const { gl } = useThree();
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
        camera={{ position: [5, 4.6, 7.6], fov: 34, near: 0.1, far: 30 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: true,
        }}
        onCreated={({ camera }) => camera.lookAt(new Vector3(0, 0.1, 0))}
        fallback={null}
      >
        <ambientLight intensity={1.6} />
        <directionalLight position={[1, 5, 3]} intensity={4} color="#e0f9ed" />
        <directionalLight
          position={[-3, 1, -3]}
          intensity={3}
          color="#7293a5"
        />
        <Sculpture active={active} onReady={onReady} />
        <ContextGuard onUnavailable={onUnavailable} />
      </Canvas>
    </div>
  );
}
