"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  Color,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Mesh,
  Object3D,
} from "three";
import { reactorResources, type ReactorResources } from "./scene-materials";
import { useReactorClock } from "./scene-hooks";

const sheets = 9;
const signals = 24;

function Flow({
  resources,
  time,
  active,
}: {
  resources: ReactorResources;
  time: { current: number };
  active: boolean;
}) {
  const documents = useRef<InstancedMesh>(null);
  const lines = useRef<InstancedMesh>(null);
  const pulses = useRef<InstancedMesh>(null);
  const transforms = useRef({
    sheet: new Object3D(),
    line: new Object3D(),
    signal: new Object3D(),
  });
  const colors = useMemo(
    () => [new Color("#b3b3ff"), new Color("#c5f5ef")],
    [],
  );
  useEffect(() => {
    [documents.current, lines.current, pulses.current].forEach((mesh) =>
      mesh?.instanceMatrix.setUsage(DynamicDrawUsage),
    );
  }, []);
  useFrame(() => {
    if (!active || !documents.current || !lines.current || !pulses.current)
      return;
    const { sheet, line, signal } = transforms.current;
    for (let i = 0; i < sheets; i++) {
      const progress = (time.current / 10 + i / sheets) % 1;
      resources.paths[i % 3]!.getPoint(progress, sheet.position);
      sheet.rotation.set(
        0.07 + Math.sin(progress * Math.PI) * 0.24,
        Math.sin(progress * Math.PI * 2) * 0.16,
        progress > 0.6 ? -0.22 : 0.12,
      );
      const scale = Math.min(progress * 12, (1 - progress) * 12, 1);
      sheet.scale.setScalar(scale);
      sheet.updateMatrix();
      documents.current.setMatrixAt(i, sheet.matrix);
      documents.current.setColorAt(i, colors[progress > 0.55 ? 1 : 0]!);
      for (let j = 0; j < 4; j++) {
        line.position.set(-0.04, 0.022, -0.21 + j * 0.13);
        line.scale.set(j === 0 ? 0.52 : 0.48 - j * 0.065, 0.012, 0.018);
        line.updateMatrix();
        line.matrix.premultiply(sheet.matrix);
        lines.current.setMatrixAt(i * 4 + j, line.matrix);
      }
    }
    for (let i = 0; i < signals; i++) {
      const progress = (time.current / 5.5 + i / signals) % 1;
      resources.paths[i % 3]!.getPoint(progress, signal.position);
      signal.position.y += 0.045;
      signal.scale.set(0.13, 0.035, 0.035);
      signal.updateMatrix();
      pulses.current.setMatrixAt(i, signal.matrix);
    }
    documents.current.instanceMatrix.needsUpdate = true;
    if (documents.current.instanceColor)
      documents.current.instanceColor.needsUpdate = true;
    lines.current.instanceMatrix.needsUpdate = true;
    pulses.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <lineSegments
        geometry={resources.routing}
        material={resources.routes}
        dispose={null}
      />
      <instancedMesh
        ref={documents}
        args={[resources.document, resources.paper, sheets]}
        frustumCulled={false}
        dispose={null}
      />
      <instancedMesh
        ref={lines}
        args={[resources.bar, resources.ice, sheets * 4]}
        frustumCulled={false}
        dispose={null}
      />
      <instancedMesh
        ref={pulses}
        args={[resources.bar, resources.luminous, signals]}
        frustumCulled={false}
        dispose={null}
      />
    </>
  );
}

export function ReleaseReactor({
  active,
  onReady,
}: {
  active: boolean;
  onReady: () => void;
}) {
  const resources = useMemo(() => reactorResources(), []);
  const luminous = useRef(resources.luminous);
  const group = useRef<Group>(null);
  const layers = useRef<(Group | null)[]>([]);
  const sweep = useRef<Mesh>(null);
  const chamber = useRef<Group>(null);
  const scanner = useRef<Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const time = useReactorClock(active, onReady);
  const gl = useThree((state) => state.gl);
  useEffect(
    () => () => {
      // Shared resources are owned here. Fiber owns the inline geometries.
      Object.values(resources).forEach((resource) => {
        if (
          resource &&
          "dispose" in resource &&
          typeof resource.dispose === "function"
        )
          resource.dispose();
      });
    },
    [resources],
  );
  useEffect(() => {
    if (!active) return;
    const hero = gl.domElement.closest(".hero-stage");
    const move = (event: Event) => {
      const e = event as PointerEvent;
      if (e.pointerType !== "mouse" || !hero) return;
      const bounds = hero.getBoundingClientRect();
      pointer.current.x = (e.clientX - bounds.left) / bounds.width - 0.5;
      pointer.current.y = (e.clientY - bounds.top) / bounds.height - 0.5;
    };
    const reset = () => {
      pointer.current = { x: 0, y: 0 };
    };
    hero?.addEventListener("pointermove", move, { passive: true });
    hero?.addEventListener("pointerleave", reset);
    return () => {
      hero?.removeEventListener("pointermove", move);
      hero?.removeEventListener("pointerleave", reset);
    };
  }, [active, gl]);
  useFrame(() => {
    if (!active || !group.current) return;
    const t = time.current;
    const entrance = 1 - Math.pow(1 - Math.min(t / 2.4, 1), 3);
    group.current.scale.setScalar(0.9 + entrance * 0.1);
    group.current.rotation.y +=
      (pointer.current.x * 0.19 +
        Math.sin(t * 0.18) * 0.055 -
        group.current.rotation.y) *
      0.07;
    group.current.rotation.x +=
      (pointer.current.y * 0.1 - group.current.rotation.x) * 0.07;
    layers.current.forEach((layer, index) => {
      if (!layer) return;
      layer.position.y =
        -0.04 + index * 0.59 + Math.sin(t * 0.85 - index * 0.75) * 0.13;
      layer.rotation.y = Math.sin(t * 0.3 - index * 0.3) * 0.045;
    });
    if (chamber.current)
      chamber.current.position.y = 0.43 + Math.sin(t * 0.8) * 0.075;
    if (sweep.current) sweep.current.rotation.z = -t * 0.27;
    if (scanner.current) {
      scanner.current.position.y = 0.1 + ((Math.sin(t * 1.05) + 1) / 2) * 1.85;
      const breadth = 1 + Math.sin(t * 1.05) * 0.04;
      scanner.current.scale.set(breadth, 0.035, breadth);
    }
    luminous.current.opacity = 0.64 + Math.sin(t * 1.6) * 0.19;
  });
  return (
    <group ref={group}>
      <mesh
        position={[0, -0.8, 0]}
        geometry={resources.plate}
        material={resources.dark}
        scale={[1.8, 1.6, 1.55]}
        dispose={null}
      />
      <lineSegments
        position={[0, -0.8, 0]}
        geometry={resources.plateEdges}
        scale={[1.8, 1.6, 1.55]}
        material={resources.baseEdge}
        dispose={null}
      />
      <mesh
        position={[0, -0.55, 0]}
        geometry={resources.plate}
        material={resources.metal}
        scale={[1.36, 1, 1.27]}
        dispose={null}
      />
      {[0, 1, 2, 3].map((index) => (
        <group
          key={index}
          ref={(node) => {
            layers.current[index] = node;
          }}
          position={[0, index * 0.59 - 0.04, 0]}
        >
          <mesh
            geometry={resources.plate}
            material={resources.glass}
            scale={[1.12, 1, 1.05]}
            dispose={null}
          />
          <lineSegments
            geometry={resources.plateEdges}
            scale={[1.12, 1, 1.05]}
            material={index === 3 ? resources.topEdge : resources.edge}
            dispose={null}
          />
        </group>
      ))}
      <group ref={chamber} position={[0, 0.43, 0]}>
        <mesh
          geometry={resources.plate}
          material={resources.metal}
          scale={[0.68, 1.3, 0.68]}
          dispose={null}
        />
        <mesh
          position={[0, 0.18, 0]}
          geometry={resources.plate}
          material={resources.luminous}
          scale={[0.6, 0.4, 0.6]}
          dispose={null}
        />
        <mesh
          position={[0, 0.23, 0]}
          geometry={resources.plate}
          material={resources.dark}
          scale={[0.53, 0.7, 0.53]}
          dispose={null}
        />
        <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <ringGeometry args={[0.29, 0.32, 4]} />
          <meshBasicMaterial color="#e9eeff" side={2} />
        </mesh>
        {[-0.44, -0.22, 0, 0.22, 0.44].map((x) => (
          <mesh key={x} position={[x, 0.2, 0.59]}>
            <boxGeometry args={[0.08, 0.055, 0.12]} />
            <meshBasicMaterial color="#c3d3ff" />
          </mesh>
        ))}
      </group>
      <mesh
        ref={scanner}
        position={[0, 0.7, 0]}
        geometry={resources.plate}
        material={resources.luminous}
        scale={[1, 0.04, 1]}
        dispose={null}
      />
      <group position={[0, -0.27, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[1.94, 1.955, 80]} />
          <meshBasicMaterial
            color="#6f82d8"
            side={2}
            transparent
            opacity={0.38}
          />
        </mesh>
        <mesh ref={sweep}>
          <ringGeometry args={[1.93, 1.98, 64, 1, 0, Math.PI * 0.65]} />
          <meshBasicMaterial
            color="#c9c9ff"
            side={2}
            transparent
            opacity={0.9}
          />
        </mesh>
      </group>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}-${z}`} position={[x * 1.53, 0.57, z * 1.1]}>
            <boxGeometry args={[0.035, 2.16, 0.035]} />
            <meshBasicMaterial color="#b2bafa" transparent opacity={0.48} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[0.035, 1.35, 0.035]} />
        <meshBasicMaterial color="#dadfff" transparent opacity={0.65} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.11, 0.34, 1.35, 12, 1, true]} />
        <meshBasicMaterial
          color="#b6b9ff"
          transparent
          opacity={0.08}
          depthWrite={false}
          side={2}
        />
      </mesh>
      <Flow resources={resources} time={time} active={active} />
    </group>
  );
}
