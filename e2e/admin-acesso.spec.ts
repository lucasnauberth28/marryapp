import { cadastrarFornecedor, criarCasalPronto, emailUnico, entrar, expect, test } from "./helpers";

// Acesso à administração da plataforma (/admin): só a conta com acesso total ("*") entra.
// Casal e fornecedor são mandados de volta ao próprio painel; a API do /admin recusa quem não é administração.

const adminSenha = () => {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) throw new Error("Defina ADMIN_PASSWORD (a mesma do servidor) para o teste entrar como admin.");
  return senha;
};

test("administração entra direto em /admin, navega pelo menu e sai", async ({ page }) => {
  await entrar(page, "admin", adminSenha());
  await expect(page).toHaveURL(/\/admin$/);

  const menu = page.getByRole("navigation", { name: "Administração" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link", { name: "Visão geral" })).toHaveAttribute("aria-current", "page");

  await menu.getByRole("link", { name: "Casais", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/casais$/);
  await expect(page.getByRole("heading", { level: 1, name: "Casais" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Casais", exact: true })).toHaveAttribute("aria-current", "page");

  // O login de quem já está logado também leva à administração
  await page.goto("/login");
  await expect(page).toHaveURL(/\/admin$/);

  // A API do /admin responde à administração
  const resposta = await page.request.get("/api/admin/sessao");
  expect(resposta.status()).toBe(200);
  expect(await resposta.json()).toMatchObject({ ok: true });

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("quem não tem sessão vai ao login (voltando ao /admin depois) e a API responde 401", async ({ page, request }) => {
  await page.goto("/admin/casais");
  await expect(page).toHaveURL(/\/login\?proxima=%2Fadmin%2Fcasais/);

  const resposta = await request.get("/api/admin/sessao");
  expect(resposta.status()).toBe(401);
});

test("casal não entra na administração: volta ao painel e a API do /admin recusa", async ({ page }) => {
  await criarCasalPronto(page, "casal-admin");

  for (const rota of ["/admin", "/admin/casais", "/admin/saude", "/admin/configuracoes", "/admin/casais/3f2504e0-4f89-41d3-9a0c-0305e82c3301"]) {
    await page.goto(rota);
    await expect(page, rota).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("navigation", { name: "Administração" })).toHaveCount(0);
    await expect(page.getByText("Gestão da plataforma")).toHaveCount(0);
  }

  const api = await page.request.get("/api/admin/sessao");
  expect(api.status()).toBe(403);
  expect(await api.text()).not.toContain("name");
});

test("fornecedor não entra na administração", async ({ page }) => {
  await cadastrarFornecedor(page, emailUnico("forn-admin"), "Bia Fornecedora", "Estúdio Teste Admin");

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/fornecedor/);
  await expect(page.getByText("Gestão da plataforma")).toHaveCount(0);

  const api = await page.request.get("/api/admin/sessao");
  expect(api.status()).toBe(403);
});
