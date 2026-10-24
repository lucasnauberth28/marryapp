import { criarCasalPronto, expect, test, novoContexto } from "./helpers";

test("convidado presenteia no site do casal e recebe um Pix copia e cola", async ({ page, browser }) => {
  // O casal cadastra um presente na lista
  const { sitePath } = await criarCasalPronto(page, "presente");
  await page.goto("/presentes-admin");
  await page.getByRole("button", { name: /Novo presente/ }).click();
  await page.getByLabel("Nome do presente").fill("Cafeteira E2E");
  await page.getByLabel("Valor em reais").fill("150");
  await page.getByRole("button", { name: "Adicionar presente" }).click();
  await expect(page.getByText("Cafeteira E2E")).toBeVisible();

  // Um convidado, sem conta, abre o site e gera o Pix
  const convidado = await novoContexto(browser, { permissions: ["clipboard-read", "clipboard-write"] });
  const pagina = await convidado.newPage();
  await pagina.goto(`${sitePath}/presentes`);
  await pagina.getByRole("link", { name: "Presentear: Cafeteira E2E" }).click();
  await pagina.waitForURL(/\/checkout\//);

  await pagina.getByLabel("Seu nome completo").fill("Convidado E2E");
  await pagina.getByLabel("Seu WhatsApp com DDD").fill("11999998888");
  await pagina.getByRole("button", { name: /Continuar para o pagamento/ }).click();
  await pagina.getByRole("radio", { name: /^Pix/ }).click();

  // Antes de pagar: para quem é o presente, o valor cobrado e a taxa sem promessa de repasse
  const resumo = pagina.getByRole("region", { name: /O presente é para/ });
  await expect(resumo).toContainText("O presente é para Ana & Bia");
  await expect(resumo).toContainText("De Convidado E2E");
  await expect(resumo).toContainText(/Você paga\s*R\$\s*150,00/);
  await expect(resumo).toContainText("Se o plano do casal tiver taxa");
  await expect(resumo).not.toContainText(/repasse|prazo|dias úteis/i);
  // O botão da Liz é do painel do casal: não aparece no checkout
  await expect(pagina.getByRole("button", { name: "Falar com a Liz" })).toHaveCount(0);

  await pagina.getByRole("button", { name: "Gerar Pix" }).click();

  await expect(pagina.getByRole("heading", { name: "Faça o Pix" })).toBeVisible();
  await expect(pagina.locator("svg").filter({ has: pagina.locator("path") }).first()).toBeVisible();
  await pagina.getByRole("button", { name: /Copiar código Pix/ }).click();
  await expect(pagina.getByRole("button", { name: "Código copiado" })).toBeVisible();

  // O código copiado é um BR Code do Pix válido
  const codigo = await pagina.evaluate(() => navigator.clipboard.readText());
  expect(codigo).toMatch(/^000201/);
  expect(codigo.toLowerCase()).toContain("br.gov.bcb.pix");
  expect(codigo).toContain("150.00"); // valor do presente
  await convidado.close();
});

test("quem já confirmou presença não digita nome e WhatsApp de novo, e pode dizer que não é essa pessoa", async ({ page, browser }) => {
  const { sitePath } = await criarCasalPronto(page, "presente-conhecido");
  await page.goto("/presentes-admin");
  await page.getByRole("button", { name: /Novo presente/ }).click();
  await page.getByLabel("Nome do presente").fill("Jogo de panelas E2E");
  await page.getByLabel("Valor em reais").fill("200");
  await page.getByRole("button", { name: "Adicionar presente" }).click();
  await expect(page.getByText("Jogo de panelas E2E")).toBeVisible();

  // O casal cadastra a convidada, com o WhatsApp que ela vai digitar na confirmação
  await page.goto("/convidados");
  await page.getByRole("button", { name: "Adicionar convidado" }).click();
  await page.getByLabel("Nome no convite").fill("Marina Convidada E2E");
  await page.getByLabel("WhatsApp").fill("(21) 97777-6655");
  await page.getByRole("button", { name: "Salvar convidado" }).click();
  await expect(page.locator("tbody").getByText("Marina Convidada E2E")).toBeVisible();

  const convidada = await novoContexto(browser);
  const pagina = await convidada.newPage();

  // Sem ter confirmado presença, o checkout pede os dados normalmente
  await pagina.goto(`${sitePath}/presentes`);
  await pagina.getByRole("link", { name: "Presentear: Jogo de panelas E2E" }).click();
  await pagina.waitForURL(/\/checkout\//);
  await expect(pagina.getByLabel("Seu nome completo")).toBeVisible();
  const checkout = pagina.url();

  // Ela confirma presença (aqui ela se identifica) e abre o presente na mesma aba
  await pagina.goto(`${sitePath}/rsvp`);
  await pagina.getByLabel("Seu WhatsApp com DDD").fill("21977776655");
  await pagina.getByRole("button", { name: "Encontrar meu convite" }).click();
  await pagina.getByRole("button", { name: "Confirmar presença" }).click();
  await expect(pagina.getByRole("heading", { name: "Que alegria!" })).toBeVisible();
  await pagina.goto(checkout);

  await expect(pagina.getByRole("heading", { name: "Confirme quem presenteia" })).toBeVisible();
  await expect(pagina.getByText("Marina Convidada E2E")).toBeVisible();
  await expect(pagina.getByText("WhatsApp final 6655")).toBeVisible();
  await expect(pagina.getByLabel("Seu nome completo")).toHaveCount(0);
  // Finalidade clara dos dados
  await expect(pagina.getByText(/só para avisar Ana & Bia de quem presenteou/)).toBeVisible();

  // Confirmado, o resto segue: o resumo mostra para quem vai e quanto será cobrado
  await pagina.getByRole("button", { name: /Sim, sou eu/ }).click();
  await pagina.getByRole("radio", { name: /^Pix/ }).click();
  const resumo = pagina.getByRole("region", { name: /O presente é para/ });
  await expect(resumo).toContainText("De Marina Convidada E2E");
  await expect(resumo).toContainText(/Você paga\s*R\$\s*200,00/);
  await pagina.getByRole("button", { name: "Voltar" }).click();

  // "Não sou essa pessoa" abre o formulário vazio e esquece os dados da aba
  await pagina.getByRole("button", { name: "Não sou essa pessoa" }).click();
  await expect(pagina.getByLabel("Seu nome completo")).toHaveValue("");
  await expect(pagina.getByLabel("Seu WhatsApp com DDD")).toHaveValue("");
  await pagina.reload();
  await expect(pagina.getByLabel("Seu nome completo")).toBeVisible();
  await expect(pagina.getByText("Marina Convidada E2E")).toHaveCount(0);
  await convidada.close();
});
