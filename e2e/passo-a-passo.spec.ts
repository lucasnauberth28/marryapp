import type { Browser, Page } from "@playwright/test";
import { SENHA, criarCasalPronto, entrar, expect, novoContexto, test } from "./helpers";

// Passo a passo do painel: por pessoa, uma vez, refeito quando a pessoa quiser; nunca para a administração
// nem para quem "entra como" um casal.

const BOAS_VINDAS = { name: "Vamos preparar o casamento de vocês." };

const adminSenha = () => {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) throw new Error("Defina ADMIN_PASSWORD (a mesma do servidor) para o teste entrar como admin.");
  return senha;
};

/** Balão do passo atual (o diálogo que não é o cartão de boas-vindas). */
const balao = (page: Page) => page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "Pular" }) });

/** Anda até o último passo e devolve os títulos vistos, na ordem. */
async function percorrer(page: Page): Promise<string[]> {
  const titulos: string[] = [];
  for (let i = 0; i < 15; i++) {
    const caixa = balao(page);
    await expect(caixa).toBeVisible();
    titulos.push((await caixa.getByRole("heading").innerText()).trim());
    const concluir = caixa.getByRole("button", { name: "Concluir" });
    if (await concluir.isVisible()) return titulos;
    await caixa.getByRole("button", { name: "Próximo" }).click();
    await expect(caixa.getByRole("heading")).not.toHaveText(titulos[titulos.length - 1]);
  }
  throw new Error("O passo a passo não terminou.");
}

/** Executa a ação e espera a gravação (Server Action) terminar, para recarregar a página só depois. */
async function gravando(page: Page, acao: () => Promise<void>) {
  const resposta = page.waitForResponse((r) => r.request().method() === "POST");
  await acao();
  await resposta;
}

