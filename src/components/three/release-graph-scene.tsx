"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  MathUtils,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import {
  graphNodes,
  graphRoutes,
  graphLinks,
  riskNodes,
  type GraphPhase,
} from "./graph-topology";
import { useGraphClock } from "./scene-hooks";

function createGraph() {
  const curves = graphRoutes.map(
    (route) =>
      new CatmullRomCurve3(
        route.map((i) => new Vector3(...graphNodes[i]!)),
        false,
        "catmullrom",
        0.12,
      ),
  );
  const rails = curves.map(
    (curve) => new TubeGeometry(curve, 64, 0.065, 10, false),
  );
  const links = graphLinks.map(
    ([a, b]) =>
      new TubeGeometry(
        new CatmullRomCurve3([
          new Vector3(...graphNodes[a!]!),
          new Vector3()
            .addVectors(
              new Vector3(...graphNodes[a!]!),
              new Vector3(...graphNodes[b!]!),
            )
            .multiplyScalar(0.5)
            .add(new Vector3(0, -0.22, 0)),
          new Vector3(...graphNodes[b!]!),
        ]),
        20,
        0.012,
        5,
        false,
      ),
  );
  const riskRail = new TubeGeometry(
    new CatmullRomCurve3(
      [10, 13, 16].map((i) => new Vector3(...graphNodes[i]!)),
    ),
    32,
    0.025,
    6,
    false,
  );
  const boundary = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute(
      [
        -2.6, -0.3, -2.8, 2.1, -0.3, -2.8, 2.1, -0.3, -2.8, 2.1, -0.3, 2.8, 2.1,
        -0.3, 2.8, -2.6, -0.3, 2.8, -2.6, -0.3, 2.8, -2.6, -0.3, -2.8,
      ],
      3,
    ),
  );
  return {
    curves,
    rails,
    links,
    riskRail,
    boundary,
    boundaryStrong: new LineBasicMaterial({
      color: "#526d9d",
      transparent: true,
      opacity: 0.8,
    }),
    boundaryFaint: new LineBasicMaterial({
      color: "#2a384e",
      transparent: true,
      opacity: 0.35,
    }),
    hub: new CylinderGeometry(0.29, 0.31, 0.13, 32),
    core: new CylinderGeometry(0.15, 0.15, 0.14, 24),
    collar: new TorusGeometry(0.32, 0.013, 6, 32),
    pulse: new SphereGeometry(0.05, 8, 6),
    silver: new MeshStandardMaterial({
      color: "#8998b3",
      metalness: 0.98,
      roughness: 0.24,
      envMapIntensity: 0.9,
    }),
    secondary: new MeshStandardMaterial({
      color: "#5c7395",
      metalness: 0.8,
      roughness: 0.3,
    }),
    glass: new MeshPhysicalMaterial({
      color: "#c4d3fa",
      metalness: 0.4,
      roughness: 0.2,
      clearcoat: 1,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
    blue: new MeshPhysicalMaterial({
      color: "#3a5baf",
      metalness: 0.45,
      roughness: 0.16,
      clearcoat: 1,
      emissive: "#254ce5",
      emissiveIntensity: 0.35,
    }),
    sourceFocus: new MeshStandardMaterial({
      color: "#9ab3ff",
      metalness: 0.4,
      roughness: 0.18,
      emissive: "#527bff",
      emissiveIntensity: 1,
    }),
    stable: new MeshPhysicalMaterial({
      color: "#3a9c90",
      metalness: 0.45,
      roughness: 0.17,
      clearcoat: 1,
      emissive: "#218f87",
      emissiveIntensity: 0.4,
    }),
    risk: new MeshPhysicalMaterial({
      color: "#bd735e",
      metalness: 0.4,
      roughness: 0.17,
      clearcoat: 1,
      emissive: "#dd6944",
      emissiveIntensity: 0.3,
    }),
    riskFocus: new MeshStandardMaterial({
      color: "#ffc1a9",
      metalness: 0.3,
      roughness: 0.2,
      emissive: "#ff795d",
      emissiveIntensity: 0.9,
    }),
    pulseMaterial: new MeshBasicMaterial({
      color: "#ffffff",
      toneMapped: false,
    }),
  };
}

export function ReleaseGraph({
  active,
  phase,
  onReady,
}: {
  active: boolean;
  phase: GraphPhase;
  onReady: () => void;
}) {
  const model = useMemo(() => createGraph(), []);
  const root = useRef<Group>(null),
    signals = useRef<InstancedMesh>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const transform = useMemo(() => new Object3D(), []);
  const colors = useMemo(
    () => ({
      source: new Color("#8baaff"),
      stable: new Color("#8ceddc"),
      risk: new Color("#ffc0a6"),
    }),
    [],
  );
  const clock = useGraphClock(active, onReady);
  const gl = useThree((state) => state.gl),
    invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [phase, invalidate]);
  useEffect(
    () => () => {
      Object.values(model).forEach((value) => {
        if (Array.isArray(value))
          value.forEach((item) => {
            if (item && "dispose" in item) item.dispose();
          });
        else if (value && "dispose" in value) value.dispose();
      });
    },
    [model],
  );
  useEffect(() => {
    const stage = gl.domElement.closest(".hero-composition");
    const move = (event: Event) => {
      const e = event as PointerEvent;
      if (e.pointerType !== "mouse" || !stage) return;
      const bounds = stage.getBoundingClientRect();
      pointer.current = {
        x: (e.clientX - bounds.left) / bounds.width - 0.5,
        y: (e.clientY - bounds.top) / bounds.height - 0.5,
      };
    };
    const reset = () => {
      pointer.current = { x: 0, y: 0 };
    };
    stage?.addEventListener("pointermove", move, { passive: true });
    stage?.addEventListener("pointerleave", reset);
    return () => {
      stage?.removeEventListener("pointermove", move);
      stage?.removeEventListener("pointerleave", reset);
    };
  }, [gl]);
  useFrame((_, delta) => {
    if (!root.current || !signals.current || !active) return;
    const t = clock.current,
      dt = Math.min(delta, 0.1);
    root.current.rotation.y = MathUtils.damp(
      root.current.rotation.y,
      pointer.current.x * 0.12,
      3,
      dt,
    );
    root.current.rotation.x = MathUtils.damp(
      root.current.rotation.x,
      pointer.current.y * 0.055,
      3,
      dt,
    );
    root.current.position.y = Math.sin(t * 0.35) * 0.025;
    for (let i = 0; i < 18; i++) {
      const route = i % 3,
        progress = (t / 9 + Math.floor(i / 3) / 6) % 1;
      model.curves[route]!.getPoint(progress, transform.position);
      transform.scale.setScalar(
        Math.min(progress * 12, (1 - progress) * 12, 1),
      );
      transform.updateMatrix();
      signals.current.setMatrixAt(i, transform.matrix);
      signals.current.setColorAt(
        i,
        route === 1 && progress > 0.55
          ? colors.risk
          : progress > 0.5
            ? colors.stable
            : colors.source,
      );
    }
    signals.current.instanceMatrix.needsUpdate = true;
    if (signals.current.instanceColor)
      signals.current.instanceColor.needsUpdate = true;
    gl.domElement.setAttribute("data-draw-calls", String(gl.info.render.calls));
    gl.domElement.setAttribute(
      "data-triangles",
      String(gl.info.render.triangles),
    );
  });
  return (
    <group ref={root}>
      <lineSegments
        geometry={model.boundary}
        material={
          phase === "trace" ? model.boundaryStrong : model.boundaryFaint
        }
        dispose={null}
      />
      {model.links.map((geometry, i) => (
        <mesh
          key={`link-${i}`}
          geometry={geometry}
          material={model.secondary}
          dispose={null}
        />
      ))}
      {model.rails.map((geometry, i) => (
        <mesh
          key={`rail-${i}`}
          geometry={geometry}
          material={model.silver}
          dispose={null}
        />
      ))}
      <mesh
        geometry={model.riskRail}
        material={phase === "signal" ? model.riskFocus : model.risk}
        dispose={null}
      />
      {graphNodes.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh geometry={model.hub} material={model.silver} dispose={null} />
          <mesh
            geometry={model.core}
            position={[0, 0.065, 0]}
            material={
              riskNodes.has(i)
                ? phase === "signal"
                  ? model.riskFocus
                  : model.risk
                : i > 8
                  ? model.stable
                  : phase === "source"
                    ? model.sourceFocus
                    : model.blue
            }
            dispose={null}
          />
          <mesh
            geometry={model.collar}
            rotation={[Math.PI / 2, 0, 0]}
            material={model.secondary}
            dispose={null}
          />
          {i === 7 || i === 10 ? (
            <mesh
              geometry={model.hub}
              position={[0, -0.22, 0]}
              scale={[1.5, 0.6, 1.5]}
              material={model.glass}
              dispose={null}
            />
          ) : null}
        </group>
      ))}
      <instancedMesh
        ref={signals}
        args={[model.pulse, model.pulseMaterial, 18]}
        frustumCulled={false}
        dispose={null}
      />
    </group>
  );
}
