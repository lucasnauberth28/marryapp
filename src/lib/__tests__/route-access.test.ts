import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPath } from "../route-access.ts";

const APP_DIR = fileURLToPath(new URL("../../app", import.meta.url));

/** Há uma página ou rota de API em algum lugar dentro da pasta? */
function hasRoute(dir: string): boolean {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (hasRoute(full)) return true;
    } else if (/^(page|route)\.(tsx|ts|jsx|js)$/.test(name)) {
      return true;
    }
  }
  return false;
}

/** Primeiro nível de rotas: entra nos grupos "(x)" e ignora pastas privadas "_x". */
function topLevelSegments(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory() || name.startsWith("_") || name.startsWith("@")) continue;
    if (name.startsWith("(")) out.push(...topLevelSegments(full, prefix));
    else if (name === "api" && prefix === "") out.push(...readdirSync(full).filter((n) => statSync(join(full, n)).isDirectory()).map((n) => `/api/${n}`));
    else if (!name.startsWith("[") && hasRoute(full)) out.push(`${prefix}/${name}`);
  }
  return out;
}

test("toda rota de primeiro nível do app está classificada (senão o proxy daria 404 nela)", () => {
  assert.ok(existsSync(APP_DIR));
  const rotas = topLevelSegments(APP_DIR);
  assert.ok(rotas.length > 20, "deveria achar as rotas do app");
  const sem = rotas.filter((r) => classifyPath(r) === "unknown");
  assert.deepEqual(sem, [], `rotas fora de src/lib/route-access.ts: ${sem.join(", ")}`);
});

test("classifica públicas, de sessão e protegidas", () => {
  assert.equal(classifyPath("/"), "public");
  assert.equal(classifyPath("/login"), "public");
  assert.equal(classifyPath("/casamento/ana-e-bia/rsvp"), "public");
  assert.equal(classifyPath("/api/webhooks/mercadopago"), "public");
  assert.equal(classifyPath("/boas-vindas"), "session");
  assert.equal(classifyPath("/dashboard"), "protected");
  assert.equal(classifyPath("/convidados/importar"), "protected");
  assert.equal(classifyPath("/fornecedor/agenda"), "protected");
  assert.equal(classifyPath("/api/export/guests"), "protected");
});

test("caminho que não é do app é desconhecido (compara por segmento)", () => {
  for (const p of ["/wp-admin", "/admin", "/dashboardx", "/fornecedoresx", "/api", "/api/qualquer", "/convidadosx/a", "/.env"]) {
    assert.equal(classifyPath(p), "unknown", p);
  }
});
