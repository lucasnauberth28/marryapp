import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { classificarCaminho, ehCaminhoDeAdminDaPlataforma } from "../painel/route-access.ts";

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
  const sem = rotas.filter((r) => classificarCaminho(r) === "unknown");
  assert.deepEqual(sem, [], `rotas fora de src/lib/route-access.ts: ${sem.join(", ")}`);
});

test("classifica públicas, de sessão e protegidas", () => {
  assert.equal(classificarCaminho("/"), "public");
  assert.equal(classificarCaminho("/login"), "public");
  assert.equal(classificarCaminho("/casamento/ana-e-bia/rsvp"), "public");
  assert.equal(classificarCaminho("/api/webhooks/mercadopago"), "public");
  assert.equal(classificarCaminho("/boas-vindas"), "session");
  assert.equal(classificarCaminho("/dashboard"), "protected");
  assert.equal(classificarCaminho("/convidados/importar"), "protected");
  assert.equal(classificarCaminho("/fornecedor/agenda"), "protected");
  assert.equal(classificarCaminho("/api/export/guests"), "protected");
});

test("a administração da plataforma é protegida (página e API), sem confundir com prefixos parecidos", () => {
  for (const p of ["/admin", "/admin/casais", "/admin/casais/abc", "/admin/planos/catalogo", "/api/admin/sessao"]) {
    assert.equal(classificarCaminho(p), "protected", p);
  }
  for (const p of ["/adminx", "/administracao", "/admin-painel", "/api/adminx"]) {
    assert.equal(classificarCaminho(p), "unknown", p);
  }
  assert.equal(ehCaminhoDeAdminDaPlataforma("/admin"), true);
  assert.equal(ehCaminhoDeAdminDaPlataforma("/admin/saude"), true);
  assert.equal(ehCaminhoDeAdminDaPlataforma("/adminx"), false);
  assert.equal(ehCaminhoDeAdminDaPlataforma("/api/admin/sessao"), false, "a API confere o acesso na própria rota");
  assert.equal(ehCaminhoDeAdminDaPlataforma("/dashboard"), false);
});

test("caminho que não é do app é desconhecido (compara por segmento)", () => {
  for (const p of ["/wp-admin", "/administrator", "/dashboardx", "/fornecedoresx", "/api", "/api/qualquer", "/convidadosx/a", "/.env"]) {
    assert.equal(classificarCaminho(p), "unknown", p);
  }
});
