import { expect, test } from "@playwright/test";

// A home pública: oferta, links de cadastro com o plano pré-selecionado, simulador e responsivo.

test("home mostra a oferta, os planos e os links de cadastro", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Um convite para cada convidado");
  // A taxa vem da fonte única (3,99%): aparece no título, nos planos e no simulador.
  await expect(page.getByRole("heading", { level: 1 })).toContainText("3,99%");
  for (const plano of ["basic", "classic", "vip"]) {
    await expect(page.locator(`main a[href="/cadastro?plano=${plano}"]`).first()).toBeVisible();
  }
  await expect(page.locator('main a[href="/fornecedores"]').first()).toBeVisible();
  await expect(page.locator('main a[href="/monte-seu-plano"]')).toBeVisible();
});

test("o convite de exemplo responde e o painel de exemplo conta", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Painel: 86 de 140 convites confirmados")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar presença" }).click();
  await page.getByRole("button", { name: "Enviar resposta" }).click();
  await expect(page.getByText("Marina confirmou presença")).toBeVisible();
  await page.getByRole("button", { name: "Alterar resposta" }).click();
  await expect(page.getByText("Painel: 86 de 140 convites confirmados")).toBeVisible();
});

test("simulador de presentes: Básico desconta a taxa, Classic não desconta no Pix", async ({ page }) => {
  await page.goto("/");
  const campo = page.locator("#lp-v-presente");
  await campo.scrollIntoViewIfNeeded();
  await campo.fill("1.000,00");
  await expect(page.locator(".lp-recebe")).toContainText("960,10");
  await page.getByRole("button", { name: /Classic ou/ }).click();
  await expect(page.locator(".lp-recebe")).toContainText("1.000,00");
  await campo.fill("abc");
  await expect(page.getByText("Digitem um valor, como 200,00.")).toBeVisible();
});

for (const [largura, altura] of [
  [390, 844],
  [1440, 900],
] as const) {
  test(`home sem rolagem lateral em ${largura}px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: altura });
    await page.goto("/");
    const [scroll, janela] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(scroll).toBeLessThanOrEqual(janela);
  });
}
