import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const sources = ["README.md","evals/README.md","src/app/evidence/page.tsx","src/app/about/page.tsx"];
const targets = new Set();
for (const source of sources) {
  for (const match of readFileSync(path.join(root,source),"utf8").matchAll(/docs\/[A-Za-z0-9_./-]+\.md/g)) targets.add(match[0]);
}
const missing = [...targets].filter(target => !existsSync(path.join(root,target)));
if (missing.length) { console.error(`Missing evidence documents: ${missing.join(", ")}`); process.exitCode=1; }
else console.log(`Evidence document gate: ${targets.size} referenced documents exist.`);
