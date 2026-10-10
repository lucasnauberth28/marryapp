import { test as base, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

export { expect };

export const SENHA = "senha-de-teste-123";

/**
 * O servidor limita cadastro, login e checkout por IP (x-forwarded-for). Como todos os testes saem do
 * mesmo IP, cada contexto ganha um IP fictício próprio, para um teste não esgotar o limite do outro.
 */
function ipFicticio() {
  const n = () => Math.floor(Math.random() * 254) + 1;
  return `10.${n()}.${n()}.${n()}`;
}

export async function novoContexto(browser: Browser, options: Parameters<Browser["newContext"]>[0] = {}): Promise<BrowserContext> {
  const context = await browser.newContext(options);
  await context.setExtraHTTPHeaders({ "x-forwarded-for": ipFicticio() });
  return context;
}

export const test = base.extend({
  // (`usar` e não `use`: o nome `use` dispara a regra de hooks do React no ESLint)
  context: async ({ context }, usar) => {
    await context.setExtraHTTPHeaders({ "x-forwarded-for": ipFicticio() });
    await usar(context);
  },
});

/** E-mail único por execução, para os testes não dependerem uns dos outros. */
export function emailUnico(prefixo: string) {
  return `${prefixo}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.aceito.test`;
}

export async function entrar(page: Page, email: string, senha: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senha);
  await page.getByRole("button", { name: /^Entrar/ }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** Cria a conta de um casal no plano Básico (gratuito) e termina no onboarding. */
export async function cadastrarCasal(page: Page, email: string) {
  await page.goto("/cadastro?tipo=casal");
  await page.getByRole("radio", { name: /Básico/ }).click();
  await page.getByRole("button", { name: /Continuar com o Básico/ }).click();
  await page.getByLabel("Seu nome completo").fill("Ana Teste Silva");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("WhatsApp").fill("(11) 98765-4321");
  await page.getByLabel("Crie uma senha").fill(SENHA);
  await page.getByRole("button", { name: /^Criar conta/ }).click();
  await page.getByRole("link", { name: "Preparar o nosso casamento" }).click();
  await page.waitForURL(/\/boas-vindas/);
  await expect(page.getByRole("heading", { name: /Boas-vindas/ })).toBeVisible();
}

/** Faz o onboarding ("Ana" e "Bia", sem data) e devolve o caminho público do site, ex.: /casamento/ana-e-bia-x1. */
export async function concluirOnboarding(page: Page): Promise<string> {
  await page.getByLabel("Seu nome", { exact: true }).fill("Ana");
  await page.getByLabel("Nome de quem vai casar com você").fill("Bia");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByLabel("Ainda não temos a data").check();
  await page.getByLabel("Cidade").fill("Campinas");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByRole("button", { name: /Pular|Continuar/ }).click();
  await page.getByRole("button", { name: "Concluir" }).click();

  await expect(page.getByRole("heading", { name: "Tudo pronto" })).toBeVisible();
  const sitePath = await page.getByRole("link", { name: /\/casamento\// }).getAttribute("href");
  expect(sitePath).toMatch(/^\/casamento\/[a-z0-9-]+$/);
  return sitePath!;
}

/** Conta nova de casal, plano Básico, onboarding pronto. Devolve e-mail e caminho do site. */
export async function criarCasalPronto(page: Page, prefixo = "casal") {
  const email = emailUnico(prefixo);
  await cadastrarCasal(page, email);
  const sitePath = await concluirOnboarding(page);
  return { email, sitePath };
}

/** CNPJ com dígitos verificadores válidos, aleatório. */
export function cnpjValido() {
  const base = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
  const dv = (nums: number[]) => {
    const pesos = nums.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = nums.reduce((acc, n, i) => acc + n * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = dv(base);
  const d2 = dv([...base, d1]);
  return [...base, d1, d2].join("");
}

/** Conta nova de fornecedor no plano Start (gratuito). Termina logado, no painel do fornecedor. */
export async function cadastrarFornecedor(page: Page, email: string, nome: string, empresa: string) {
  await page.goto("/cadastro?tipo=fornecedor");
  await page.getByRole("radio", { name: /Start/ }).click();
  await page.getByRole("button", { name: /Continuar com o Start/ }).click();
  await page.getByLabel("Seu nome", { exact: true }).fill(nome);
  await page.getByLabel("Nome do negócio").fill(empresa);
  await page.getByLabel("Cidade onde atende").fill("Campinas");
  await page.getByLabel("CNPJ").fill(cnpjValido());
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("WhatsApp").fill("(11) 98765-4321");
  await page.getByLabel("Crie uma senha").fill(SENHA);
  await page.getByRole("button", { name: /^Criar conta/ }).click();
  await page.getByRole("link", { name: "Ir para o meu painel" }).click();
  await page.waitForURL(/\/fornecedor/);
}
