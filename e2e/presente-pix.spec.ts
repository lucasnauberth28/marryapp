import { criarCasalPronto, expect, test, novoContexto } from "./helpers";

test("convidado presenteia no site do casal e recebe um Pix copia e cola", async ({ page, browser }) => {
  // O casal cadastra um presente na lista
  const { sitePath } = await criarCasalPronto(page, "presente");
  await page.goto("/presentes-admin");
  await page.getByRole("button", { name: /Novo Presente/ }).click();
  await page.getByPlaceholder("Ex: Jogo de Panelas Antiaderentes").fill("Cafeteira E2E");
  await page.getByPlaceholder("0.00").fill("150");
  await page.getByRole("button", { name: "Adicionar Presente" }).click();
  await expect(page.getByText("Cafeteira E2E")).toBeVisible();

  // Um convidado, sem conta, abre o site e gera o Pix
  const convidado = await novoContexto(browser, { permissions: ["clipboard-read", "clipboard-write"] });
  const pagina = await convidado.newPage();
  await pagina.goto(`${sitePath}/presentes`);
  await pagina.getByText("Cafeteira E2E").click();
  await pagina.getByRole("link", { name: /Presentear Agora/ }).click();
  await pagina.waitForURL(/\/checkout\//);

  await pagina.getByPlaceholder("Como quer ser chamado").fill("Convidado E2E");
  await pagina.getByPlaceholder("(00) 00000-0000").fill("11999998888");
  await pagina.getByRole("button", { name: /Escolher Forma de Pagamento/ }).click();
  await pagina.getByRole("button", { name: /^Pix/ }).click();
  await pagina.getByRole("button", { name: "Gerar Pix" }).click();

  await expect(pagina.getByRole("heading", { name: "Efetue o Pix" })).toBeVisible();
  await expect(pagina.locator("svg").filter({ has: pagina.locator("path") }).first()).toBeVisible();
  await pagina.getByRole("button", { name: /Copiar Código Pix/ }).click();
  await expect(pagina.getByText("Código Copiado com Sucesso!")).toBeVisible();

  // O código copiado é um BR Code do Pix válido
  const codigo = await pagina.evaluate(() => navigator.clipboard.readText());
  expect(codigo).toMatch(/^000201/);
  expect(codigo.toLowerCase()).toContain("br.gov.bcb.pix");
  expect(codigo).toContain("150.00"); // valor do presente
  await convidado.close();
});
