// One authored topology for the procedural renderer and its immediate SVG drawing.
// These positions illustrate source changes, context boundaries and review signals.
export type GraphPhase = "source" | "trace" | "signal";
export const graphStages: {
  id: GraphPhase;
  label: string;
  description: string;
}[] = [
  {
    id: "source",
    label: "Source",
    description: "A public pull request. A specific set of changes.",
  },
  {
    id: "trace",
    label: "Context",
    description: "Trace relationships within a defined review boundary.",
  },
  {
    id: "signal",
    label: "Findings",
    description: "Potential risks become evidence to inspect.",
  },
];
export const graphNodes: [number, number, number][] = [
  [-4.8, 0.45, -1.2],
  [-4.6, -0.1, 1.3],
  [-3.8, 1.5, -2.2],
  [-3.1, 0.45, -1.2],
  [-3.0, -0.1, 1.3],
  [-2.6, 1.5, -2.2],
  [-1.9, 0.55, -0.6],
  [-1.9, 0.1, 1.0],
  [-1.2, 1.3, -1.2],
  [1.6, 0.55, -0.6],
  [1.7, 0.1, 1.0],
  [1.5, 1.3, -1.2],
  [3.0, 0.55, -0.6],
  [3.1, 0.1, 1.0],
  [2.8, 1.3, -1.2],
  [4.2, 0.55, -1.0],
  [4.5, 0.1, 1.6],
  [4.0, 1.3, -2.0],
];
export const graphRoutes = [
  [0, 3, 6, 9, 12, 15],
  [1, 4, 7, 10, 13, 16],
  [2, 5, 8, 11, 14, 17],
];
export const graphLinks = [
  [3, 5],
  [4, 6],
  [6, 8],
  [9, 11],
  [10, 12],
  [11, 13],
  [12, 14],
  [15, 17],
];
export const riskNodes = new Set([10, 13, 16]);
