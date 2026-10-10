import { criarCasalPronto, expect, novoContexto, test } from "./helpers";

test("casal novo: cadastro, onboarding, painel vazio e site próprio isolado", async ({ page }) => {
  const { sitePath } = await criarCasalPronto(page);
  expect(sitePath).not.toContain("lucas-e-giovanna");

  // Painel vazio: nada do casamento principal (semeado) vaza para a conta nova
  await page.goto("/dashboard");
  await expect(page.getByText(/Lucas|Giovanna/)).toHaveCount(0);
  await page.goto("/convidados");
  await expect(page.getByText("Maria Convidada")).toHaveCount(0);
  await expect(page.getByText(/Lucas|Giovanna/)).toHaveCount(0);

  // O site público do casal carrega com os nomes dele
  const resposta = await page.goto(sitePath);
  expect(resposta?.status()).toBe(200);
  await expect(page.getByText(/Ana/).first()).toBeVisible();
  await expect(page.getByText(/Lucas|Giovanna/)).toHaveCount(0);
});

test("o convidado de um casal não aparece para outro casal", async ({ page, browser }) => {
  const nomeConvidado = `Convidada Secreta ${Date.now()}`;

  // Casal A cadastra um convidado
  await criarCasalPronto(page, "casal-a");
  await page.goto("/convidados");
  await page.getByRole("button", { name: /Novo convidado/ }).click();
  await page.getByPlaceholder("Ex: João Silva").fill(nomeConvidado);
  await page.getByRole("button", { name: "Adicionar Convidado" }).click();
  await expect(page.locator("tbody").getByText(nomeConvidado)).toBeVisible();

  // Casal B, em outra sessão, não vê esse convidado em nenhuma tela
  const contextoB = await novoContexto(browser);
  const paginaB = await contextoB.newPage();
  await criarCasalPronto(paginaB, "casal-b");
  for (const rota of ["/convidados", "/mesas", "/dashboard"]) {
    await paginaB.goto(rota);
    await expect(paginaB.getByText(nomeConvidado)).toHaveCount(0);
  }
  await contextoB.close();
});
