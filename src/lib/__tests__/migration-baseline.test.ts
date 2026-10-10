import { test } from "node:test";
import assert from "node:assert/strict";

import { classifyMigrations, parseMigration } from "../../../scripts/migration-baseline.mjs";

const empty = () => ({ tables: new Set<string>(), columns: new Set<string>(), types: new Set<string>(), enumValues: new Set<string>() });

const MIGRATIONS = [
  { name: "001_init", sql: `CREATE TYPE "Status" AS ENUM ('A', 'B');\n-- t\nCREATE TABLE "guests" (\n    "id" TEXT NOT NULL,\n    "name" TEXT NOT NULL,\n\n    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")\n);` },
  { name: "002_more", sql: `ALTER TYPE "Status" ADD VALUE 'C';\nALTER TABLE "guests" ADD COLUMN "phone" TEXT,\nADD COLUMN "old" TEXT;` },
  { name: "003_drop_old", sql: `ALTER TABLE "guests" DROP COLUMN "old";\nCREATE TABLE "weddings" (\n    "id" TEXT NOT NULL\n);` },
];

function dbAt(step: number) {
  const s = empty();
  if (step >= 1) {
    s.types.add("Status");
    s.enumValues.add("Status.A");
    s.enumValues.add("Status.B");
    s.tables.add("guests");
    s.columns.add("guests.id");
    s.columns.add("guests.name");
  }
  if (step >= 2) {
    s.enumValues.add("Status.C");
    s.columns.add("guests.phone");
    s.columns.add("guests.old");
  }
  if (step >= 3) {
    s.columns.delete("guests.old");
    s.tables.add("weddings");
    s.columns.add("weddings.id");
  }
  return s;
}

test("lê tipos, tabelas, colunas e valores de enum de uma migration", () => {
  const { expects } = parseMigration(MIGRATIONS[0].sql);
  assert.deepEqual(
    expects.map((e) => (e.kind === "column" ? `${e.table}.${e.name}` : e.name)),
    ["Status", "guests", "guests.id", "guests.name"],
  );
});

test("banco em cada ponto da sequência: o que já foi aplicado e o que falta", () => {
  assert.deepEqual(classifyMigrations(MIGRATIONS, dbAt(1)).applied, ["001_init"]);
  assert.deepEqual(classifyMigrations(MIGRATIONS, dbAt(1)).pending, ["002_more", "003_drop_old"]);
  assert.deepEqual(classifyMigrations(MIGRATIONS, dbAt(2)).applied, ["001_init", "002_more"]);
  assert.deepEqual(classifyMigrations(MIGRATIONS, dbAt(3)).pending, []);
});

test("coluna removida por migration posterior não conta como falta na anterior", () => {
  const result = classifyMigrations(MIGRATIONS, dbAt(3));
  assert.equal(result.applied.length, 3);
});

test("migration aplicada pela metade interrompe", () => {
  const s = dbAt(2);
  s.columns.delete("guests.phone");
  assert.throws(() => classifyMigrations(MIGRATIONS, s), /pela metade/);
});

test("objetos de migration nova sem a anterior interrompe", () => {
  const s = dbAt(3);
  s.tables.delete("guests");
  for (const c of [...s.columns]) if (c.startsWith("guests.")) s.columns.delete(c);
  s.types.delete("Status");
  s.enumValues.clear();
  assert.throws(() => classifyMigrations(MIGRATIONS, s), /falta o que a 001_init cria/);
});
