import { criarCasalPronto, entrar, expect, novoContexto, test } from "./helpers";
import type { Browser, Page } from "@playwright/test";

// Administração, Casais: "Entrar como este casal" (somente leitura, edição com segunda confirmação, saída),
// suspensão do casal aplicada de verdade e isolamento (casal comum não chega ao /admin nem forja a entrada).

const adminSenha = () => {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) throw new Error("Defina ADMIN_PASSWORD (a mesma do servidor) para o teste entrar como admin.");
  return senha;
};

async function paginaAdmin(browser: Browser) {
  const contexto = await novoContexto(browser);
  const page = await contexto.newPage();
  await entrar(page, "admin", adminSenha());
  await expect(page).toHaveURL(/\/admin$/);
  return { contexto, page };
}

/** Abre o detalhe do casal pela lista (busca pelo e-mail) e devolve o id da URL. */
async function abrirCasal(admin: Page, email: string): Promise<string> {
  await admin.goto(`/admin/casais?q=${encodeURIComponent(email)}`);
  await admin.getByRole("link", { name: /Ana & Bia/ }).first().click();
  await expect(admin).toHaveURL(/\/admin\/casais\/[0-9a-f-]{36}$/);
  return admin.url().split("/").pop()!;
}

async function adicionarConvidado(page: Page, nome: string) {
  await page.goto("/convidados");
  await page.getByRole("button", { name: "Adicionar convidado" }).click();
  await page.getByLabel("Nome no convite").fill(nome);
  await page.getByRole("button", { name: "Salvar convidado" }).click();
}

async function entrarComo(admin: Page, opcoes: { editar?: boolean } = {}) {
  await admin.getByRole("link", { name: "Entrar como este casal" }).click();
  await expect(admin.getByRole("heading", { name: /Entrar como Ana & Bia\?/ })).toBeVisible();
  await admin.getByLabel("Por que você vai entrar?").selectOption("Atender um pedido de suporte");
  if (opcoes.editar) {
    await admin.getByRole("checkbox", { name: /Permitir editar/ }).check();
    const entrar = admin.getByRole("button", { name: /^Entrar como Ana & Bia/ });
    await expect(entrar, "editar exige a segunda confirmação").toBeDisabled();
    await admin.getByRole("checkbox", { name: /Entendo e quero poder editar/ }).check();
  }
  await admin.getByRole("button", { name: /^Entrar como Ana & Bia/ }).click();
  await expect(admin).toHaveURL(/\/dashboard$/);
}

test("entrar como: o admin vê o painel, a escrita é recusada em somente leitura e a saída volta ao casal", async ({ page, browser }) => {
  const { email } = await criarCasalPronto(page, "casal-leitura");
  const visivel = `Convidada Visivel ${Date.now()}`;
  await adicionarConvidado(page, visivel);
  await expect(page.locator("tbody").getByText(visivel)).toBeVisible();

  const { contexto, page: admin } = await paginaAdmin(browser);
  const id = await abrirCasal(admin, email);
  await entrarComo(admin);

  // Faixa fixa em todas as telas do painel do casal, em somente leitura
  const faixa = admin.getByRole("status").filter({ hasText: "Você está vendo como Ana & Bia" });
  await expect(faixa).toBeVisible();
  await expect(faixa).toContainText("Só leitura");
  await admin.goto("/convidados");
  await expect(faixa).toBeVisible();
  await expect(admin.locator("tbody").getByText(visivel)).toBeVisible();

  // Tenta escrever: a Server Action recusa e nada é gravado
  const tentativa = `Convidado Barrado ${Date.now()}`;
  await admin.getByRole("button", { name: "Adicionar convidado" }).click();
  await admin.getByLabel("Nome no convite").fill(tentativa);
  await admin.getByRole("button", { name: "Salvar convidado" }).click();
  await admin.waitForTimeout(1500);
  await admin.goto("/convidados");
  await expect(admin.getByText(tentativa)).toHaveCount(0);

  // Sair deste casal: volta ao detalhe, sem faixa, e a entrada ficou na linha do tempo
  await admin.getByRole("button", { name: "Sair deste casal" }).click();
  await expect(admin).toHaveURL(new RegExp(`/admin/casais/${id}$`));
  await expect(admin.getByText("Você está vendo como")).toHaveCount(0);
  await expect(admin.getByText("A equipe entrou no painel como o casal")).toBeVisible();
  // Depois de sair, o painel do casal volta ao comportamento normal (sem faixa)
  await admin.goto("/dashboard");
  await expect(admin.getByText("Você está vendo como")).toHaveCount(0);

  // O casal nunca viu nada disso
  await page.goto("/convidados");
  await expect(page.getByText(tentativa)).toHaveCount(0);
  await contexto.close();
});

