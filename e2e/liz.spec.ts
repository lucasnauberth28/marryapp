import type { Page } from "@playwright/test";
import { SENHA, concluirOnboarding, emailUnico, expect, novoContexto, test } from "./helpers";

// Acesso rápido à Liz: botão fixo no painel do casal, painel com sugestão, busca no guia e dúvidas comuns.
// Hoje não há IA: quem responde é o guia de ajuda.

const adminSenha = () => {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) throw new Error("Defina ADMIN_PASSWORD (a mesma do servidor) para o teste entrar como admin.");
  return senha;
};

const botao = (page: Page) => page.getByRole("button", { name: "Perguntar à Liz" });
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
  await page.getByRole("link", { name: "Preparar o nosso casamento" }).click();
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

test("aparece no resumo, abre, busca 'convidado', abre o artigo e o link navega", async ({ page }) => {
  await abrirResumo(page);
  await expect(botao(page)).toBeVisible();
  await expect(botao(page)).toHaveAttribute("aria-expanded", "false");

  await botao(page).click();
  await expect(painel(page)).toBeVisible();
  await expect(botao(page)).toHaveAttribute("aria-expanded", "true");
  await expect(painel(page).getByRole("heading", { name: "Sugestão para agora" })).toBeVisible();
  // Casamento recém-criado: nada pedindo atenção, e a Liz diz isso sem inventar
  await expect(painel(page).getByText("Não vi nada pedindo atenção agora")).toBeVisible();

  await painel(page).getByLabel("Pergunte sobre o painel").fill("convidado");
  const resultados = painel(page).getByRole("list", { name: "Respostas do guia" });
  await expect(resultados.getByRole("button").first()).toHaveText(/Como adiciono convidados\?/);
  await resultados.getByRole("button", { name: /Como adiciono convidados\?/ }).click();
  await expect(painel(page).getByRole("link", { name: "Ir para a Lista de convidados" })).toBeVisible();

  await painel(page).getByRole("link", { name: "Ir para a Lista de convidados" }).click();
  await page.waitForURL(/\/convidados/);
  // A folha fecha ao navegar, e o botão continua no painel
  await expect(painel(page)).toHaveCount(0);
  await expect(botao(page)).toBeVisible();
});

test("busca sem resultado diz que não sabe e aponta as dúvidas comuns; Esc fecha e devolve o foco", async ({ page }) => {
  await abrirResumo(page);
  await botao(page).click();
  await painel(page).getByLabel("Pergunte sobre o painel").fill("zzzxqw");
  await expect(painel(page).getByText("Ainda não sei responder isso. Veja as dúvidas comuns abaixo.")).toBeVisible();
  await expect(painel(page).getByRole("heading", { name: "Dúvidas comuns" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(painel(page)).toHaveCount(0);
  await expect(botao(page)).toBeFocused();
  await expect(botao(page)).toHaveAttribute("aria-expanded", "false");
});

test("artigo de recurso de plano avisa do plano; Dúvidas comuns abre a resposta com os passos", async ({ page }) => {
  await abrirResumo(page);
  await botao(page).click();
  await painel(page).getByRole("button", { name: "Como envio convites e lembretes pelo WhatsApp?" }).click();
  await expect(painel(page).getByText(/Este recurso é do plano Classic/)).toBeVisible();
  await expect(painel(page).getByRole("list").filter({ hasText: "Mensagens" }).first()).toBeVisible();
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

  // A aba "Mais" é uma janela: o botão da Liz se esconde enquanto ela está aberta
  await page.getByRole("button", { name: "Mais", exact: true }).click();
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
  await publico.close();
});

