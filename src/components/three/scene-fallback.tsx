import {
  graphNodes,
  graphRoutes,
  graphLinks,
  riskNodes,
  type GraphPhase,
} from "./graph-topology";

const project = ([x = 0, y = 0, z = 0]: number[]): [number, number] => [
  550 + (x * 0.89 - z * 0.5) * 85,
  380 + (-y + x * 0.18 + z * 0.44) * 85,
];
const points = (vertices: number[][]) =>
  vertices.map((p) => project(p).join(",")).join(" ");
function surface(y: number, w = 4, h = 3.25) {
  return points([
    [-w / 2, y, -h / 2],
    [w / 2, y, -h / 2],
    [w / 2, y, h / 2],
    [-w / 2, y, h / 2],
  ]);
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
      viewBox="0 0 1100 740"
      width={width}
      height={height}
      fill="none"
      className="scene-fallback"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="signal-metal"
          x1="360"
          y1="260"
          x2="700"
          y2="560"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fbfdff" />
          <stop offset=".2" stopColor="#9babc0" />
          <stop offset=".43" stopColor="#f4f8ff" />
          <stop offset=".7" stopColor="#7f96b6" />
          <stop offset="1" stopColor="#dce8fa" />
        </linearGradient>
        <linearGradient
          id="signal-glass"
          x1="420"
          y1="200"
          x2="620"
          y2="570"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#d7e7ff" stopOpacity=".5" />
          <stop offset="1" stopColor="#87adff" stopOpacity=".12" />
        </linearGradient>
        <linearGradient
          id="signal-top"
          x1="380"
          y1="200"
          x2="700"
          y2="370"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#698fff" />
          <stop offset="1" stopColor="#315dff" />
        </linearGradient>
        <linearGradient id="signal-base">
          <stop stopColor="#2c4672" />
          <stop offset="1" stopColor="#122848" />
        </linearGradient>
        <linearGradient id="signal-line">
          <stop stopColor="#315dff" />
          <stop offset="1" stopColor="#169eaa" />
        </linearGradient>
        <radialGradient id="signal-shadow">
          <stop stopColor="#435a7e" stopOpacity=".22" />
          <stop offset="1" stopColor="#435a7e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="550" cy="540" rx="390" ry="135" fill="url(#signal-shadow)" />
      <g stroke="#c9d8eb" strokeOpacity=".35" strokeWidth=".7">
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d={`M${140 + i * 52} 660l430 -260M${140 + i * 52} 660l-350 -195`}
          />
        ))}
      </g>
      {graphLinks.map(([a, b]) => (
        <path
          key={`${a}-${b}`}
          d={`M${project(graphNodes[a!]!).join(" ")}L${project(graphNodes[b!]!).join(" ")}`}
          stroke="#9eb6d3"
          strokeOpacity=".5"
        />
      ))}
      <polygon
        points={points([
          [-2.1, -1.0, 1.74],
          [2.1, -1.0, 1.74],
          [2.1, -1.35, 1.74],
          [-2.1, -1.35, 1.74],
        ])}
        fill="url(#signal-base)"
      />
      <polygon
        points={points([
          [2.1, -1, -1.74],
          [2.1, -1, 1.74],
          [2.1, -1.35, 1.74],
          [2.1, -1.35, -1.74],
        ])}
        fill="#10284d"
      />
      <polygon
        points={surface(-1, 4.2, 3.48)}
        fill="#304d7b"
        stroke="url(#signal-metal)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <g stroke="url(#signal-metal)" strokeWidth="3">
        {[-1.8, 1.8].flatMap((x) =>
          [-1.42, 1.42].map((z) => (
            <path
              key={`${x}-${z}`}
              d={`M${project([x, -1, z]).join(" ")}L${project([x, 1.3, z]).join(" ")}`}
            />
          )),
        )}
      </g>
      {[-0.65, 0, 0.65, 1.25].map((y, i) => (
        <g key={y} opacity={phase === "trace" ? 1 : 0.88}>
          <polygon
            points={surface(y - 0.05)}
            fill="url(#signal-glass)"
            stroke="#738eaf"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <polygon
            points={surface(y)}
            fill={i === 3 ? "url(#signal-top)" : "url(#signal-glass)"}
            stroke="url(#signal-metal)"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <polygon
            points={surface(y + 0.015, 3.8, 3.05)}
            stroke="#ecf5ff"
            strokeOpacity=".7"
            strokeWidth=".8"
          />
        </g>
      ))}
      <g stroke="#edf4ff" strokeWidth="5" strokeLinejoin="round">
        <polyline
          points={points([
            [-1.35, 1.34, -0.85],
            [-0.85, 1.34, -0.85],
            [-0.1, 1.34, 0],
            [-0.85, 1.34, 0.85],
            [-1.35, 1.34, 0.85],
          ])}
        />
        <polyline
          points={points([
            [-0.1, 1.34, 0],
            [1.4, 1.34, 0],
          ])}
        />
        <polyline
          points={points([
            [0.65, 1.34, -0.9],
            [0.65, 1.34, 0.9],
          ])}
        />
      </g>
      {graphNodes.slice(0, 3).map(([x, y, z], i) => (
        <g key={i} opacity={phase === "source" ? 1 : 0.88}>
          <polygon
            points={points([
              [x - 0.75, y - 0.1, z - 0.5],
              [x + 0.45, y - 0.1, z - 0.5],
              [x + 0.45, y - 0.1, z + 0.45],
              [x - 0.75, y - 0.1, z + 0.45],
            ])}
            fill="#eef4fc"
            stroke="url(#signal-metal)"
            strokeWidth="3"
          />
          {[0, 1, 2, 3].map((line) => (
            <path
              key={line}
              d={`M${project([x - 0.58, y, z - 0.28 + line * 0.18]).join(" ")}L${project([x + (line === 2 ? 0.18 : 0.02), y, z - 0.28 + line * 0.18]).join(" ")}`}
              stroke={line === 2 ? "#315dff" : "#a2b6d1"}
              strokeWidth="2"
            />
          ))}
        </g>
      ))}
      {graphRoutes.map((route, i) => (
        <polyline
          key={i}
          points={route
            .map((index) => project(graphNodes[index]!).join(","))
            .join(" ")}
          stroke={i === 1 ? "#e77760" : "url(#signal-line)"}
          strokeWidth={phase === "signal" ? 2.8 : 1.8}
          strokeLinejoin="round"
          opacity=".85"
        />
      ))}
      {graphNodes.map((node, i) => {
        const [x, y] = project(node),
          color = riskNodes.has(i) ? "#eb755b" : i > 8 ? "#159a9f" : "#315dff";
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="11" fill={color} fillOpacity=".06" />
            <circle cx={x} cy={y} r="6" stroke={color} strokeOpacity=".4" />
            <circle cx={x} cy={y} r="3.4" fill={color} />
            <circle cx={x - 1} cy={y - 1} r="1" fill="white" />
          </g>
        );
      })}
    </svg>
  );
}
