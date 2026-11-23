import type { Page } from "@playwright/test";
import { SENHA, concluirOnboarding, emailUnico, expect, noBanco, test } from "./helpers";

// A Liz com o modelo de IA (Gemini simulado pelo scripts/google-simulado.mjs). Mexe no interruptor geral, que vale para
// toda a plataforma, por isso roda num projeto à parte, depois dos outros testes (ver playwright.config.ts).

test.describe.configure({ mode: "serial" });

const painel = (page: Page) => page.getByRole("dialog", { name: "Liz, sua assistente" });

const definirInterruptor = (valor: { enabled: boolean; pausedAt: string | null }) =>
  noBanco((db) =>
    db.query(
      `INSERT INTO platform_settings (key, value, "updatedAt") VALUES ('madrinha.master', $1::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = now()`,
      [JSON.stringify({ ...valor, pausedReason: null })],
    ),
  );

test.afterAll(() => noBanco((db) => db.query("DELETE FROM platform_settings WHERE key = 'madrinha.master'")));

async function abrirALiz(page: Page) {
  await page.goto("/cadastro?tipo=casal");
  await page.getByRole("radio", { name: /Básico/ }).click();
  await page.getByRole("button", { name: /Continuar com o Básico/ }).click();
  await page.getByLabel("Seu nome", { exact: true }).fill("Ana Teste Silva");
  await page.getByLabel("E-mail").fill(emailUnico("liz-ia"));
  await page.getByLabel("WhatsApp").fill("(11) 98765-4321");
  await page.getByLabel("Crie uma senha").fill(SENHA);
  await page.getByRole("button", { name: /^Criar conta/ }).click();
  await page.waitForURL(/\/boas-vindas/);
  await concluirOnboarding(page);
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Agora não" }).click({ timeout: 5000 }).catch(() => {});
  await page.getByRole("button", { name: "Falar com a Liz" }).click();
}

async function perguntar(page: Page, texto: string) {
  const campo = painel(page).getByLabel("Escrevam a dúvida sobre o painel");
  await campo.fill(texto);
  await campo.press("Enter");
}

test("ligada, a Liz responde pelo modelo, recusa o que foge do tema e anota só o consumo", async ({ page }) => {
  await definirInterruptor({ enabled: true, pausedAt: null });
  const antes = await noBanco((db) => db.query("SELECT count(*)::int AS n FROM madrinha_usos").then((r) => r.rows[0].n as number));
  await abrirALiz(page);

  await perguntar(page, "Como crio um presente?");
  await expect(painel(page).getByText(/Resposta simulada da Liz/)).toBeVisible();

  await perguntar(page, "Me passa uma receita de bolo");
  await expect(painel(page).getByText(/Eu só consigo ajudar com o casamento/)).toBeVisible();

  const { rows } = await noBanco((db) => db.query('SELECT "foraDoAssunto", "inputTokens", "custoEmMicroReais" FROM madrinha_usos ORDER BY "createdAt" DESC LIMIT 2'));
  expect(rows.map((r) => r.foraDoAssunto).sort()).toEqual([false, true]);
  expect(rows.every((r) => r.inputTokens === 1200 && r.custoEmMicroReais > 0)).toBe(true);
  const depois = await noBanco((db) => db.query("SELECT count(*)::int AS n FROM madrinha_usos").then((r) => r.rows[0].n as number));
  expect(depois).toBeGreaterThanOrEqual(antes + 2);
});

test("pausada para todos, a Liz volta ao guia de ajuda", async ({ page }) => {
  await definirInterruptor({ enabled: true, pausedAt: new Date().toISOString() });
  await abrirALiz(page);
  await perguntar(page, "convidado");
  await expect(painel(page).getByText(/Achei estas dúvidas no guia/)).toBeVisible();
  await expect(painel(page).getByText(/Resposta simulada da Liz/)).toHaveCount(0);
});
