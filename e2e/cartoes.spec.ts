import { criarCasalPronto, expect, test } from "./helpers";

// Finanças > Cartões: cadastrar, editar e excluir os cartões do casal (só banco, bandeira, apelido, 4 últimos dígitos e limite).

test("o casal cadastra, edita e exclui um cartão", async ({ page }) => {
  await criarCasalPronto(page, "cartoes");
  await page.goto("/financas");
  const secao = page.locator("section").filter({ has: page.getByRole("heading", { name: "Cartões" }) });
  await expect(secao.getByText("Nenhum cartão ainda")).toBeVisible();

  await secao.getByRole("button", { name: "Adicionar cartão" }).click();
  await secao.getByLabel("Banco ou emissor").fill("Nubank");
  await secao.getByLabel("Bandeira").selectOption("Mastercard");
  await secao.getByLabel("Apelido").fill("Buffet");
  // Só números e no máximo 4: o resto digitado some
  await secao.getByLabel("4 últimos dígitos").fill("43x2189");
  await expect(secao.getByLabel("4 últimos dígitos")).toHaveValue("4321");
  await secao.getByLabel("Limite (R$)").fill("5.000,00");
  await secao.getByRole("button", { name: "Adicionar o cartão" }).click();
  await expect(secao.getByText("Nubank (Buffet) ****4321")).toBeVisible();
  await expect(secao.getByText(/Mastercard · limite R\$\s*5\.000,00/)).toBeVisible();

  await expect(page.getByText("Nenhum cartão ainda")).toHaveCount(0);

  await secao.getByRole("button", { name: "Editar Nubank (Buffet) ****4321" }).click();
  await secao.getByLabel("Apelido").fill("Decoração");
  await secao.getByRole("button", { name: "Salvar o cartão" }).click();
  await expect(secao.getByText("Nubank (Decoração) ****4321")).toBeVisible();

  await secao.getByRole("button", { name: "Excluir Nubank (Decoração) ****4321" }).click();
  await page.getByRole("button", { name: "Excluir cartão", exact: true }).click();
  await expect(secao.getByText("Nenhum cartão ainda")).toBeVisible();
});
