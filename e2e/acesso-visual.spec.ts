import { expect, test } from "./helpers";

// Palco de acesso: foto ao fundo e formulário no cartão flutuante, sem rolagem lateral em nenhum tamanho.

for (const [nome, largura, altura] of [
  ["computador", 1440, 900],
  ["celular", 390, 844],
] as const) {
  test(`login e cadastro no ${nome}: foto, cartão e troca de aba`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: altura });
    await page.goto("/login");

    await expect(page.getByRole("img", { name: /alianças/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Que bom ver vocês" })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();

    await page.getByRole("tab", { name: "Criar conta" }).click();
    await expect(page.getByRole("heading", { name: /Que conta vocês querem criar/ })).toBeVisible();
    await expect(page.getByRole("img", { name: /xícara/ })).toBeVisible();

    const rolagem = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(rolagem).toBeLessThanOrEqual(0);
  });
}

test("no computador o cartão fica à direita da foto", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/esqueci-a-senha");
  const caixa = await page.locator("main#conteudo").boundingBox();
  expect(caixa).not.toBeNull();
  expect(caixa!.x).toBeGreaterThan(720);
  expect(caixa!.width).toBeLessThanOrEqual(500);
});
