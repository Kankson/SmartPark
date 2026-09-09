// Drops the local SQLite database so the next server start re-seeds it from
// src/server/seed.ts. The schema itself lives in src/server/schema.sql and is
// applied on connect, so there is nothing to migrate here.
import { rmSync } from "node:fs";
import { join } from "node:path";

const base = process.env.SMARTPARK_DB_PATH ?? join(process.cwd(), ".data", "smartpark.db");

if (base === ":memory:") {
  console.log("SMARTPARK_DB_PATH is :memory:; there is no database file to reset.");
  process.exit(0);
}

// WAL mode keeps two sidecar files next to the database.
for (const file of [base, `${base}-wal`, `${base}-shm`]) {
  rmSync(file, { force: true });
}

console.log(`Removed ${base}. The next \`pnpm dev\` will recreate and seed it.`);
