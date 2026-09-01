"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  GridHelper,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Path,
  RingGeometry,
  Shape,
  TubeGeometry,
  Vector3,
} from "three";
import {
  graphNodes,
  graphRoutes,
  graphLinks,
  riskNodes,
} from "./graph-topology";
import { useGraphClock } from "./scene-hooks";
function roundedPath(path: Shape | Path, w: number, h: number, r: number) {
  const x = -w / 2,
    y = -h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
}
function resources() {
  const shape = new Shape();
  roundedPath(shape, 2.6, 3.6, 0.22);
  const hole = new Path();
  roundedPath(hole, 2.43, 3.43, 0.16);
  shape.holes.push(hole);
  const frame = new ExtrudeGeometry(shape, {
    depth: 0.085,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.026,
    bevelThickness: 0.026,
    curveSegments: 6,
  });
  const edge = new EdgesGeometry(frame, 35);
  const curves = graphRoutes.map(
    (route) =>
      new CatmullRomCurve3(
        route.map((index) => new Vector3(...graphNodes[index]!)),
        false,
        "catmullrom",
        0.22,
      ),
  );
  const tubes = curves.map(
    (curve) => new TubeGeometry(curve, 70, 0.012, 5, false),
  );
  const riskCurve = new CatmullRomCurve3(
    [10, 13, 16].map((index) => new Vector3(...graphNodes[index]!)),
    false,
    "catmullrom",
    0.22,
  );
  const riskTube = new TubeGeometry(riskCurve, 40, 0.015, 5, false);
  const floor = new GridHelper(16, 24, "#243149", "#1a263b");
  for (const material of Array.isArray(floor.material)
    ? floor.material
    : [floor.material]) {
    material.transparent = true;
    material.opacity = 0.4;
    material.depthWrite = false;
  }
  const links = new BufferGeometry().setAttribute(
    "position",
    new Float32BufferAttribute(
      graphLinks.flatMap(([a, b]) => [...graphNodes[a!]!, ...graphNodes[b!]!]),
      3,
    ),
  );
  return {
    frame,
    edge,
    curves,
    tubes,
    riskTube,
    links,
    floor,
    node: new IcosahedronGeometry(0.11, 1),
    socket: new RingGeometry(0.19, 0.2, 24),
    pulse: new IcosahedronGeometry(0.037, 1),
    metal: new MeshStandardMaterial({
      color: "#92a6c2",
      metalness: 0.82,
      roughness: 0.24,
    }),
    nodeMetal: new MeshStandardMaterial({
      color: "#a9c5f0",
      metalness: 0.65,
      roughness: 0.2,
      emissive: "#315dff",
      emissiveIntensity: 0.28,
    }),
    stable: new MeshStandardMaterial({
      color: "#35d7c4",
      metalness: 0.45,
      roughness: 0.25,
      emissive: "#35d7c4",
      emissiveIntensity: 0.65,
    }),
    risk: new MeshStandardMaterial({
      color: "#ff795d",
      metalness: 0.4,
      roughness: 0.23,
      emissive: "#ff795d",
      emissiveIntensity: 0.55,
    }),
    route: new MeshBasicMaterial({
      color: "#648aff",
      transparent: true,
      opacity: 0.75,
    }),
    riskRoute: new MeshBasicMaterial({
      color: "#ff795d",
      transparent: true,
      opacity: 0.95,
    }),
    faint: new LineBasicMaterial({
      color: "#758cae",
      transparent: true,
      opacity: 0.28,
    }),
    rim: new LineBasicMaterial({
      color: "#c1d8f8",
      transparent: true,
      opacity: 0.38,
    }),
    ring: new MeshBasicMaterial({
      color: "#76a4ef",
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    }),
    glow: new MeshBasicMaterial({
      color: "white",
      transparent: true,
      opacity: 0.13,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    light: new MeshBasicMaterial({ color: "white", toneMapped: false }),
  };
}
export function ReleaseGraph({
  active,
  onReady,
}: {
  active: boolean;
  onReady: () => void;
}) {
  const model = useMemo(() => resources(), []);
  const group = useRef<Group>(null);
  const signals = useRef<InstancedMesh>(null);
  const halos = useRef<InstancedMesh>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const transform = useMemo(() => new Object3D(), []);
  const colors = useMemo(
    () => ({
      cool: new Color("#98d7ff"),
      stable: new Color("#35d7c4"),
      risk: new Color("#ff795d"),
    }),
    [],
  );
  const time = useGraphClock(active, onReady);
  const gl = useThree((state) => state.gl);
  useEffect(
    () => () => {
      Object.values(model).forEach((value) => {
        if (value instanceof GridHelper) {
          value.geometry.dispose();
          for (const material of Array.isArray(value.material)
            ? value.material
            : [value.material])
            material.dispose();
        } else if (Array.isArray(value))
          value.forEach((item) => {
            if (item && "dispose" in item) item.dispose();
          });
        else if (value && "dispose" in value) value.dispose();
      });
    },
    [model],
  );
  useEffect(() => {
    const stage = gl.domElement.closest(".hero-stage");
    function move(event: Event) {
      const e = event as PointerEvent;
      if (e.pointerType !== "mouse" || !stage) return;
      const bounds = stage.getBoundingClientRect();
      pointer.current.x = (e.clientX - bounds.left) / bounds.width - 0.5;
      pointer.current.y = (e.clientY - bounds.top) / bounds.height - 0.5;
    }
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
  useFrame(() => {
    if (!active || !group.current || !signals.current || !halos.current) return;
    const t = time.current;
    group.current.rotation.y +=
      (pointer.current.x * 0.18 +
        Math.sin(t * 0.16) * 0.028 -
        group.current.rotation.y) *
      0.06;
    group.current.rotation.x +=
      (pointer.current.y * 0.09 - group.current.rotation.x) * 0.06;
    group.current.position.y = Math.sin(t * 0.35) * 0.035;
    for (let i = 0; i < 24; i++) {
      const route = i % 3,
        progress = (t / 9 + Math.floor(i / 3) / 8) % 1;
      model.curves[route]!.getPoint(progress, transform.position);
      const scale = Math.min(progress * 14, (1 - progress) * 14, 1);
      const color =
        route === 1 && transform.position.x > 0.8
          ? colors.risk
          : transform.position.x > 0
            ? colors.stable
            : colors.cool;
      transform.scale.setScalar(scale);
      transform.updateMatrix();
      signals.current.setMatrixAt(i, transform.matrix);
      signals.current.setColorAt(i, color);
      transform.scale.setScalar(scale * 3.1);
      transform.updateMatrix();
      halos.current.setMatrixAt(i, transform.matrix);
      halos.current.setColorAt(i, color);
    }
    for (const mesh of [signals.current, halos.current]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });
  return (
    <group ref={group}>
      <lineSegments
        geometry={model.links}
        material={model.faint}
        dispose={null}
      />
      {model.tubes.map((tube, index) => (
        <mesh
          key={index}
          geometry={tube}
          material={model.route}
          dispose={null}
        />
      ))}
      <mesh
        geometry={model.riskTube}
        material={model.riskRoute}
        dispose={null}
      />
      {[-0.85, 0, 0.85].map((z, index) => (
        <group key={z} position={[0, 0, z]}>
          <mesh geometry={model.frame} material={model.metal} dispose={null} />
          <lineSegments
            geometry={model.edge}
            material={model.rim}
            dispose={null}
          />
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[2.4, 3.4, 0.018]} />
            <meshPhysicalMaterial
              color="#315dff"
              transparent
              opacity={index === 1 ? 0.09 : 0.045}
              metalness={0.18}
              roughness={0.25}
              clearcoat={1}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
      {[-1.28, 1.28].flatMap((x) =>
        [-1.77, 1.77].map((y) => (
          <mesh
            key={`${x}-${y}`}
            position={[x, y, 0.02]}
            material={model.metal}
          >
            <boxGeometry args={[0.05, 0.05, 1.82]} />
          </mesh>
        )),
      )}
      {graphNodes.map((position, index) => (
        <group key={index} position={position}>
          <mesh
            geometry={model.node}
            material={
              riskNodes.has(index)
                ? model.risk
                : index > 8
                  ? model.stable
                  : model.nodeMetal
            }
            dispose={null}
          />
          <mesh geometry={model.socket} material={model.ring} dispose={null} />
        </group>
      ))}
      {graphNodes.slice(0, 3).map(([x, y, z], index) => (
        <group
          key={index}
          position={[x - 0.24, y - 0.48, z]}
          rotation={[0, -0.2, -0.07]}
        >
          <mesh>
            <boxGeometry args={[0.42, 0.54, 0.035]} />
            <meshStandardMaterial
              color="#223a5a"
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>
          {[0, 1, 2].map((line) => (
            <mesh key={line} position={[-0.02, 0.13 - line * 0.12, 0.022]}>
              <boxGeometry args={[line === 0 ? 0.25 : 0.18, 0.012, 0.012]} />
              <meshBasicMaterial color="#90b6fb" transparent opacity={0.7} />
            </mesh>
          ))}
        </group>
      ))}
      <instancedMesh
        ref={signals}
        args={[model.pulse, model.light, 24]}
        frustumCulled={false}
        dispose={null}
      />
      <instancedMesh
        ref={halos}
        args={[model.pulse, model.glow, 24]}
        frustumCulled={false}
        dispose={null}
      />
      <primitive object={model.floor} position={[0, -2.5, 0]} dispose={null} />
    </group>
  );
}