test("entrar como com edição: precisa da segunda confirmação e só então grava", async ({ page, browser }) => {
  const { email } = await criarCasalPronto(page, "casal-edicao");
  const { contexto, page: admin } = await paginaAdmin(browser);
  await abrirCasal(admin, email);
  await entrarComo(admin, { editar: true });

  await expect(admin.getByRole("status").filter({ hasText: "Edição liberada" })).toBeVisible();
  const nome = `Convidada Editada ${Date.now()}`;
  await adicionarConvidado(admin, nome);
  await expect(admin.locator("tbody").getByText(nome)).toBeVisible();

  await admin.getByRole("button", { name: "Sair deste casal" }).click();
  await expect(admin).toHaveURL(/\/admin\/casais\//);
  await page.goto("/convidados");
  await expect(page.locator("tbody").getByText(nome)).toBeVisible();
  await contexto.close();
});

test("casal comum não chega ao /admin nem forja a entrada como outro casal", async ({ page, browser }) => {
  await criarCasalPronto(page, "casal-forja");
  // Cookies forjados: texto solto, uuid puro e JWT que não é nosso
  const forjados = ["lixo", "3f2504e0-4f89-41d3-9a0c-0305e82c3301", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiJ4IiwidWlkIjoieSJ9.assinatura-falsa"];
  for (const valor of forjados) {
    await page.context().addCookies([{ name: "aceito_entrar_como", value: valor, url: "http://localhost:3000" }]);
    await page.goto("/dashboard");
    await expect(page.getByText("Você está vendo como")).toHaveCount(0);
    await page.goto("/admin/casais");
    await expect(page).toHaveURL(/\/dashboard$/);
  }
  // A ação de iniciar a entrada também é só da administração
  const resposta = await page.request.get("/admin/casais/3f2504e0-4f89-41d3-9a0c-0305e82c3301/entrar-como", { maxRedirects: 0 });
  expect([307, 308, 404]).toContain(resposta.status());
  expect((await page.request.get("/api/admin/casais.csv")).status()).toBe(403);
  void browser;
});

test("suspender o casal tira o site do ar e deixa o painel só para leitura; reativar devolve", async ({ page, browser }) => {
  const { email, sitePath } = await criarCasalPronto(page, "casal-suspenso");
  const { contexto, page: admin } = await paginaAdmin(browser);
  await abrirCasal(admin, email);

  await admin.getByRole("button", { name: "Suspender o casal" }).click();
  const dialogo = admin.getByRole("dialog");
  await dialogo.getByLabel(/Motivo/).fill("Teste de suspensão pelo e2e");
  await dialogo.getByRole("button", { name: "Suspender o casal" }).click();
  await expect(admin.getByText("Site fora do ar").first()).toBeVisible();

  // Site público e páginas de convidado: indisponíveis
  for (const caminho of [sitePath, `${sitePath}/rsvp`, `${sitePath}/presentes`, `${sitePath}/dia-do-evento`]) {
    await page.goto(caminho);
    await expect(page.getByRole("heading", { name: "Este site está indisponível no momento" }), caminho).toBeVisible();
    await expect(page.getByText(/Ana/)).toHaveCount(0);
  }
  // Painel do casal: lê, mas não escreve
  const nome = `Convidado Suspenso ${Date.now()}`;
  await adicionarConvidado(page, nome);
  await page.waitForTimeout(1500);
  await page.goto("/convidados");
  await expect(page.getByText(nome)).toHaveCount(0);

  // Reativar
  await admin.getByRole("button", { name: "Reativar o casal" }).click();
  await admin.getByRole("dialog").getByRole("button", { name: "Reativar o casal" }).click();
  await expect(admin.getByText("Site no ar").first()).toBeVisible();
  await page.goto(sitePath);
  await expect(page.getByText(/Ana/).first()).toBeVisible();
  await adicionarConvidado(page, nome);
  await expect(page.locator("tbody").getByText(nome)).toBeVisible();
  await contexto.close();
});
