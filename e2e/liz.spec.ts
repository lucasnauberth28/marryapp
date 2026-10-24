import type { Page } from "@playwright/test";
import { SENHA, concluirOnboarding, emailUnico, expect, novoContexto, test } from "./helpers";

// Acesso rápido à Liz: botão fixo no canto direito do painel do casal e conversa por assuntos prontos.
// Hoje não há IA livre: quem responde é o guia de ajuda.

const adminSenha = () => {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) throw new Error("Defina ADMIN_PASSWORD (a mesma do servidor) para o teste entrar como admin.");
  return senha;
};

const botao = (page: Page) => page.getByRole("button", { name: "Falar com a Liz" });
const painel = (page: Page) => page.getByRole("dialog", { name: "Liz, sua assistente" });

/** Casal novo no plano Básico com o onboarding feito (não depende do título da tela de boas-vindas, que muda de texto). */
async function criarCasalPronto(page: Page, prefixo: string) {
  await page.goto("/cadastro?tipo=casal");
  await page.getByRole("radio", { name: /Básico/ }).click();
  await page.getByRole("button", { name: /Continuar com o Básico/ }).click();
  await page.getByLabel("Seu nome", { exact: true }).fill("Ana Teste Silva");
  await page.getByLabel("E-mail").fill(emailUnico(prefixo));
  await page.getByLabel("WhatsApp").fill("(11) 98765-4321");
  await page.getByLabel("Crie uma senha").fill(SENHA);
  await page.getByRole("button", { name: /^Criar conta/ }).click();
  await page.waitForURL(/\/boas-vindas/);
  return { sitePath: await concluirOnboarding(page) };
}

/** Casal novo no resumo, com o passo a passo de boas-vindas dispensado. */
async function abrirResumo(page: Page) {
  await criarCasalPronto(page, "liz");
  await page.goto("/dashboard");
  const agoraNao = page.getByRole("button", { name: "Agora não" });
  await agoraNao.click({ timeout: 5000 }).catch(() => {});
  await expect(page.locator("body")).not.toHaveAttribute("data-tour-active", "true");
}

