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
  await paginaAdmin.goto("/assinaturas");
  await paginaAdmin.getByRole("link", { name: `Conferir o pagamento de ${nome}` }).click();
  await paginaAdmin.getByLabel(/Vi o crédito/).check();
  await paginaAdmin.getByRole("button", { name: "Confirmar e liberar o plano" }).click();
  await expect(paginaAdmin.getByRole("button", { name: "Confirmar e liberar o plano" })).toBeHidden();
  await admin.close();

  // O plano Pro aparece ativo para o fornecedor
  await page.goto("/fornecedor/plano");
  await expect(page.getByText("Pago até")).toBeVisible();
  await expect(page.getByRole("region", { name: "Plano atual" })).toContainText("Pro");
  await expect(page.getByText("Gratuito")).toHaveCount(0);
});
