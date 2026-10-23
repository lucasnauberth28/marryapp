import { SENHA, emailUnico, expect, test } from "./helpers";

// Cadastro e boas-vindas: a data do casamento é pedida uma vez só (nas boas-vindas) e o casal chega ao painel em poucos passos.

test("o cadastro não pede a data e guarda o plano escolhido", async ({ page }) => {
  await page.goto("/cadastro?tipo=casal&plano=classic");
  await expect(page.getByRole("heading", { name: /Escolham o plano/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Classic/ })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: /Continuar com o Classic/ }).click();

  // A escolha de plano segue na tela de dados, e a data não aparece
  await expect(page.getByText("Plano escolhido")).toBeVisible();
  await expect(page.getByText(/Classic/).first()).toBeVisible();
  await expect(page.getByLabel(/Data do casamento/)).toHaveCount(0);
  await expect(page.getByLabel(/Ainda não temos a data/)).toHaveCount(0);
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("WhatsApp")).toBeVisible();
});

test("do cadastro ao painel: uma tela de nomes e data, e a data chega ao site", async ({ page }) => {
  const ano = new Date().getFullYear() + 1;
  await page.goto("/cadastro?tipo=casal");
  await page.getByRole("radio", { name: /Básico/ }).click();
  await page.getByRole("button", { name: /Continuar com o Básico/ }).click();
  await page.getByLabel("Seu nome", { exact: true }).fill("Ana Teste Silva");
  await page.getByLabel("E-mail").fill(emailUnico("onb"));
  await page.getByLabel("WhatsApp").fill("(11) 98765-4321");
  await page.getByLabel("Crie uma senha").fill(SENHA);
  await page.getByRole("button", { name: /^Criar conta/ }).click();

  // Direto às boas-vindas, sem tela de "conta criada" no meio; o primeiro nome já vem preenchido
  await page.waitForURL(/\/boas-vindas/);
  await expect(page.getByRole("heading", { name: /Quem vai casar, e quando/ })).toBeVisible();
  await expect(page.getByLabel("Seu nome", { exact: true })).toHaveValue("Ana");
  // Uma tela só: nada de cidade, faixa de convidados nem cor
  await expect(page.getByLabel(/Cidade/)).toHaveCount(0);
  await expect(page.getByText(/Quantos convidados/)).toHaveCount(0);
  await expect(page.getByRole("radiogroup")).toHaveCount(0);

  // O par é obrigatório e o erro aparece ao lado do campo
  await page.getByRole("button", { name: "Criar o site de vocês" }).click();
  await expect(page.getByText("Informe o nome de quem vai casar com você.")).toBeVisible();
  await expect(page.getByLabel("Nome de quem vai casar com você")).toBeFocused();

  await page.getByLabel("Nome de quem vai casar com você").fill("Bia");
  await page.getByLabel(/Data do casamento/).fill(`${ano}-04-17`);
  await page.getByRole("button", { name: "Criar o site de vocês" }).click();

  await expect(page.getByRole("heading", { name: "Tudo pronto" })).toBeVisible();
  const sitePath = await page.getByRole("link", { name: /\/casamento\// }).getAttribute("href");
  expect(sitePath).toMatch(/^\/casamento\/ana-e-bia/);

  // A data digitada uma vez aparece no site público
  const site = await page.context().newPage();
  await site.goto(sitePath!);
  await expect(site.getByText(new RegExp(`17 de abril de ${ano}`, "i")).first()).toBeVisible();
  await site.close();

  await page.getByRole("link", { name: "Ir para o painel" }).click();
  await page.waitForURL(/\/dashboard/);
});
