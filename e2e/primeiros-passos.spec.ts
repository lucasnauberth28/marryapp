import { criarCasalPronto, expect, test } from "./helpers";

// Resumo > Primeiros passos: a lista nasce de dados reais do casamento, marca o que já foi feito e some quando dispensada.

test("a lista acompanha o que o casal já fez e pode ser dispensada", async ({ page }) => {
  await criarCasalPronto(page, "primeiros-passos");

  // Casamento recém-criado: o Resumo mostra o caminho do primeiro acesso, não a lista
  await page.goto("/dashboard");
  await expect(page.getByTestId("primeiros-passos")).toHaveCount(0);

  // Com o primeiro convidado, a lista aparece e marca esse passo como feito
  await page.goto("/convidados");
  await page.getByRole("button", { name: "Adicionar convidado" }).click();
  await page.getByLabel("Nome no convite").fill("Marina Passos E2E");
  await page.getByLabel("WhatsApp").fill("(21) 97777-6655");
  await page.getByRole("button", { name: "Salvar convidado" }).click();
  await expect(page.locator("tbody").getByText("Marina Passos E2E")).toBeVisible();

  await page.goto("/dashboard");
  const lista = page.getByTestId("primeiros-passos");
  await expect(lista).toBeVisible();
  await expect(lista).toContainText("1 de 3 feitos");
  await expect(lista.getByRole("link", { name: "Editar o site" })).toBeVisible();
  await expect(lista.getByRole("link", { name: "Criar presente" })).toBeVisible();
  await expect(lista.getByRole("link", { name: "Adicionar convidado" })).toHaveCount(0);

  // Dispensar vale para esta pessoa e continua valendo depois de recarregar
  await lista.getByRole("button", { name: "Dispensar" }).click();
  await expect(page.getByTestId("primeiros-passos")).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("primeiros-passos")).toHaveCount(0);
});
