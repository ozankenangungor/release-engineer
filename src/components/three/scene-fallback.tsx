import {
  graphNodes,
  graphRoutes,
  graphLinks,
  riskNodes,
} from "./graph-topology";
const project = ([x, y, z]: number[]) => [
  400 + ((x ?? 0) * 0.86 - (z ?? 0) * 0.4) * 68,
  355 + (-(y ?? 0) + (z ?? 0) * 0.26 + (x ?? 0) * 0.12) * 68,
];
function boundary(z: number) {
  return [
    [-1.13, 1.65, z],
    [1.13, 1.65, z],
    [1.13, -1.65, z],
    [-1.13, -1.65, z],
  ]
    .map((point) => project(point).join(","))
    .join(" ");
}
export function SceneFallback() {
  return (
    <svg
      viewBox="0 0 800 700"
      fill="none"
      className="scene-fallback"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="signal-metal"
          x1="280"
          y1="210"
          x2="515"
          y2="515"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#d5e4fa" />
          <stop offset=".3" stopColor="#6b7d9b" />
          <stop offset=".6" stopColor="#1c2b40" />
          <stop offset="1" stopColor="#6f91b1" />
        </linearGradient>
        <linearGradient id="signal-glass">
          <stop stopColor="#759dff" stopOpacity=".08" />
          <stop offset="1" stopColor="#315DFF" stopOpacity=".02" />
        </linearGradient>
        <linearGradient id="signal-line">
          <stop stopColor="#315dff" />
          <stop offset="1" stopColor="#35d7c4" />
        </linearGradient>
        <radialGradient id="signal-halo">
          <stop stopColor="#397fff" stopOpacity=".25" />
          <stop offset="1" stopColor="#397fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="405" cy="370" rx="320" ry="260" fill="url(#signal-halo)" />
      <g stroke="#536780" strokeOpacity=".18">
        {Array.from({ length: 10 }, (_, i) => (
          <path
            key={i}
            d={`M${35 + i * 55} 530l240 -135M${35 + i * 55} 530l-100 -70`}
          />
        ))}
      </g>
      {graphLinks.map(([a, b]) => (
        <path
          key={`${a}-${b}`}
          d={`M${project(graphNodes[a!]!).join(" ")} L${project(graphNodes[b!]!).join(" ")}`}
          stroke="#50647e"
          strokeOpacity=".5"
        />
      ))}
      {[-0.85, 0, 0.85].map((z, i) => (
        <g key={z}>
          <polygon
            points={boundary(z)}
            fill="url(#signal-glass)"
            stroke="url(#signal-metal)"
            strokeWidth={i === 1 ? 7 : 3}
          />
          <polygon
            points={boundary(z + 0.07)}
            stroke="#9dbcf0"
            strokeOpacity=".35"
            strokeWidth=".8"
          />
        </g>
      ))}
      {graphRoutes.map((route, i) => (
        <polyline
          key={i}
          points={route
            .map((index) => project(graphNodes[index]!).join(","))
            .join(" ")}
          stroke={i === 1 ? "#ff795d" : "url(#signal-line)"}
          strokeOpacity={i === 1 ? ".75" : ".85"}
          strokeWidth="1.7"
        />
      ))}
      {graphNodes.map((node, i) => {
        const [x, y] = project(node);
        const color = riskNodes.has(i)
          ? "#ff795d"
          : i > 8
            ? "#35d7c4"
            : "#93b8ff";
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="16" fill={color} fillOpacity=".045" />
            <circle cx={x} cy={y} r="8" stroke={color} strokeOpacity=".38" />
            <path d={`M${x! - 5} ${y}l5 -5 5 5-5 5Z`} fill={color} />
            <circle cx={x} cy={y} r="2" fill="#e7f2ff" />
          </g>
        );
      })}
      <g stroke="#afc8ef" strokeOpacity=".6">
        <path d="M331 223v-20h20M475 503v20h-20" />
        <path d="M402 232v250" strokeDasharray="2 8" strokeOpacity=".2" />
      </g>
    </svg>
  );
}
