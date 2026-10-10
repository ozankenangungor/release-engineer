"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  GridHelper,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Path,
  PlaneGeometry,
  RingGeometry,
  Shape,
  SphereGeometry,
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
function plate(w: number, h: number, depth: number, frame = false) {
  const shape = new Shape();
  roundedPath(shape, w, h, 0.2);
  if (frame) {
    const hole = new Path();
    roundedPath(hole, w - 0.13, h - 0.13, 0.15);
    shape.holes.push(hole);
  }
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    curveSegments: 6,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}
function resources() {
  const curves = graphRoutes.map(
    (route) =>
      new CatmullRomCurve3(
        route.map((i) => new Vector3(...graphNodes[i]!)),
        false,
        "catmullrom",
        0.18,
      ),
  );
  const tubes = curves.map(
    (curve) => new TubeGeometry(curve, 56, 0.018, 5, false),
  );
  const riskTube = new TubeGeometry(
    new CatmullRomCurve3(
      [10, 13, 16].map((i) => new Vector3(...graphNodes[i]!)),
    ),
    28,
    0.025,
    5,
    false,
  );
  const brandPaths = [
    [
      [-1.35, 1.34, -0.85],
      [-0.85, 1.34, -0.85],
      [-0.1, 1.34, 0],
      [-0.85, 1.34, 0.85],
      [-1.35, 1.34, 0.85],
    ],
    [
      [-0.1, 1.34, 0],
      [1.4, 1.34, 0],
    ],
    [
      [0.65, 1.34, -0.9],
      [0.65, 1.34, 0.9],
    ],
  ].map(
    (points) =>
      new TubeGeometry(
        new CatmullRomCurve3(
          points.map((p) => new Vector3(...p)),
          false,
          "catmullrom",
          0,
        ),
        24,
        0.035,
        6,
        false,
      ),
  );
  const floor = new GridHelper(18, 32, "#cad7e9", "#dce5ef");
  for (const material of Array.isArray(floor.material)
    ? floor.material
    : [floor.material]) {
    material.transparent = true;
    material.opacity = 0.22;
    material.depthWrite = false;
  }
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 128;
  const context = shadowCanvas.getContext("2d")!;
  const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, "rgba(30,50,84,.42)");
  gradient.addColorStop(0.45, "rgba(30,50,84,.2)");
  gradient.addColorStop(1, "rgba(30,50,84,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const shadowTexture = new CanvasTexture(shadowCanvas),
    rim = plate(4, 3.25, 0.09, true);
  return {
    curves,
    tubes,
    riskTube,
    brandPaths,
    floor,
    shadowTexture,
    rim,
    rimEdge: new EdgesGeometry(rim, 35),
    base: plate(4.2, 3.48, 0.28),
    pane: plate(3.9, 3.15, 0.035),
    file: plate(1.2, 0.95, 0.055),
    terminal: plate(0.8, 0.65, 0.065),
    pin: new CylinderGeometry(0.033, 0.033, 2.4, 8),
    node: new SphereGeometry(0.085, 12, 8),
    pulse: new SphereGeometry(0.036, 8, 6),
    socket: new RingGeometry(0.14, 0.16, 24),
    bar: new BoxGeometry(1, 0.014, 0.025),
    scan: new BoxGeometry(3.4, 0.009, 0.012),
    terminalBar: new BoxGeometry(0.48, 0.025, 0.034),
    shadowPlane: new PlaneGeometry(14, 10),
    links: new BufferGeometry().setAttribute(
      "position",
      new Float32BufferAttribute(
        graphLinks.flatMap(([a, b]) => [
          ...graphNodes[a!]!,
          ...graphNodes[b!]!,
        ]),
        3,
      ),
    ),
    silver: new MeshStandardMaterial({
      color: "#dce4ee",
      metalness: 0.92,
      roughness: 0.22,
      envMapIntensity: 1.3,
    }),
    ceramic: new MeshStandardMaterial({
      color: "#f5f8ff",
      metalness: 0.25,
      roughness: 0.22,
    }),
    baseMetal: new MeshStandardMaterial({
      color: "#172d55",
      metalness: 0.75,
      roughness: 0.25,
    }),
    glass: new MeshPhysicalMaterial({
      color: "#8bb4ff",
      metalness: 0.2,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      envMapIntensity: 1.7,
    }),
    topGlass: new MeshPhysicalMaterial({
      color: "#1b40df",
      metalness: 0.3,
      roughness: 0.22,
      clearcoat: 1,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      envMapIntensity: 0.5,
    }),
    blue: new MeshStandardMaterial({
      color: "#315dff",
      metalness: 0.35,
      roughness: 0.2,
      emissive: "#315dff",
      emissiveIntensity: 0.16,
    }),
    stable: new MeshStandardMaterial({
      color: "#138d9a",
      metalness: 0.4,
      roughness: 0.2,
      emissive: "#27cabc",
      emissiveIntensity: 0.2,
    }),
    risk: new MeshStandardMaterial({
      color: "#e2553d",
      metalness: 0.3,
      roughness: 0.2,
      emissive: "#ff795d",
      emissiveIntensity: 0.2,
    }),
    route: new MeshBasicMaterial({
      color: "#477bda",
      transparent: true,
      opacity: 0.65,
    }),
    riskRoute: new MeshBasicMaterial({
      color: "#ec755d",
      transparent: true,
      opacity: 0.8,
    }),
    faint: new LineBasicMaterial({
      color: "#8fa9c9",
      transparent: true,
      opacity: 0.35,
    }),
    edge: new LineBasicMaterial({
      color: "#c3dbff",
      transparent: true,
      opacity: 0.45,
    }),
    ring: new MeshBasicMaterial({
      color: "#5273ac",
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
    light: new MeshBasicMaterial({ color: "white", toneMapped: false }),
    halo: new MeshBasicMaterial({
      color: "#315dff",
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    }),
    shadow: new MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.7,
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
  const model = useMemo(() => resources(), []),
    root = useRef<Group>(null),
    layers = useRef<Group>(null),
    sources = useRef<Group>(null),
    sweep = useRef<Mesh>(null),
    signals = useRef<InstancedMesh>(null),
    halos = useRef<InstancedMesh>(null);
  const pointer = useRef({ x: 0, y: 0 }),
    transform = useMemo(() => new Object3D(), []);
  const colors = useMemo(
    () => ({
      cool: new Color("#315dff"),
      stable: new Color("#138d9a"),
      risk: new Color("#ff795d"),
    }),
    [],
  );
  const time = useGraphClock(active, onReady),
    gl = useThree((state) => state.gl),
    invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [phase, invalidate]);
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
    const stage = gl.domElement.closest(".hero-composition");
    function move(event: Event) {
      const e = event as PointerEvent;
      if (e.pointerType !== "mouse" || !stage) return;
      const bounds = stage.getBoundingClientRect();
      pointer.current = {
        x: (e.clientX - bounds.left) / bounds.width - 0.5,
        y: (e.clientY - bounds.top) / bounds.height - 0.5,
      };
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
  useFrame((_, delta) => {
    if (
      !root.current ||
      !layers.current ||
      !sources.current ||
      !signals.current ||
      !halos.current
    )
      return;
    const t = time.current,
      dt = Math.min(delta, 0.1);
    if (!active) return;
    root.current.rotation.y = MathUtils.damp(
      root.current.rotation.y,
      pointer.current.x * 0.17 + Math.sin(t * 0.18) * 0.018,
      3,
      dt,
    );
    root.current.rotation.x = MathUtils.damp(
      root.current.rotation.x,
      pointer.current.y * 0.075,
      3,
      dt,
    );
    layers.current.position.y = Math.sin(t * 0.55) * 0.055;
    layers.current.rotation.y = MathUtils.damp(
      layers.current.rotation.y,
      phase === "trace" ? 0.08 : 0,
      2,
      dt,
    );
    sources.current.position.y = Math.sin(t * 0.5 + 1) * 0.045;
    if (sweep.current) sweep.current.position.z = Math.sin(t * 0.55) * 1.25;
    for (let i = 0; i < 18; i++) {
      const route = i % 3,
        progress = (t / 8 + Math.floor(i / 3) / 6) % 1;
      model.curves[route]!.getPoint(progress, transform.position);
      const scale = Math.min(progress * 12, (1 - progress) * 12, 1),
        color =
          route === 1 && transform.position.x > 0.8
            ? colors.risk
            : transform.position.x > 0
              ? colors.stable
              : colors.cool;
      transform.scale.setScalar(scale);
      transform.updateMatrix();
      signals.current.setMatrixAt(i, transform.matrix);
      signals.current.setColorAt(i, color);
      transform.scale.setScalar(scale * 3.6);
      transform.updateMatrix();
      halos.current.setMatrixAt(i, transform.matrix);
      halos.current.setColorAt(i, color);
    }
    for (const mesh of [signals.current, halos.current]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    gl.domElement.setAttribute("data-draw-calls", String(gl.info.render.calls));
    gl.domElement.setAttribute(
      "data-triangles",
      String(gl.info.render.triangles),
    );
  });
  return (
    <group ref={root}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.58, 0]}
        geometry={model.shadowPlane}
        material={model.shadow}
        dispose={null}
      />
      <primitive object={model.floor} position={[0, -1.6, 0]} dispose={null} />
      <lineSegments
        geometry={model.links}
        material={model.faint}
        dispose={null}
      />
      {model.tubes.map((geometry, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={model.route}
          dispose={null}
        />
      ))}
      <mesh
        geometry={model.riskTube}
        material={model.riskRoute}
        dispose={null}
      />
      <mesh
        geometry={model.base}
        position={[0, -1.25, 0]}
        material={model.baseMetal}
        dispose={null}
      />
      <mesh
        geometry={model.rim}
        position={[0, -1.0, 0]}
        material={model.silver}
        dispose={null}
      />
      <group ref={layers}>
        {[-0.65, 0, 0.65, 1.25].map((y, i) => (
          <group key={y} position={[0, y, 0]}>
            <mesh
              geometry={model.pane}
              material={i === 3 ? model.topGlass : model.glass}
              material-opacity={
                i === 3 ? 0.96 : phase === "trace" ? 0.32 : 0.23
              }
              dispose={null}
            />
            <mesh geometry={model.rim} material={model.silver} dispose={null} />
            <lineSegments
              geometry={model.rimEdge}
              material={model.edge}
              dispose={null}
            />
          </group>
        ))}
        {model.brandPaths.map((geometry, i) => (
          <mesh
            key={i}
            geometry={geometry}
            material={model.ceramic}
            dispose={null}
          />
        ))}
        <mesh
          ref={sweep}
          position={[0, 1.37, 0]}
          geometry={model.scan}
          material={model.light}
          dispose={null}
        />
      </group>
      {[-1.8, 1.8].flatMap((x) =>
        [-1.42, 1.42].map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, -0.05, z]}
            geometry={model.pin}
            material={model.silver}
            dispose={null}
          />
        )),
      )}
      <group ref={sources}>
        {graphNodes.slice(0, 3).map(([x, y, z], i) => (
          <group
            key={i}
            position={[x - 0.16, y - 0.15, z]}
            rotation={[0, 0.08, -0.08]}
          >
            <mesh
              geometry={model.file}
              position={[0, -0.12, 0.02]}
              material={model.silver}
              dispose={null}
            />
            <mesh
              geometry={model.file}
              material={model.ceramic}
              dispose={null}
            />
            {[0, 1, 2, 3].map((line) => (
              <mesh
                key={line}
                position={[-0.03, 0.1, -0.27 + line * 0.18]}
                scale={[line === 0 ? 0.73 : line === 2 ? 0.65 : 0.48, 1, 1]}
                geometry={model.bar}
                material={line === 2 ? model.blue : model.silver}
                dispose={null}
              />
            ))}
          </group>
        ))}
      </group>
      {graphNodes.slice(15).map(([x, y, z], i) => (
        <group key={i} position={[x, y - 0.12, z]}>
          <mesh
            geometry={model.terminal}
            material={model.ceramic}
            dispose={null}
          />
          <mesh
            position={[0, 0.09, 0]}
            geometry={model.terminalBar}
            material={i === 1 ? model.risk : model.stable}
            dispose={null}
          />
        </group>
      ))}
      {graphNodes.map((position, i) => (
        <group key={i} position={position}>
          <mesh
            geometry={model.node}
            material={
              riskNodes.has(i) ? model.risk : i > 8 ? model.stable : model.blue
            }
            material-emissiveIntensity={
              riskNodes.has(i)
                ? phase === "signal"
                  ? 0.5
                  : 0.2
                : i > 8
                  ? 0.2
                  : phase === "source"
                    ? 0.45
                    : 0.16
            }
            dispose={null}
          />
          <mesh
            geometry={model.socket}
            material={model.ring}
            rotation={[-Math.PI / 2, 0, 0]}
            dispose={null}
          />
        </group>
      ))}
      <instancedMesh
        ref={signals}
        args={[model.pulse, model.light, 18]}
        frustumCulled={false}
        dispose={null}
      />
      <instancedMesh
        ref={halos}
        args={[model.pulse, model.halo, 18]}
        frustumCulled={false}
        dispose={null}
      />
    </group>
  );
}
