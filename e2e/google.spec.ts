import { SENHA, cadastrarCasal, emailUnico, entrar, expect, test } from "./helpers";
import type { BrowserContext } from "@playwright/test";

// Login e cadastro com o Google, contra o Google simulado (scripts/google-simulado.mjs): o fluxo OAuth inteiro
// (state, nonce, PKCE, id_token assinado) roda de verdade; só o Google é de mentira.

const GOOGLE = "http://localhost:4010";

/** Quem está "logado no Google" neste navegador. */
async function logadoNoGoogle(context: BrowserContext, perfil: { email: string; name?: string; verificado?: boolean }) {
  const valor = Buffer.from(JSON.stringify({ sub: `sub-${perfil.email}`, name: "Ana Teste Silva", ...perfil })).toString("base64url");
  await context.addCookies([{ name: "google_simulado", value: valor, url: GOOGLE }]);
}

test("casal novo cria a conta com o Google e depois entra só com ele", async ({ page, context }) => {
  const email = emailUnico("google");
  await logadoNoGoogle(context, { email });

  await page.goto("/cadastro?tipo=casal");
  await page.getByRole("radio", { name: /Básico/ }).click();
  await page.getByRole("button", { name: /Continuar com o Básico/ }).click();
  await page.getByRole("link", { name: "Criar conta com o Google" }).click();

  // Volta do Google já na etapa de dados, com o e-mail confirmado e sem pedir senha
  await expect(page.getByText("Conta do Google confirmada")).toBeVisible();
  await expect(page.getByLabel("E-mail")).toHaveValue(email);
  await expect(page.getByLabel("Crie uma senha")).toHaveCount(0);
  await page.getByLabel("WhatsApp").fill("(11) 98765-4321");
  await page.getByRole("button", { name: /^Criar conta/ }).click();
  await page.waitForURL(/\/boas-vindas/);

  // Sai e entra de novo, agora só com o Google
  await context.clearCookies({ name: "marryapp_admin_session" });
  await page.goto("/login");
  await page.getByRole("link", { name: "Continuar com o Google" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login") && url.port !== "4010");
  expect(new URL(page.url()).pathname).toMatch(/boas-vindas|dashboard/);
});

test("quem já tem conta com o mesmo e-mail entra nela, e a senha continua valendo", async ({ page, context }) => {
  const email = emailUnico("vinculo");
  await cadastrarCasal(page, email);
  await context.clearCookies({ name: "marryapp_admin_session" });

  await logadoNoGoogle(context, { email });
  await page.goto("/login");
  await page.getByRole("link", { name: "Continuar com o Google" }).click();
  await page.waitForURL(/\/(boas-vindas|dashboard)/);

  await context.clearCookies({ name: "marryapp_admin_session" });
  await entrar(page, email, SENHA);
  await expect(page).toHaveURL(/boas-vindas|dashboard/);
});

test("e-mail que o Google não confirmou não entra", async ({ page, context }) => {
  await logadoNoGoogle(context, { email: emailUnico("naoverificado"), verificado: false });
  await page.goto("/login");
  await page.getByRole("link", { name: "Continuar com o Google" }).click();
  await expect(page).toHaveURL(/\/login\?erro=google-email/);
  await expect(page.getByText(/ainda não confirmou o e-mail/)).toBeVisible();
});

test("desistir na tela do Google volta ao login com aviso", async ({ page, context }) => {
  await context.addCookies([{ name: "google_simulado_cancelar", value: "1", url: GOOGLE }]);
  await page.goto("/login");
  await page.getByRole("link", { name: "Continuar com o Google" }).click();
  await expect(page).toHaveURL(/\/login\?erro=google-cancelado/);
  await expect(page.getByText(/Você cancelou a entrada com o Google/)).toBeVisible();
});

test("a volta sem o fluxo iniciado neste navegador é recusada", async ({ page }) => {
  await page.goto("/api/auth/google/retorno?state=qualquer&code=qualquer");
  await expect(page).toHaveURL(/\/login\?erro=google-invalido/);
  await expect(page.getByText(/Não foi possível entrar com o Google/)).toBeVisible();
});
