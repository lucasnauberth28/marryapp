import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Toda Server Action da administração (dinheiro) precisa chamar o guard ANTES de qualquer acesso ao banco.
// Teste de código-fonte: pega a ação nova esquecida sem guard (o acesso negado real é coberto nos e2e).

const FILES = [
  "admin-fornecedores-actions.ts",
  "admin-planos-actions.ts",
  "domain-admin-actions.ts",
  "coupon-actions.ts",
  "subscription-admin-actions.ts",
];

const GUARDS = ["exigirAdminDaPlataforma()", "somenteAdmin()", "salvarConfiguracaoDaPlataforma("];

for (const file of FILES) {
  test(`${file}: cada ação confere a administração antes de tocar no banco`, () => {
    const source = readFileSync(fileURLToPath(new URL(`../${file}`, import.meta.url)), "utf8");
    assert.match(source, /^"use server";/, "arquivo de ações do servidor");
    const parts = source.split(/^export async function /m).slice(1);
    assert.ok(parts.length > 0, "tem ações exportadas");
    for (const part of parts) {
      const name = part.slice(0, part.indexOf("("));
      const guard = Math.min(...GUARDS.map((g) => (part.indexOf(g) === -1 ? Number.POSITIVE_INFINITY : part.indexOf(g))));
      assert.ok(Number.isFinite(guard), `${name}: sem guard`);
      const db = part.indexOf("prisma.");
      assert.ok(db === -1 || guard < db, `${name}: o guard vem depois do acesso ao banco`);
    }
  });

  test(`${file}: nenhuma ação usa a permissão antiga por caminho`, () => {
    const source = readFileSync(fileURLToPath(new URL(`../${file}`, import.meta.url)), "utf8");
    assert.ok(!source.includes("exigirPermissaoDoCaminho"), "troque por exigirAdminDaPlataforma");
  });
}
