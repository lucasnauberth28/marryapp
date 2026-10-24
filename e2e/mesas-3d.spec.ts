import { expect, test, criarCasalPronto } from "./helpers";

// Mesas em 3D: recurso do plano VIP. O fluxo completo (sentar, compartilhar, abrir o link) foi conferido à mão com um casal VIP;
// aqui ficam as regras que não dependem do plano pago: o aviso de plano e o link que não existe.

test("casal no plano Básico vê o aviso do plano VIP em vez do 3D", async ({ page }) => {
  await criarCasalPronto(page, "mesas3d");
  await page.goto("/mesas/3d");
  await expect(page.getByRole("heading", { name: /As mesas em 3D são do plano VIP/ })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Ver planos" })).toBeVisible();
});

test("a lista de mesas oferece o 3D", async ({ page }) => {
  await criarCasalPronto(page, "mesas3d-lista");
  await page.goto("/mesas");
  await expect(page.getByRole("link", { name: /Ver em 3D/ })).toHaveAttribute("href", "/mesas/3d");
});

test("link de mesas inexistente dá página não encontrada, sem pedir login", async ({ page }) => {
  const res = await page.goto("/mapa-das-mesas/aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  expect(res?.status()).toBe(404);
  const mal = await page.goto("/mapa-das-mesas/x");
  expect(mal?.status()).toBe(404);
});
