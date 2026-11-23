import { criarCasalPronto, expect, test } from "./helpers";

// Orçamento (antiga Finanças): planejado, pago e falta, sem saldo previsto, cartões nem tabela de pagamentos de presentes.

test("o orçamento soma as despesas e mostra o que já foi pago e o que falta", async ({ page }) => {
  await criarCasalPronto(page, "orcamento");
  await page.goto("/financas");
  await expect(page.getByRole("heading", { level: 1, name: "Orçamento" })).toBeVisible();
  for (const titulo of ["Planejado", "Já pago", "Falta pagar", "Próxima parcela"]) await expect(page.getByText(titulo, { exact: true })).toBeVisible();
  await expect(page.getByText("Saldo previsto")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Cartões" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Pagamentos dos presentes" })).toHaveCount(0);

  // O convite do passo a passo cobre o canto da tela: dispensa antes de tocar no botão
  await page.getByRole("button", { name: "Agora não" }).click();
  // Lançar uma despesa continua no mesmo lugar
  await page.getByRole("button", { name: /Nova despesa/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
