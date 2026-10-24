import { criarCasalPronto, expect, novoContexto, test } from "./helpers";

const tema = (page: import("@playwright/test").Page) => page.locator("html").getAttribute("data-theme");

test("trocar o tema pelo seletor persiste depois de recarregar", async ({ page }) => {
  await criarCasalPronto(page, "tema");
  await page.goto("/configuracoes");

  // Configurações: seção "Aparência" com as três opções
  await expect(page.getByText("Claro, escuro ou o do seu aparelho")).toBeVisible();
  await page.locator("label", { hasText: "Escuro" }).click();
  await expect.poll(() => tema(page)).toBe("dark");
  await page.reload();
  expect(await tema(page)).toBe("dark");
  await expect(page.getByRole("radio", { name: "Escuro" })).toBeChecked();

  // Cabeçalho do painel: botão sol/lua com o menu Claro / Escuro / Do aparelho
  await page.getByRole("button", { name: "Aparência do aplicativo" }).click();
  await page.getByRole("menuitemradio", { name: "Claro" }).click();
  await expect.poll(() => tema(page)).toBe("light");
  await page.reload();
  expect(await tema(page)).toBe("light");

  // "Do aparelho" segue o sistema
  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByRole("button", { name: "Aparência do aplicativo" }).click();
  await page.getByRole("menuitemradio", { name: "Do aparelho" }).click();
  await expect.poll(() => tema(page)).toBe("dark");
});

test("no tema escuro o QR do Pix mantém fundo branco e margem clara", async ({ page, browser }) => {
  const { sitePath } = await criarCasalPronto(page, "qrescuro");
  await page.goto("/presentes-admin");
  await page.getByRole("button", { name: /Novo presente/ }).click();
  await page.getByLabel("Nome do presente").fill("Liquidificador E2E");
  await page.getByLabel("Valor em reais").fill("90");
  await page.getByRole("button", { name: "Adicionar presente" }).click();
  await expect(page.getByText("Liquidificador E2E")).toBeVisible();

  const convidado = await novoContexto(browser, { colorScheme: "dark" });
  const pagina = await convidado.newPage();
  await pagina.goto(`${sitePath}/presentes`);
  // Escolha "Escuro" gravada no cookie do tema, como o seletor faz
  await pagina.evaluate(() => {
    document.cookie = "aceito-theme=dark; Path=/";
  });
  await pagina.getByRole("link", { name: "Presentear: Liquidificador E2E" }).click();
  await pagina.waitForURL(/\/checkout\//);
  expect(await tema(pagina)).toBe("dark");

  await pagina.getByLabel("Seu nome completo").fill("Convidado E2E");
  await pagina.getByLabel("Seu WhatsApp com DDD").fill("11999998888");
  await pagina.getByRole("button", { name: /Continuar para o pagamento/ }).click();
  await pagina.getByRole("radio", { name: /^Pix/ }).click();
  await pagina.getByRole("button", { name: "Gerar Pix" }).click();
  await expect(pagina.getByRole("heading", { name: "Faça o Pix" })).toBeVisible();

  const qr = pagina.getByRole("img", { name: "QR Code do Pix" });
  await expect(qr).toBeVisible();
  const moldura = pagina.locator("[data-qr-frame]");
  await expect(moldura).toHaveCSS("background-color", "rgb(255, 255, 255)");
  // Fundo do próprio desenho branco e módulos escuros
  const [fundo, modulos] = await qr.locator("path").evaluateAll((ps) => ps.map((p) => p.getAttribute("fill")));
  expect(fundo?.toLowerCase()).toBe("#ffffff");
  expect(modulos?.toLowerCase()).toBe("#1f1a1d");
  // Margem clara ao redor do desenho (zona de silêncio)
  const caixa = await moldura.boundingBox();
  const interno = await qr.boundingBox();
  expect(interno!.x - caixa!.x).toBeGreaterThanOrEqual(8);
  await convidado.close();
});
