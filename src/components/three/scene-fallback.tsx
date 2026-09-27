import {
  graphNodes,
  graphRoutes,
  graphLinks,
  riskNodes,
  type GraphPhase,
} from "./graph-topology";
const project = ([x = 0, y = 0, z = 0]: number[]): [number, number] => [
  640 + x * 101 - z * 13,
  220 - y * 50 + z * 31 + x * 1.5,
];
function path(indices: number[]) {
  const vertices = indices.map((i) => project(graphNodes[i]!));
  let d = `M${vertices[0]!.join(" ")}`;
  for (let i = 1; i < vertices.length; i++) {
    const [a, b] = [vertices[i - 1]!, vertices[i]!],
      mid = (a[0] + b[0]) / 2;
    d += `C${mid} ${a[1]},${mid} ${b[1]},${b[0]} ${b[1]}`;
  }
  return d;
}
export function SceneFallback({
  phase = "trace",
  width,
  height,
}: {
  phase?: GraphPhase;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      viewBox="0 0 1280 400"
      width={width}
      height={height}
      className="scene-fallback"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="graph-steel" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#d6e0f1" />
          <stop offset=".3" stopColor="#728bab" />
          <stop offset=".55" stopColor="#cad6ea" />
          <stop offset="1" stopColor="#405775" />
        </linearGradient>
        <linearGradient id="graph-rail">
          <stop stopColor="#506580" />
          <stop offset=".5" stopColor="#c5d1e3" />
          <stop offset="1" stopColor="#647b97" />
        </linearGradient>
        <radialGradient id="graph-floor">
          <stop stopColor="#27415d" stopOpacity=".3" />
          <stop offset="1" stopColor="#142136" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="640" cy="220" rx="520" ry="180" fill="url(#graph-floor)" />
      <path
        d={`M${project([-2.6, -0.3, -2.8]).join(" ")}L${project([2.1, -0.3, -2.8]).join(" ")}L${project([2.1, -0.3, 2.8]).join(" ")}L${project([-2.6, -0.3, 2.8]).join(" ")}Z`}
        stroke={phase === "trace" ? "#53729e" : "#27364c"}
        strokeDasharray="4 5"
      />
      {graphLinks.map(([a, b]) => (
        <path
          key={`${a}-${b}`}
          d={path([a!, b!])}
          stroke="#506580"
          strokeWidth="1.5"
        />
      ))}
      {graphRoutes.map((route, i) => (
        <g key={i}>
          <path
            d={path(route)}
            stroke="#070a11"
            strokeWidth="9"
            transform="translate(0 5)"
          />
          <path d={path(route)} stroke="url(#graph-rail)" strokeWidth="4" />
          <path
            d={path(route)}
            stroke="#adc4e7"
            strokeOpacity=".25"
            strokeWidth=".8"
            transform="translate(0 -1)"
          />
        </g>
      ))}
      <path
        d={path([10, 13, 16])}
        stroke={phase === "signal" ? "#ffb196" : "#b87056"}
        strokeWidth="3"
      />
      {graphNodes.map((p, i) => {
        const [x, y] = project(p),
          color = riskNodes.has(i)
            ? phase === "signal"
              ? "#ffc4aa"
              : "#e49273"
            : i > 8
              ? "#76d6c4"
              : phase === "source"
                ? "#afc5ff"
                : "#678de7";
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <ellipse cy="10" rx="22" ry="7" fill="#050911" opacity=".6" />
            <path d="M-17 0v7c0 11 34 11 34 0V0" fill="url(#graph-steel)" />
            <ellipse
              rx="17"
              ry="8"
              fill="#8093b1"
              stroke="#b6c5dd"
              strokeWidth="1.3"
            />
            <ellipse cy="-1" rx="10" ry="4.5" fill={color} />
            <ellipse cy="-2" rx="4" ry="1.5" fill="#eef4ff" opacity=".75" />
          </g>
        );
      })}
    </svg>
  );
}
