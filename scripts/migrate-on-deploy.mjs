// Aplica as migrations do Prisma no deploy de PRODUÇÃO da Vercel, antes do `next build`.
// - Previews (branches) e builds locais não tocam no banco.
// - Se a migration falhar, o build falha e a versão anterior continua no ar.
// - Usa DIRECT_URL (prisma.config.ts): no Supabase, a conexão "Session pooler", porta 5432.
// - Banco que já existia antes do histórico de migrations (P3005) é adotado automaticamente:
//   as migrations que o banco já reflete são marcadas como aplicadas e só as novas rodam.
import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { classifyMigrations } from "./migration-baseline.mjs";

const env = process.env.VERCEL_ENV;

if (env !== "production") {
  console.log(`[migrate-on-deploy] Migrations ignoradas (VERCEL_ENV=${env ?? "local"}).`);
  process.exit(0);
}

if (!process.env.DIRECT_URL) {
  console.error("[migrate-on-deploy] DIRECT_URL não configurada na Vercel: não dá para aplicar as migrations.");
  process.exit(1);
}

if (/:6543\//.test(process.env.DIRECT_URL)) {
  console.error(
    "[migrate-on-deploy] DIRECT_URL aponta para a porta 6543 (Transaction pooler), que não suporta migrations. " +
      "Use a string do Session pooler do Supabase (porta 5432).",
  );
  process.exit(1);
}

const MIGRATIONS_DIR = "prisma/migrations";

async function readSchema(client) {
  const rows = async (sql) => (await client.query(sql)).rows;
  const tables = await rows(
    "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'",
  );
  const columns = await rows("select table_name, column_name from information_schema.columns where table_schema = 'public'");
  const types = await rows(
    "select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typtype = 'e'",
  );
  const enumValues = await rows(
    "select t.typname, e.enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public'",
  );
  return {
    tables: new Set(tables.map((r) => r.table_name)),
    columns: new Set(columns.map((r) => `${r.table_name}.${r.column_name}`)),
    types: new Set(types.map((r) => r.typname)),
    enumValues: new Set(enumValues.map((r) => `${r.typname}.${r.enumlabel}`)),
  };
}

/** Banco com tabelas mas sem histórico do Prisma: descobre até onde ele já está e registra isso. */
async function adoptExistingDatabase() {
  const client = new pg.Client({ connectionString: process.env.DIRECT_URL, connectionTimeoutMillis: 15000 });
  await client.connect();
  try {
    const history = await client.query("select to_regclass('public._prisma_migrations') as t");
    if (history.rows[0].t) return;

    const schema = await readSchema(client);
    if (schema.tables.size === 0) return; // banco vazio: o fluxo normal cria tudo

    const names = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    const migrations = names.map((name) => ({ name, sql: readFileSync(join(MIGRATIONS_DIR, name, "migration.sql"), "utf8") }));

    const { applied, pending } = classifyMigrations(migrations, schema);
    console.log("[migrate-on-deploy] Banco existente sem histórico do Prisma (P3005): adotando.");
    console.log(`[migrate-on-deploy]   já refletidas no banco: ${applied.length ? applied.join(", ") : "nenhuma"}`);
    console.log(`[migrate-on-deploy]   a aplicar agora: ${pending.length ? pending.join(", ") : "nenhuma"}`);

    for (const name of applied) {
      execSync(`npx prisma migrate resolve --applied ${name}`, { stdio: "inherit" });
    }
  } finally {
    await client.end();
  }
}

try {
  await adoptExistingDatabase();
} catch (error) {
  console.error(`[migrate-on-deploy] Não foi possível adotar o banco existente: ${error instanceof Error ? error.message : error}`);
  console.error("[migrate-on-deploy] Nada foi alterado. Confira o schema do banco ou faça o baseline manual (https://pris.ly/d/migrate-baseline).");
  process.exit(1);
}

console.log("[migrate-on-deploy] Aplicando migrations pendentes no banco de produção…");
execSync("npx prisma migrate deploy", { stdio: "inherit" });
