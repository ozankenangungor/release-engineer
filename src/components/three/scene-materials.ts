import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  MeshBasicMaterial,
  MeshStandardMaterial,
  LineBasicMaterial,
  Shape,
  Vector3,
} from "three";

export function reactorResources() {
  const shape = new Shape();
  const w = 1.27,
    d = 0.95,
    corner = 0.18;
  shape.moveTo(-w + corner, -d);
  shape.lineTo(w - corner, -d);
  shape.lineTo(w, -d + corner);
  shape.lineTo(w, d - corner);
  shape.lineTo(w - corner, d);
  shape.lineTo(-w + corner, d);
  shape.lineTo(-w, d - corner);
  shape.lineTo(-w, -d + corner);
  shape.closePath();
  const plate = new ExtrudeGeometry(shape, {
    depth: 0.065,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    steps: 1,
  });
  plate.rotateX(-Math.PI / 2);
  const plateEdges = new EdgesGeometry(plate);
  const document = new BoxGeometry(0.86, 0.028, 0.65);
  const bar = new BoxGeometry(1, 1, 1);
  const paths = [-1.1, 0, 1.1].map(
    (lane) =>
      new CatmullRomCurve3(
        [
          new Vector3(-5.4, -0.48, lane * 1.4),
          new Vector3(-3.7, -0.45, lane * 1.4),
          new Vector3(-2.5, 0.32, lane),
          new Vector3(-1.45, 0.5, lane * 0.45),
          new Vector3(0, 0.58, lane * 0.3),
          new Vector3(1.45, 0.62, lane * 0.45),
          new Vector3(2.8, 0.25, lane),
          new Vector3(4.9, 0.18, lane * 1.6),
        ],
        false,
        "centripetal",
      ),
  );
  const routing = new BufferGeometry();
  const points = paths.flatMap((path) => {
    const samples = path.getPoints(72);
    return samples
      .slice(1)
      .flatMap((point, index) => [
        ...samples[index]!.toArray(),
        ...point.toArray(),
      ]);
  });
  routing.setAttribute("position", new Float32BufferAttribute(points, 3));
  const metal = new MeshStandardMaterial({
    color: "#24324e",
    metalness: 0.65,
    roughness: 0.31,
  });
  const dark = new MeshStandardMaterial({
    color: "#101b31",
    metalness: 0.6,
    roughness: 0.38,
  });
  const glass = new MeshStandardMaterial({
    color: "#939cff",
    transparent: true,
    opacity: 0.14,
    metalness: 0.28,
    roughness: 0.25,
    depthWrite: false,
  });
  const paper = new MeshStandardMaterial({
    color: "#8499dd",
    transparent: true,
    opacity: 0.56,
    metalness: 0.3,
    roughness: 0.38,
  });
  const luminous = new MeshBasicMaterial({
    color: "#babaff",
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const ice = new MeshBasicMaterial({
    color: "#c4f6ef",
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const baseEdge = new LineBasicMaterial({
    color: "#6677b8",
    transparent: true,
    opacity: 0.6,
  });
  const edge = new LineBasicMaterial({
    color: "#909cf5",
    transparent: true,
    opacity: 0.43,
  });
  const topEdge = new LineBasicMaterial({
    color: "#e4e5ff",
    transparent: true,
    opacity: 0.75,
  });
  const routes = new LineBasicMaterial({
    color: "#a1aceb",
    transparent: true,
    opacity: 0.33,
  });
  return {
    plate,
    plateEdges,
    document,
    bar,
    paths,
    routing,
    metal,
    dark,
    glass,
    paper,
    luminous,
    ice,
    baseEdge,
    edge,
    topEdge,
    routes,
  };
}
export type ReactorResources = ReturnType<typeof reactorResources>;
