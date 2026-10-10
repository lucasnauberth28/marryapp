// Adoção de um banco que já existia antes do histórico de migrations do Prisma (erro P3005).
// Lê o SQL de cada migration, descobre o que ela cria (tipos, tabelas, colunas) e confere no banco
// quais já foram aplicadas. Só dá certo se o banco estiver em um ponto exato da sequência:
// as primeiras migrations 100% presentes e as seguintes 100% ausentes. Qualquer coisa no meio
// (uma tabela criada pela metade, uma coluna faltando) interrompe o deploy sem tocar em nada.

/** Tira comentários `-- ...` e quebra o SQL em comandos. */
function statements(sql) {
  const clean = sql
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
  return clean.split(";").map((s) => s.trim()).filter(Boolean);
}

/** O que a migration deixa no banco e o que ela remove. */
export function parseMigration(sql) {
  const expects = [];
  const removes = [];
  for (const stmt of statements(sql)) {
    let m = stmt.match(/^CREATE TYPE "(\w+)" AS ENUM/i);
    if (m) {
      expects.push({ kind: "type", name: m[1] });
      continue;
    }
    m = stmt.match(/^ALTER TYPE "(\w+)" ADD VALUE (?:IF NOT EXISTS )?'([^']+)'/i);
    if (m) {
      expects.push({ kind: "enumValue", type: m[1], value: m[2] });
      continue;
    }
    m = stmt.match(/^CREATE TABLE "(\w+)"\s*\(([\s\S]*)\)\s*$/i);
    if (m) {
      expects.push({ kind: "table", name: m[1] });
      for (const line of m[2].split("\n")) {
        const col = line.match(/^\s*"(\w+)"\s+\S/);
        if (col) expects.push({ kind: "column", table: m[1], name: col[1] });
      }
      continue;
    }
    m = stmt.match(/^ALTER TABLE "(\w+)"/i);
    if (m) {
      const dropped = [...stmt.matchAll(/DROP COLUMN\s+(?:IF EXISTS\s+)?"(\w+)"/gi)].map((d) => d[1]);
      for (const name of dropped) removes.push({ kind: "column", table: m[1], name });
      for (const add of stmt.matchAll(/ADD COLUMN\s+(?:IF NOT EXISTS\s+)?"(\w+)"/gi)) {
        // Coluna recriada no mesmo comando (troca de tipo): já existia antes, não diz nada sobre a migration.
        if (!dropped.includes(add[1])) expects.push({ kind: "column", table: m[1], name: add[1] });
      }
      continue;
    }
    m = stmt.match(/^DROP TABLE (?:IF EXISTS )?"(\w+)"/i);
    if (m) removes.push({ kind: "table", name: m[1] });
  }
  return { expects, removes };
}

const key = (e) =>
  e.kind === "column" ? `column:${e.table}.${e.name}` : e.kind === "enumValue" ? `enumValue:${e.type}.${e.value}` : `${e.kind}:${e.name}`;

/**
 * migrations: [{ name, sql }] em ordem. schema: { tables:Set, columns:Set("t.c"), types:Set, enumValues:Set("T.V") }.
 * Devolve { applied:[nomes], pending:[nomes] } ou lança Error explicando a inconsistência.
 */
export function classifyMigrations(migrations, schema) {
  const parsed = migrations.map((mig) => ({ name: mig.name, ...parseMigration(mig.sql) }));

  const exists = (e) => {
    if (e.kind === "type") return schema.types.has(e.name);
    if (e.kind === "enumValue") return schema.enumValues.has(`${e.type}.${e.value}`);
    if (e.kind === "table") return schema.tables.has(e.name);
    return schema.columns.has(`${e.table}.${e.name}`);
  };

  const states = parsed.map((mig, i) => {
    // O que uma migration posterior removeu não pode ser exigido da anterior.
    const laterRemoved = new Set(parsed.slice(i + 1).flatMap((later) => later.removes.map(key)));
    const wanted = mig.expects.filter((e) => !laterRemoved.has(key(e)));
    if (wanted.length === 0) return { name: mig.name, state: "unknown", missing: [] };
    const missing = wanted.filter((e) => !exists(e));
    const state = missing.length === 0 ? "applied" : missing.length === wanted.length ? "pending" : "partial";
    return { name: mig.name, state, missing: missing.map(key) };
  });

  const lastApplied = states.map((s) => s.state).lastIndexOf("applied");
  for (let i = 0; i < states.length; i++) {
    const s = states[i];
    if (s.state === "partial") {
      throw new Error(`A migration ${s.name} está aplicada pela metade no banco (faltam: ${s.missing.slice(0, 8).join(", ")}).`);
    }
    if (i < lastApplied && s.state === "pending") {
      throw new Error(`O banco tem objetos de migrations mais novas, mas falta o que a ${s.name} cria (${s.missing.slice(0, 8).join(", ")}).`);
    }
  }

  return {
    applied: states.slice(0, lastApplied + 1).map((s) => s.name),
    pending: states.slice(lastApplied + 1).map((s) => s.name),
  };
}
