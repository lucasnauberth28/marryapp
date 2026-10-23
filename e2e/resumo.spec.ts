import type { Page } from "@playwright/test";
import { criarCasalPronto, expect, novoContexto, test } from "./helpers";

// Resumo do casamento e a casca nova do painel: 5 áreas, convite compartilhável em todos os planos,
// confirmações com unidade, extrato único com conferência de Pix.

async function abrirResumo(page: Page) {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1, name: "Resumo" })).toBeVisible();
  const agoraNao = page.getByRole("button", { name: "Agora não" });
  await agoraNao.click({ timeout: 5000 }).catch(() => {});
  await expect(page.locator("body")).not.toHaveAttribute("data-tour-active", "true");
}

test("casal novo: 5 áreas no menu, convite pronto e amostras marcadas como exemplo", async ({ page }) => {
  await criarCasalPronto(page, "resumo-novo");
  await abrirResumo(page);

  const menu = page.getByRole("navigation", { name: "Menu principal" });
  await expect(menu.getByRole("link")).toHaveText(["Resumo", "Convidados", "Site e convite", "Presentes e dinheiro", "Organização"]);
  await expect(menu.getByRole("link", { name: "Resumo" })).toHaveAttribute("aria-current", "page");

  // Convite pronto, em qualquer plano (aqui o Básico): WhatsApp, copiar link e o botão de um a um (ainda sem convidados)
  const convite = page.getByRole("region", { name: "Convite" });
  await expect(convite.getByLabel("Endereço do convite")).toHaveValue(/\/casamento\/ana-e-bia/);
  await expect(convite.getByRole("link", { name: /Enviar pelo WhatsApp/ })).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);
  await expect(convite.getByRole("button", { name: "Enviar por convidado" })).toBeDisabled();
  await expect(convite.getByText("Nenhum convidado na lista ainda")).toBeVisible();

  // Nada de número fingindo ser real: as amostras vêm com o chip "Exemplo"
  await expect(page.getByRole("region", { name: "Confirmações de presença" }).getByText("Exemplo", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Presentes e dinheiro" }).getByText("Exemplo", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "O que fazer agora" })).toContainText("1 de 3 feitos");
  await expect(page.getByRole("region", { name: "Presentes e dinheiro" }).getByRole("link", { name: /Onde receber/ })).toHaveAttribute("href", "/configuracoes/recebimento");
});

test("telas da área viram abas, e o menu da conta guarda Configurações e Plano", async ({ page }) => {
  await criarCasalPronto(page, "resumo-abas");
  await abrirResumo(page);

  await page.goto("/mesas");
  const abas = page.getByRole("navigation", { name: "Telas de Convidados" });
  await expect(abas.getByRole("link", { name: "Mesas" })).toHaveAttribute("aria-current", "page");
  await expect(abas.getByRole("link", { name: /Lista de convidados/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Convidados" })).toHaveAttribute("aria-current", "page");

  await page.getByRole("button", { name: "Menu da conta" }).click();
  await expect(page.getByRole("menuitem", { name: "Configurações" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /Plano e pagamentos/ })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Sair" })).toBeVisible();
  await page.keyboard.press("Escape");

  // A Carteira deixou de ser tela: o endereço antigo leva para Presentes e dinheiro
  await page.goto("/carteira");
  await expect(page).toHaveURL(/\/presentes-admin$/);
  await expect(page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Presentes e dinheiro" })).toHaveAttribute("aria-current", "page");
});

test("enviar por convidado abre o WhatsApp da pessoa e anota o envio; o Resumo conta convites e pessoas", async ({ page, context }) => {
  await criarCasalPronto(page, "resumo-envio");
  await page.goto("/convidados");
  await page.getByRole("button", { name: "Adicionar convidado" }).click();
  await page.getByLabel("Nome no convite").fill("Marina Envio E2E");
  await page.getByLabel("WhatsApp").fill("(11) 98765-4321");
  await page.getByRole("button", { name: "Mais um lugar" }).click();
  await page.getByRole("button", { name: "Salvar convidado" }).click();
  await expect(page.locator("tbody").getByText("Marina Envio E2E")).toBeVisible();

  await abrirResumo(page);
  const convite = page.getByRole("region", { name: "Convite" });
  await expect(convite).toContainText("0 de 1 convite");
  await expect(convite).toContainText("1 por enviar");

  // Confirmações: sempre com a unidade (1 convite, 2 pessoas)
  const confirmacoes = page.getByRole("region", { name: "Confirmações de presença" });
  await expect(confirmacoes).toContainText("de 1 convite");
  await expect(confirmacoes).toContainText("de 2 pessoas");
  await expect(confirmacoes).toContainText("1 convite · 2 pessoas");

  await convite.getByRole("button", { name: "Enviar por convidado" }).click();
  const lista = convite.getByRole("list", { name: "Convites por enviar" });
  await expect(lista).toContainText("Marina Envio E2E");
  await expect(lista).toContainText("2 lugares");
  // O link é a conversa da própria pessoa, com a mensagem pessoal pronta
  const enviar = lista.getByRole("link", { name: /Enviar para Marina Envio E2E/ });
  await expect(enviar).toHaveAttribute("href", /^https:\/\/wa\.me\/5511987654321\?text=/);
  expect(decodeURIComponent((await enviar.getAttribute("href")) ?? "")).toContain("Olá, Marina!");
  // ...e abre em outra aba (o wa.me redireciona para o WhatsApp Web; só o número importa aqui)
  const [whatsapp] = await Promise.all([context.waitForEvent("page"), enviar.click()]);
  await expect.poll(() => whatsapp.url()).toContain("5511987654321");
  await whatsapp.close();

  // O envio fica anotado no convidado: depois de recarregar, o convite conta como enviado
  await expect(lista).toContainText("Enviado");
  await expect.poll(async () => {
    await page.reload();
    return (await page.getByRole("region", { name: "Convite" }).textContent()) ?? "";
  }).toContain("1 de 1 convite");
  await expect(page.getByRole("region", { name: "Convite" })).toContainText("0 por enviar");
});

test("extrato único: Pix a conferir no Resumo, com taxa em reais, e o botão Conferir confirma ali mesmo", async ({ page, browser }) => {
  const { sitePath } = await criarCasalPronto(page, "resumo-pix");
  await page.goto("/presentes-admin");
  await page.getByRole("button", { name: /Novo presente/ }).click();
  await page.getByLabel("Nome do presente").fill("Cafeteira Resumo E2E");
  await page.getByLabel("Valor em reais").fill("150");
  await page.getByRole("button", { name: "Adicionar presente" }).click();
  await expect(page.getByText("Cafeteira Resumo E2E")).toBeVisible();

  const convidado = await novoContexto(browser);
  const pagina = await convidado.newPage();
  await pagina.goto(`${sitePath}/presentes`);
  await pagina.getByRole("link", { name: "Presentear: Cafeteira Resumo E2E" }).click();
  await pagina.waitForURL(/\/checkout\//);
  await pagina.getByLabel("Seu nome completo").fill("Convidado Pix Resumo");
  await pagina.getByLabel("Seu WhatsApp com DDD").fill("11999998888");
  await pagina.getByRole("button", { name: /Continuar para o pagamento/ }).click();
  await pagina.getByRole("radio", { name: /^Pix/ }).click();
  await pagina.getByRole("button", { name: "Gerar Pix" }).click();
  await expect(pagina.getByRole("heading", { name: "Faça o Pix" })).toBeVisible();
  await convidado.close();

  await abrirResumo(page);
  await expect(page.getByRole("region", { name: "O que fazer agora" })).toContainText("1 Pix de presente espera a conferência de vocês.");
  const dinheiro = page.getByRole("region", { name: "Presentes e dinheiro" });
  await expect(dinheiro).toContainText("A conferir");
  // Conta do Básico: 3,99% de R$ 150,00 = R$ 5,99 (arredondado) e R$ 144,01 para vocês
  await expect(dinheiro).toContainText(/taxa R\$\s*5,99/);
  await expect(dinheiro).toContainText(/R\$\s*144,01/);

  await dinheiro.getByRole("button", { name: "Conferir o Pix de Convidado Pix Resumo" }).click();
  await expect(dinheiro.getByText("Tudo conferido")).toBeVisible();
  await expect(dinheiro.getByText("Conferido", { exact: true })).toBeVisible();
  // Agora o presente entrou no recebido: bruto R$ 150,00, taxa R$ 5,99 e líquido R$ 144,01
  await expect(dinheiro.getByRole("term").filter({ hasText: "Recebido (bruto)" })).toBeVisible();
  await expect(dinheiro).toContainText(/R\$\s*150,00/);
  await expect(dinheiro).toContainText(/−R\$\s*5,99/);
});
