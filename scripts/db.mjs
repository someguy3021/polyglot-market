// pnpm db:migrate | db:seed | db:reset — общие SQL-миграции + сиды (ADR-002).
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { makePool } from "./lib/pg.mjs";
import { pathToFileURL } from "node:url";

const MIGRATIONS_DIR = join(import.meta.dirname, "..", "shared", "db", "migrations");
const SEEDS_ENTRY = join(import.meta.dirname, "..", "shared", "db", "seeds", "seed.mjs");
const cmd = process.argv[2] ?? "migrate";
const force = process.argv.includes("--force");

const pool = makePool();

if (cmd === "migrate") {
  await migrate();
} else if (cmd === "seed") {
  await seed();
} else if (cmd === "reset") {
  console.log("db: пересоздание схемы…");
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await migrate();
  await seed();
} else {
  console.log("использование: node scripts/db.mjs migrate|seed|reset [--force]");
  process.exit(1);
}

await pool.end();

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  if (files.length === 0) {
    console.log("migrate: миграций нет.");
    return;
  }
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const checksum = createHash("md5").update(sql).digest("hex");
    const applied = await pool.query("SELECT checksum FROM schema_migrations WHERE name = $1", [file]);
    if (applied.rowCount > 0) {
      if (applied.rows[0].checksum !== checksum) {
        throw new Error(`migrate: ${file} изменился после применения (ADR-002: миграции append-only). Пересоздайте БД: pnpm db:reset`);
      }
      console.log(`migrate: ${file} — уже применена`);
      continue;
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)", [file, checksum]);
      await client.query("COMMIT");
      console.log(`migrate: ${file} — применена`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`migrate: ${file} — ошибка: ${err.message}`);
    } finally {
      client.release();
    }
  }
}

async function seed() {
  if (!force) {
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM users");
    if (rows[0].n > 0) {
      console.log("seed: данные уже есть (pnpm db:seed --force — пересидировать).");
      return;
    }
  }
  await import(pathToFileURL(SEEDS_ENTRY).href);
}