test("aparece no resumo, fica à direita, conversa por assuntos e o link da resposta navega", async ({ page }) => {
  await abrirResumo(page);
  await expect(botao(page)).toBeVisible();
  await expect(botao(page)).toHaveAttribute("aria-expanded", "false");
  // No computador o botão é uma pílula com o nome, fixa no canto inferior direito da tela
  await expect(botao(page)).toContainText("Falar com a Liz");
  const lateral = await botao(page).boundingBox();
  const tela = page.viewportSize()!;
  expect(lateral!.x + lateral!.width).toBeGreaterThan(tela.width - 48);
  expect(lateral!.y + lateral!.height).toBeGreaterThan(tela.height - 48);
  // O botão mostra o rosto da Liz: imagem decorativa (o nome vem do botão) e carregada de verdade
  const rosto = botao(page).locator('img[data-liz-pose="rosto"]');
  await expect(rosto).toHaveAttribute("alt", "");
  await expect.poll(() => rosto.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

  await botao(page).click();
  await expect(painel(page)).toBeVisible();
  await expect(botao(page)).toHaveAttribute("aria-expanded", "true");
  const conversa = painel(page).getByRole("log", { name: "Conversa com a Liz" });
  await expect(conversa.getByText(/Oi! Eu sou a Liz/)).toBeVisible();

  // Casamento recém-criado: nada pedindo atenção, e a Liz diz isso sem inventar
  await painel(page).getByRole("button", { name: "O que fazer agora?" }).click();
  await expect(conversa.getByText("Não vi nada pedindo atenção agora")).toBeVisible();
  await expect(painel(page).locator('img[data-liz-pose="tranquila"]')).toBeVisible();

  // Assunto, dúvida e resposta com os passos
  await painel(page).getByRole("button", { name: "Outro assunto" }).click();
  await painel(page).getByRole("button", { name: "Convidados", exact: true }).click();
  await painel(page).getByRole("button", { name: "Como adiciono convidados?" }).click();
  await expect(painel(page).getByRole("link", { name: "Ir para a Lista de convidados" })).toBeVisible();

  await painel(page).getByRole("link", { name: "Ir para a Lista de convidados" }).click();
  await page.waitForURL(/\/convidados/);
  // A conversa fecha ao navegar, e o botão continua no painel
  await expect(painel(page)).toHaveCount(0);
  await expect(botao(page)).toBeVisible();
});

test("escrever a dúvida procura no guia; sem resultado a Liz diz que não sabe e volta aos assuntos; Esc fecha e devolve o foco", async ({ page }) => {
  await abrirResumo(page);
  await botao(page).click();
  const campo = painel(page).getByLabel("Escrevam a dúvida sobre o painel");
  await campo.fill("convidado");
  await campo.press("Enter");
  await expect(painel(page).getByText(/Achei estas dúvidas no guia/)).toBeVisible();
  await expect(painel(page).getByRole("button", { name: "Como adiciono convidados?" })).toBeVisible();

  await campo.fill("zzzxqw");
  await campo.press("Enter");
  await expect(painel(page).getByText(/Ainda não sei responder isso/)).toBeVisible();
  await expect(painel(page).getByRole("button", { name: "Convidados", exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(painel(page)).toHaveCount(0);
  await expect(botao(page)).toBeFocused();
  await expect(botao(page)).toHaveAttribute("aria-expanded", "false");
});

test("dúvida de recurso de plano avisa do plano e mostra os passos", async ({ page }) => {
  await abrirResumo(page);
  await botao(page).click();
  await painel(page).getByRole("button", { name: "Mensagens e convites" }).click();
  await painel(page).getByRole("button", { name: "Como envio convites e lembretes pelo WhatsApp?" }).click();
  await expect(painel(page).getByText(/Este recurso é do plano Classic/)).toBeVisible();
  await expect(painel(page).getByRole("list").filter({ hasText: "Mensagens" }).first()).toBeVisible();
  // Recomeçar apaga a conversa
  await painel(page).getByRole("button", { name: "Recomeçar a conversa" }).click();
  await expect(painel(page).getByText(/Este recurso é do plano Classic/)).toHaveCount(0);
});

test("o botão fica acima da barra inferior no celular e some com uma janela aberta", async ({ browser }) => {
  const context = await novoContexto(browser, { viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await abrirResumo(page);
  const fab = await botao(page).boundingBox();
  const barra = await page.getByRole("navigation", { name: "Navegação principal" }).boundingBox();
  expect(fab).not.toBeNull();
  expect(barra).not.toBeNull();
  expect(fab!.width).toBeGreaterThanOrEqual(44);
  expect(fab!.y + fab!.height).toBeLessThanOrEqual(barra!.y);

  // O menu da conta é uma janela: o botão da Liz se esconde enquanto ela está aberta
  await page.getByRole("button", { name: "Menu da conta" }).click();
  await expect(botao(page)).toBeHidden();
  await context.close();
});

test("não aparece na administração da plataforma nem na vitrine pública", async ({ page, browser }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("admin");
  await page.getByLabel("Senha", { exact: true }).fill(adminSenha());
  await page.getByRole("button", { name: /^Entrar/ }).click();
  await page.waitForURL(/\/admin/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(botao(page)).toHaveCount(0);

  const publico = await novoContexto(browser);
  const aberta = await publico.newPage();
  const { sitePath } = await (async () => {
    const dona = await novoContexto(browser);
    const p = await dona.newPage();
    const r = await criarCasalPronto(p, "liz-vitrine");
    await dona.close();
    return r;
  })();
  await aberta.goto(sitePath);
  await expect(aberta.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(botao(aberta)).toHaveCount(0);
  // Páginas do convidado ficam sem a Liz
  await expect(aberta.locator("img[data-liz-pose]")).toHaveCount(0);
  await publico.close();
});

