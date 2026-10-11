import { cadastrarFornecedor, emailUnico, entrar, expect, novoContexto, test } from "./helpers";

test("fornecedor gera Pix do plano Pro e o admin confirma na mão: o plano fica ativo", async ({ page, browser }) => {
  const adminSenha = process.env.ADMIN_PASSWORD;
  if (!adminSenha) throw new Error("Defina ADMIN_PASSWORD (a mesma do servidor) para o teste entrar como admin.");

  // Fornecedor novo (Start) pede o plano Pro por Pix
  const nome = `Carla ${Date.now()}`;
  await cadastrarFornecedor(page, emailUnico("fornecedor"), nome, "Buffet E2E");
  await page.goto("/fornecedor/plano");
  await expect(page.getByText("Gratuito")).toBeVisible();
  await page.getByRole("button", { name: /Assinar o Pro com Pix/ }).click();
  await expect(page.getByRole("img", { name: "QR Code do Pix" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copiar código Pix" })).toBeVisible();

  // Sem confirmação, o plano continua Start
  await page.goto("/fornecedor/plano");
  await expect(page.getByText("Gratuito")).toBeVisible();

  // O admin confere o Pix no extrato e confirma
  const admin = await novoContexto(browser);
  const paginaAdmin = await admin.newPage();
  await entrar(paginaAdmin, "admin", adminSenha);
  // A tela antiga redireciona para a administração
  await paginaAdmin.goto("/assinaturas?status=a-conferir");
  await expect(paginaAdmin).toHaveURL(/\/admin\/planos\/assinaturas\?status=a-conferir/);
  await paginaAdmin.getByRole("link", { name: `Conferir o pagamento de ${nome}` }).click();
  await paginaAdmin.getByLabel(/Vi o crédito/).check();
  await paginaAdmin.getByRole("button", { name: "Confirmar e liberar o plano" }).click();
  await expect(paginaAdmin.getByRole("button", { name: "Confirmar e liberar o plano" })).toBeHidden();

  // Reembolso: registra o pedido sobre esse pagamento e aprova (o estorno é no Mercado Pago, o webhook conclui)
  await paginaAdmin.goto("/admin/planos?aba=reembolsos");
  const opcao = paginaAdmin.locator("select option", { hasText: "Buffet E2E" }).first(); // o pagamento mais recente
  await paginaAdmin.getByLabel("Pagamento", { exact: true }).selectOption((await opcao.getAttribute("value")) as string);
  await paginaAdmin.getByLabel("Motivo do pedido").fill("Pediu o dinheiro de volta no teste");
  await paginaAdmin.getByRole("button", { name: "Registrar pedido" }).click();
  await expect(paginaAdmin.getByText("Pedido de reembolso registrado.")).toBeVisible();
  await expect(paginaAdmin.getByText("Para decidir").first()).toBeVisible();
  await paginaAdmin.getByRole("button", { name: /^Aprovar o reembolso de Buffet E2E/ }).first().click();
  await paginaAdmin.getByLabel("Anotação da aprovação").fill("Dentro do prazo, vou estornar");
  await paginaAdmin.getByRole("button", { name: "Aprovar reembolso" }).click();
  await expect(paginaAdmin.getByText("Falta estornar no Mercado Pago").first()).toBeVisible();
  await admin.close();

  // O plano Pro aparece ativo para o fornecedor
  await page.goto("/fornecedor/plano");
  await expect(page.getByText("Pago até")).toBeVisible();
  await expect(page.getByRole("region", { name: "Plano atual" })).toContainText("Pro");
  await expect(page.getByText("Gratuito")).toHaveCount(0);
});
