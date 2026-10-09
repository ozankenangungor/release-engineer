import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = fileURLToPath(new URL("../.pilot-build/", import.meta.url));
mkdirSync(output, { recursive: true });
writeFileSync(`${output}/package.json`, '{"type":"commonjs"}\n');
const compile = spawnSync(process.execPath, [
  `${root}/node_modules/typescript/bin/tsc`, "--module", "commonjs", "--moduleResolution", "node",
  "--target", "ES2022", "--esModuleInterop", "--skipLibCheck", "--strict", "--outDir", output,
  "--rootDir", root, `${root}/scripts/summarize-pilot.ts`,
], { cwd: root, stdio: "inherit" });
if (compile.status !== 0) process.exit(compile.status ?? 2);
const run = spawnSync(process.execPath, [`${output}/scripts/summarize-pilot.js`, ...process.argv.slice(2)], {
  cwd: root, stdio: "inherit",
});
process.exit(run.status ?? 2);
