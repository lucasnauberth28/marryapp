import type { Page } from "@playwright/test";
import { cadastrarFornecedor, emailUnico, entrarComoAdmin, expect, novoContexto, test } from "./helpers";

// Catálogo e preços: o preço editado vale para compra nova (o servidor recalcula), a cobrança já feita mantém o valor
// e a mudança fica no registro de atividades. O teste sempre devolve o preço ao do código no final.

async function salvarPreco(page: Page, chave: string, preco: string, motivo: string) {
  await page.goto(`/admin/planos/catalogo?editar=${chave}`);
  await page.getByLabel("Preço (R$)").fill(preco);
  await page.getByLabel("Motivo da mudança").fill(motivo);
  await page.getByRole("button", { name: "Salvar preço" }).click();
  await expect(page.getByText(/Preço salvo/)).toBeVisible();
}

/** Abre o painel do pagamento a conferir de `nome`, andando pelas páginas da lista (vários testes deixam Pix pendentes). */
async function abrirPagamento(page: Page, nome: string) {
  for (let pagina = 1; pagina <= 8; pagina++) {
    await page.goto(`/admin/planos/assinaturas?status=a-conferir&pagina=${pagina}`);
    // A lista chega por streaming (Suspense) depois do carregamento da página: espera a rede aquietar
    await page.waitForLoadState("networkidle");
    const link = page.getByRole("link", { name: `Conferir o pagamento de ${nome}` });
    if (await link.count()) {
      await link.click();
      return;
    }
  }
  throw new Error(`Pagamento de ${nome} não encontrado na fila de Pix a conferir.`);
}

test("administração muda o preço do Pro: a compra nova usa o valor novo e a antiga mantém o dela", async ({ page, browser }) => {
  test.setTimeout(180_000); // dois cadastros de fornecedor e um Pix de cada
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) throw new Error("Defina ADMIN_PASSWORD (a mesma do servidor) para o teste entrar como admin.");

  const admin = await novoContexto(browser);
  const painel = await admin.newPage();
  await entrarComoAdmin(painel, senha);

  try {
    // Compra antiga, pelo preço do código (R$ 99,00)
    const antigo = `Antiga ${Date.now()}`; // nome da pessoa (a lista mostra o nome da conta)
    await cadastrarFornecedor(page, emailUnico("forn-antigo"), antigo, "Buffet Preco Antigo");
    await page.goto("/fornecedor/plano");
    await page.getByRole("button", { name: /Assinar o Pro com Pix/ }).click();
    await expect(page.getByRole("img", { name: "QR Code do Pix" })).toBeVisible();

    await salvarPreco(painel, "plan:pro", "129,00", "Teste automático de preço");

    // A página pública já mostra o preço novo
    await painel.goto("/planos");
    await expect(painel.getByText("R$ 129").first()).toBeVisible();

    // Compra nova, depois da mudança: o servidor cobra R$ 129,00
    const novo = await novoContexto(browser);
    const paginaNova = await novo.newPage();
    const nomeNovo = `Novo ${Date.now()}`;
    await cadastrarFornecedor(paginaNova, emailUnico("forn-novo"), nomeNovo, "Buffet Preco Novo");
    await paginaNova.goto("/fornecedor/plano");
    await paginaNova.getByRole("button", { name: /Assinar o Pro com Pix/ }).click();
    await expect(paginaNova.getByRole("img", { name: "QR Code do Pix" })).toBeVisible();
    await novo.close();

    await abrirPagamento(painel, nomeNovo);
    await expect(painel.getByRole("complementary").getByText("R$ 129,00", { exact: true })).toBeVisible();

    // A cobrança antiga continua em R$ 99,00
    await abrirPagamento(painel, antigo);
    await expect(painel.getByRole("complementary").getByText("R$ 99,00", { exact: true })).toBeVisible();

    // A mudança ficou no histórico
    await painel.goto("/admin/planos/catalogo");
    await expect(painel.getByText("Motivo: Teste automático de preço").first()).toBeVisible();
  } finally {
    // Devolve ao preço do código (a linha do catálogo some)
    await salvarPreco(painel, "plan:pro", "99,00", "Voltando ao preço original após o teste");
    await painel.goto("/planos");
    await expect(painel.getByText("R$ 99").first()).toBeVisible();
    await admin.close();
  }
});

test("plano gratuito não vira pago e preço inválido é recusado", async ({ browser }) => {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) throw new Error("Defina ADMIN_PASSWORD (a mesma do servidor) para o teste entrar como admin.");
  const admin = await novoContexto(browser);
  const painel = await admin.newPage();
  await entrarComoAdmin(painel, senha);

  // Básico: o campo de preço fica travado
  await painel.goto("/admin/planos/catalogo?editar=plan:basic");
  await expect(painel.getByLabel("Preço (R$)")).toBeDisabled();

  // Preço abaixo de R$ 1,00 é recusado pelo servidor
  await painel.goto("/admin/planos/catalogo?editar=plan:vip");
  await painel.getByLabel("Preço (R$)").fill("0,50");
  await painel.getByLabel("Motivo da mudança").fill("Teste de preço inválido");
  await painel.getByLabel(/^Confirmo a mudança/).check(); // mudança grande pede um aceite a mais
  await painel.getByRole("button", { name: "Salvar preço" }).click();
  await expect(painel.getByText(/entre R\$ 1,00 e R\$ 10.000,00/)).toBeVisible();
  await admin.close();
});
