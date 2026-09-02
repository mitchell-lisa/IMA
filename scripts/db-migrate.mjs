#!/usr/bin/env node
/**
 * Applies the Supabase migrations and seed to the database in DATABASE_URL.
 *
 *   DATABASE_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres npm run db:migrate
 *
 * Behavior:
 *   - Refuses to run if a conflicting public table (assessments, leads, events,
 *     producers, partners) exists with rows, unless --force-rename is given.
 *   - Empty conflicting tables from a different schema are renamed to
 *     legacy_<name> (non-destructive) when they lack the expected columns.
 *   - Runs 0001_init.sql, 0002_reporting_schema.sql, and seed/questions.sql in
 *     one transaction, then prints the resulting tables and views.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const forceRename = process.argv.includes("--force-rename");
const dryRun = process.argv.includes("--dry-run");

const EXPECTED = {
  assessments: ["results_token", "profile", "answers", "result"],
  leads: ["assessment_id", "consent_text_version", "lead_score"],
  events: ["assessment_id", "name", "properties"],
  producers: ["user_id", "is_active"],
  partners: ["code"],
};

const client = new pg.Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
try {
  await client.connect();
} catch (err) {
  console.error("could not connect:", err.message);
  process.exit(1);
}

async function columns(table) {
  const r = await client.query(
    "select column_name from information_schema.columns where table_schema='public' and table_name=$1",
    [table],
  );
  return r.rows.map((x) => x.column_name);
}

try {
  await client.query("begin");
  for (const [table, must] of Object.entries(EXPECTED)) {
    const cols = await columns(table);
    if (cols.length === 0) continue;
    const matches = must.every((c) => cols.includes(c));
    if (matches) {
      console.log(`public.${table}: already in expected shape, migration statements are idempotent`);
      continue;
    }
    const { rows } = await client.query(`select count(*)::int as n from public.${table}`);
    const n = rows[0].n;
    if (n > 0 && !forceRename) {
      throw new Error(`public.${table} exists with a different shape and ${n} row(s). Re-run with --force-rename to rename it to legacy_${table}.`);
    }
    console.log(`public.${table}: different shape (${n} rows) -> renaming to legacy_${table}`);
    if (!dryRun) await client.query(`alter table public.${table} rename to legacy_${table}`);
  }
  for (const file of ["migrations/0001_init.sql", "migrations/0002_reporting_schema.sql", "seed/questions.sql"]) {
    const sql = readFileSync(join(root, "supabase", file), "utf8");
    console.log(`applying ${file} (${sql.length} chars)`);
    if (!dryRun) await client.query(sql);
  }
  if (dryRun) {
    await client.query("rollback");
    console.log("dry run: rolled back");
  } else {
    await client.query("commit");
  }
  const t = await client.query(
    "select table_schema, table_name, table_type from information_schema.tables where table_schema in ('public','reporting') order by 1,2",
  );
  for (const r of t.rows) console.log(`${r.table_schema}.${r.table_name} (${r.table_type === "VIEW" ? "view" : "table"})`);
  const q = await client.query("select count(*)::int as n from reporting.questions").catch(() => ({ rows: [{ n: "n/a" }] }));
  console.log(`reporting.questions rows: ${q.rows[0].n}`);
} catch (err) {
  await client.query("rollback").catch(() => {});
  console.error("migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
