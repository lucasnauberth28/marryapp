import { criarCasalPronto, expect, test } from "./helpers";

// Mensagens: o Aceito monta a fila e o casal envia pelo próprio WhatsApp. Nada sai sozinho.

test("a fila de convites abre o WhatsApp do casal com o texto pronto e anota o envio", async ({ page }) => {
  await criarCasalPronto(page, "mensagens-fila");
  await page.goto("/convidados");
  await page.getByRole("button", { name: "Adicionar convidado" }).click();
  await page.getByLabel("Nome no convite").fill("Marina Fila E2E");
  await page.getByLabel("WhatsApp").fill("(11) 98765-4321");
  await page.getByRole("button", { name: "Salvar convidado" }).click();
  await expect(page.locator("tbody").getByText("Marina Fila E2E")).toBeVisible();

  await page.goto("/mensagens");
  await expect(page.getByRole("heading", { name: "Envios rápidos" })).toBeVisible();
  await page.getByRole("button", { name: /Montar a fila para 1 pessoa/ }).first().click();

  const abrir = page.getByRole("link", { name: /Abrir no WhatsApp: Marina Fila E2E/ });
  await expect(abrir).toBeVisible();
  const href = (await abrir.getAttribute("href")) ?? "";
  expect(href).toMatch(/^https:\/\/wa\.me\/5511987654321\?text=/);
  expect(decodeURIComponent(href)).toContain("Marina");

  // O WhatsApp abre em outra aba; aqui basta confirmar que o envio fica anotado
  await abrir.evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
  await abrir.click();
  await expect(page.getByText("1 de 1 abertos")).toBeVisible();
});
