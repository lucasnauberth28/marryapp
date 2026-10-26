import { SENHA, cadastrarCasal, cnpjValido, emailUnico, entrar, expect, novoContexto, test } from "./helpers";
import type { BrowserContext, Page } from "@playwright/test";

// Login e cadastro com o Google, contra o Google simulado (scripts/google-simulado.mjs): o fluxo OAuth inteiro
// (state, nonce, PKCE, id_token assinado) roda de verdade; só o Google é de mentira.

const GOOGLE = "http://localhost:4010";

/** Quem está "logado no Google" neste navegador. */
async function logadoNoGoogle(context: BrowserContext, perfil: { email: string; name?: string; verificado?: boolean }) {
  const valor = Buffer.from(JSON.stringify({ sub: `sub-${perfil.email}`, name: "Ana Teste Silva", ...perfil })).toString("base64url");
  await context.addCookies([{ name: "google_simulado", value: valor, url: GOOGLE }]);
}

/** Cria uma conta de casal (plano Básico) pelo Google e termina nas boas-vindas. */
async function cadastrarCasalComGoogle(page: Page, context: BrowserContext, email: string) {
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
}

test("casal novo cria a conta com o Google e depois entra só com ele", async ({ page, context }) => {
  await cadastrarCasalComGoogle(page, context, emailUnico("google"));

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

test("conta só do Google: Minha conta oferece criar senha, e a exclusão pede a senha antes", async ({ page, context }) => {
  await cadastrarCasalComGoogle(page, context, emailUnico("sosogoogle"));
  await page.goto("/conta");

  await expect(page.getByRole("heading", { name: "Senha", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar link para criar a senha" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trocar senha" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Google", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Desconectar o Google" })).toHaveCount(0);
  await expect(page.getByText(/crie antes uma senha/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Quero excluir minha conta" })).toHaveCount(0);
});

test("o par convidado entra no casamento direto pelo Google", async ({ page, browser }) => {
  // Quem convida: casal com senha, cria o link em Minha conta
  await cadastrarCasal(page, emailUnico("convida"));
  await page.goto("/conta");
  await page.getByRole("button", { name: "Criar convite" }).click();
  const link = await page.getByLabel("Link do convite").inputValue();
  expect(link).toMatch(/\/convite\/[A-Za-z0-9_-]{43}$/);

  // Quem recebe: sem conta, abre o link e continua com o Google
  const contexto = await novoContexto(browser);
  const par = await contexto.newPage();
  await logadoNoGoogle(contexto, { email: emailUnico("par") });
  await par.goto(new URL(link).pathname);
  await par.getByRole("link", { name: "Continuar com o Google" }).click();
  await par.waitForURL(/\/(dashboard|boas-vindas)/);

  // O convite foi usado: abrir de novo mostra que já foi usado
  await par.goto(new URL(link).pathname);
  await expect(par.getByRole("heading", { name: "Este convite já foi usado" })).toBeVisible();
  await contexto.close();
});

test("fornecedor cria a conta com o Google e cai no painel dele", async ({ page, context }) => {
  const email = emailUnico("fornecedor-google");
  await logadoNoGoogle(context, { email });
  await page.goto("/cadastro?tipo=fornecedor");
  await page.getByRole("radio", { name: /Start/ }).click();
  await page.getByRole("button", { name: /Continuar com o Start/ }).click();
  await page.getByRole("link", { name: "Criar conta com o Google" }).click();

  await expect(page.getByText("Conta do Google confirmada")).toBeVisible();
  await page.getByLabel("Nome do negócio").fill("Foto & Luz Google");
  await page.getByLabel("Cidade onde atende").fill("Campinas");
  await page.getByLabel("CNPJ").fill(cnpjValido());
  await page.getByLabel("WhatsApp").fill("(11) 98765-4321");
  await page.getByRole("button", { name: /^Criar conta/ }).click();
  await page.getByRole("link", { name: "Ir para o meu painel" }).click();
  await page.waitForURL(/\/fornecedor/);
});
