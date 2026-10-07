import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const build = spawnSync(process.execPath, [require.resolve("typescript/bin/tsc"), "--project", "evals/tsconfig.json"], { cwd: root, stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 2);
mkdirSync(resolve(root, ".eval-build"), { recursive: true });
writeFileSync(resolve(root, ".eval-build/package.json"), '{"type":"commonjs"}\n');
const run = spawnSync(process.execPath, ["--conditions=react-server", ".eval-build/evals/entry.js", ...process.argv.slice(2)], { cwd: root, stdio: "inherit" });
process.exitCode = run.status ?? 2;
