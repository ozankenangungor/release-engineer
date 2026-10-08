import fs from "node:fs";
import { parseEnv } from "node:util";
import { neon } from "@neondatabase/serverless";

// Explicit file selection prevents accidentally migrating a different environment.
const file = process.argv[2];
if (!file)
  throw new Error(
    "Usage: node scripts/migrate-accounts.mjs <private env file>",
  );
const env = parseEnv(fs.readFileSync(file, "utf8"));
if (!env.DATABASE_URL_UNPOOLED)
  throw new Error("Direct database connection required.");
const sql = neon(env.DATABASE_URL_UNPOOLED);
const source = fs.readFileSync(
  new URL("../db/migrations/001_accounts.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  source.split("-- statement-breakpoint").map((s) => sql.query(s)),
  {
    fetchOptions: { signal: AbortSignal.timeout(30000) },
  },
);
console.log(
  "Accounts migration applied. No PR contents or reports are stored.",
);
