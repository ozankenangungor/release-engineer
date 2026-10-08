import fs from "node:fs";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
import { clerkSetup } from "@clerk/testing/playwright";

const [file, base = "http://localhost:3105"] = process.argv.slice(2);
if (!file) throw new Error("Pass a private development environment file.");
const env = parseEnv(fs.readFileSync(file, "utf8"));
if (!env.CLERK_SECRET_KEY?.startsWith("sk_test_"))
  throw new Error("Development instance required.");
process.env.CLERK_SECRET_KEY = env.CLERK_SECRET_KEY;
process.env.CLERK_PUBLISHABLE_KEY = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
await clerkSetup();
const child = spawn("pnpm", ["test:browser"], {
  stdio: ["inherit", "pipe", "pipe"],
  env: { ...process.env, PLAYWRIGHT_BASE_URL: base },
});
const redact = (data) =>
  String(data).replace(
    /(__clerk_db_jwt|clerk_testing_token)=[^&\s)]+/g,
    "$1=[redacted]",
  );
child.stdout.on("data", (data) => process.stdout.write(redact(data)));
child.stderr.on("data", (data) => process.stderr.write(redact(data)));
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