async function abrirPainel(page: Page) {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

async function abrirMenuDaConta(page: Page) {
  await page.getByRole("button", { name: "Menu da conta" }).click();
}

test("casal novo vê o passo a passo, conclui e não vê de novo ao recarregar", async ({ page }) => {
  await criarCasalPronto(page, "tour-conclui");
  await abrirPainel(page);

  const cartao = page.getByRole("dialog", BOAS_VINDAS);
  await expect(cartao).toBeVisible();
  // O botão flutuante da Liz se esconde enquanto o passo a passo está aberto
  await expect(page.locator("body")).toHaveAttribute("data-tour-active", "true");

  await cartao.getByRole("button", { name: "Ver o passo a passo" }).click();
  const titulos = await percorrer(page);
  // Só o que um casal no plano Básico pode abrir: sem Mensagens (WhatsApp é de plano) e sem áreas de administração
  expect(titulos).toEqual(expect.arrayContaining(["Resumo do casamento", "Convidados", "Site do casamento", "Presentes em dinheiro", "Mesas", "Finanças", "Fornecedores", "Configurações", "Liz"]));
  expect(titulos).not.toContain("Mensagens");

  await gravando(page, () => balao(page).getByRole("button", { name: "Concluir" }).click());
  await expect(balao(page)).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveAttribute("data-tour-active", "true");

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("pular persiste: 'Agora não' e Esc no meio do passo a passo não voltam sozinhos", async ({ page, browser }) => {
  // "Agora não" no cartão
  await criarCasalPronto(page, "tour-agora-nao");
  await abrirPainel(page);
  await gravando(page, () => page.getByRole("dialog", BOAS_VINDAS).getByRole("button", { name: "Agora não" }).click());
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Esc no segundo passo, em outra conta
  const contexto = await novoContexto(browser);
  const outra = await contexto.newPage();
  await criarCasalPronto(outra, "tour-esc");
  await abrirPainel(outra);
  await outra.getByRole("button", { name: "Ver o passo a passo" }).click();
  await balao(outra).getByRole("button", { name: "Próximo" }).click();
  await expect(balao(outra).getByRole("heading")).toHaveText("Convidados");
  await gravando(outra, () => outra.keyboard.press("Escape"));
  await expect(outra.getByRole("dialog")).toHaveCount(0);
  await outra.reload();
  await expect(outra.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(outra.getByRole("dialog")).toHaveCount(0);
  await contexto.close();
});

test("teclado: o foco vai para o balão, Tab fica nele, setas andam e Esc devolve o foco", async ({ page }) => {
  await criarCasalPronto(page, "tour-teclado");
  await abrirPainel(page);
  await page.getByRole("button", { name: "Ver o passo a passo" }).click();
  const caixa = balao(page);
  await expect(caixa).toBeFocused();

  await page.keyboard.press("ArrowRight");
  await expect(caixa.getByRole("heading")).toHaveText("Convidados");
  await page.keyboard.press("ArrowLeft");
  await expect(caixa.getByRole("heading")).toHaveText("Resumo do casamento");

  // Tab dá a volta só pelos botões do balão
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await caixa.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // O foco volta para um lugar útil (o botão do cartão sumiu), não fica perdido no fim da página
  await expect(page.getByRole("button", { name: "Menu da conta" })).toBeFocused();
});

test("o par convidado, com outra conta no mesmo casamento, tem o próprio passo a passo", async ({ page, browser }) => {
  await criarCasalPronto(page, "tour-par");
  await abrirPainel(page);
  await gravando(page, () => page.getByRole("dialog", BOAS_VINDAS).getByRole("button", { name: "Agora não" }).click());

  // A primeira pessoa cria o convite do par
  await page.goto("/conta#par");
  await page.getByRole("button", { name: "Criar convite" }).click();
  const link = await page.getByLabel("Link do convite").inputValue();

  const contexto = await novoContexto(browser);
  const par = await contexto.newPage();
  await par.goto(link);
  await par.getByLabel("Seu nome completo").fill("Bia Par Teste");
  await par.getByLabel("E-mail").fill(`tour-par-2-${Date.now()}@e2e.aceito.test`);
  await par.getByLabel("Crie uma senha").fill(SENHA);
  await par.getByRole("button", { name: "Criar conta e entrar no casamento" }).click();
  await par.waitForURL(/\/dashboard/);

  // O par vê as boas-vindas mesmo que a primeira pessoa já tenha pulado
  await expect(par.getByRole("dialog", BOAS_VINDAS)).toBeVisible();
  await par.getByRole("button", { name: "Ver o passo a passo" }).click();
  await percorrer(par);
  await gravando(par, () => balao(par).getByRole("button", { name: "Concluir" }).click());
  await par.reload();
  await expect(par.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(par.getByRole("dialog")).toHaveCount(0);
  await contexto.close();

  // E a primeira pessoa continua sem ver o cartão
  await abrirPainel(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("'Ver o passo a passo' no menu da conta e nas Configurações refaz o passo a passo", async ({ page }) => {
  await criarCasalPronto(page, "tour-de-novo");
  await abrirPainel(page);
  await page.getByRole("dialog", BOAS_VINDAS).getByRole("button", { name: "Agora não" }).click();

  await abrirMenuDaConta(page);
  await page.getByRole("menuitem", { name: "Ver o passo a passo" }).click();
  await expect(balao(page).getByRole("heading")).toHaveText("Resumo do casamento");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.goto("/configuracoes");
  await page.getByRole("button", { name: "Ver o passo a passo de novo" }).click();
  await expect(balao(page).getByRole("heading")).toHaveText("Resumo do casamento");
  // O botão do balão leva à tela do passo
  await balao(page).getByRole("button", { name: "Próximo" }).click();
  await balao(page).getByRole("link", { name: "Ir para Convidados" }).click();
  await expect(page).toHaveURL(/\/convidados$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("no celular o passo a passo abre a aba Mais e fica dentro da tela", async ({ browser }) => {
  const contexto = await novoContexto(browser, { viewport: { width: 390, height: 844 } });
  const page = await contexto.newPage();
  await criarCasalPronto(page, "tour-celular");
  await abrirPainel(page);
  await page.getByRole("button", { name: "Ver o passo a passo" }).click();

  const caixa = balao(page);
  for (let i = 0; i < 10; i++) {
    await expect(caixa).toBeVisible();
    const titulo = (await caixa.getByRole("heading").innerText()).trim();
    const area = await caixa.boundingBox();
    expect(area, titulo).not.toBeNull();
    expect(area!.x, titulo).toBeGreaterThanOrEqual(0);
    expect(area!.x + area!.width, titulo).toBeLessThanOrEqual(390);
    expect(area!.y, titulo).toBeGreaterThanOrEqual(0);
    expect(area!.y + area!.height, titulo).toBeLessThanOrEqual(844);
    if (titulo === "Mesas") {
      // Área que fica dentro de "Mais": a folha abre e o destaque está sobre o item
      await expect(page.locator("#painel-mais")).toBeVisible();
      await expect(caixa).toContainText("Toque em “Mais” e depois em “Mesas”");
      break;
    }
    await caixa.getByRole("button", { name: "Próximo" }).click();
  }
  await expect(caixa.getByRole("heading")).toHaveText("Mesas");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#painel-mais")).toHaveCount(0);
  await contexto.close();
});

async function paginaAdmin(browser: Browser) {
  const contexto = await novoContexto(browser);
  const page = await contexto.newPage();
  await entrar(page, "admin", adminSenha());
  await expect(page).toHaveURL(/\/admin$/);
  return { contexto, page };
}

test("'Entrar como' não mostra nem grava; a conta de administração não vê o passo a passo", async ({ page, browser }) => {
  const { email } = await criarCasalPronto(page, "tour-entrar-como");

  const { contexto, page: admin } = await paginaAdmin(browser);
  await admin.goto(`/admin/casais?q=${encodeURIComponent(email)}`);
  await admin.getByRole("link", { name: /Ana & Bia/ }).first().click();
  await admin.getByRole("link", { name: "Entrar como este casal" }).click();
  await admin.getByLabel("Por que você vai entrar?").selectOption("Atender um pedido de suporte");
  await admin.getByRole("button", { name: /^Entrar como Ana & Bia/ }).click();
  await expect(admin).toHaveURL(/\/dashboard$/);

  // A visita enxerga o painel do casal, sem cartão, sem balões e sem o item de menu
  await expect(admin.getByRole("status").filter({ hasText: "Você está vendo como Ana & Bia" })).toBeVisible();
  await expect(admin.getByRole("dialog")).toHaveCount(0);
  await abrirMenuDaConta(admin);
  await expect(admin.getByRole("menuitem", { name: "Minha conta" })).toBeVisible();
  await expect(admin.getByRole("menuitem", { name: "Ver o passo a passo" })).toHaveCount(0);
  await admin.keyboard.press("Escape");
  // Nas Configurações, o cartão de rever o passo a passo também não existe para a visita
  await admin.goto("/configuracoes");
  await expect(admin.getByRole("button", { name: "Ver o passo a passo de novo" })).toHaveCount(0);
  await admin.getByRole("button", { name: "Sair deste casal" }).click();

  // O casal nunca resolveu o passo a passo: as boas-vindas continuam esperando por ele
  await abrirPainel(page);
  await expect(page.getByRole("dialog", BOAS_VINDAS)).toBeVisible();

  // Conta de administração (sem "Entrar como"): o painel abre, mas sem passo a passo
  await admin.goto("/dashboard");
  await expect(admin.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(admin.getByRole("dialog")).toHaveCount(0);
  await abrirMenuDaConta(admin);
  await expect(admin.getByRole("menuitem", { name: "Ver o passo a passo" })).toHaveCount(0);
  await contexto.close();
});
