import { cadastrarFornecedor, criarCasalPronto, emailUnico, entrar, expect, novoContexto, test } from "./helpers";

// Acesso negado nas telas e rotas de dinheiro da administração (fornecedores, planos, catálogo, domínios).
// As Server Actions dessas telas só existem dentro destas páginas e todas começam com requirePlatformAdmin;
// aqui conferimos que quem não é administração nem chega às telas nem às rotas de API.

const ROTAS_API = ["/api/admin/fornecedores.csv", "/api/admin/contador?mes=2026-09"];
const PAGINAS = [
  "/admin/fornecedores",
  "/admin/fornecedores/curadoria",
  "/admin/planos",
  "/admin/planos?aba=reembolsos",
  "/admin/planos/assinaturas",
  "/admin/planos/cupons",
  "/admin/planos/catalogo",
  "/admin/dominios",
];

test("sem sessão: telas pedem login e as rotas de API respondem 401", async ({ page, request }) => {
  for (const rota of PAGINAS) {
    await page.goto(rota);
    await expect(page, rota).toHaveURL(/\/login\?proxima=/);
  }
  for (const rota of ROTAS_API) expect((await request.get(rota)).status(), rota).toBe(401);
});

test("casal não abre as telas de dinheiro e as rotas de API respondem 403", async ({ page }) => {
  await criarCasalPronto(page, "casal-dinheiro");
  for (const rota of PAGINAS) {
    await page.goto(rota);
    await expect(page, rota).toHaveURL(/\/dashboard$/);
  }
  for (const rota of ROTAS_API) expect((await page.request.get(rota)).status(), rota).toBe(403);
  // As telas antigas não viram atalho
  for (const antiga of ["/curadoria", "/assinaturas", "/assinaturas?aba=cupons", "/dominios"]) {
    await page.goto(antiga);
    await expect(page, antiga).not.toHaveURL(/\/admin/);
  }
});

test("fornecedor não abre as telas de dinheiro nem a curadoria", async ({ page }) => {
  await cadastrarFornecedor(page, emailUnico("forn-dinheiro"), "Bia Dinheiro", "Estúdio Dinheiro");
  for (const rota of [...PAGINAS, "/curadoria", "/assinaturas", "/dominios"]) {
    await page.goto(rota);
    await expect(page, rota).toHaveURL(/\/fornecedor/);
  }
  for (const rota of ROTAS_API) expect((await page.request.get(rota)).status(), rota).toBe(403);
});

test("administração aprova, destaca e suspende um fornecedor, com efeito na vitrine", async ({ page, browser }) => {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) throw new Error("Defina ADMIN_PASSWORD (a mesma do servidor) para o teste entrar como admin.");
  const empresa = `Buffet Dinheiro ${Date.now()}`;
  await cadastrarFornecedor(page, emailUnico("forn-vitrine"), "Dora Vitrine", empresa);

  const admin = await novoContexto(browser);
  const painel = await admin.newPage();
  await entrar(painel, "admin", senha);

  // Curadoria: aprova
  await painel.goto(`/admin/fornecedores/curadoria?q=${encodeURIComponent(empresa)}`);
  await expect(painel.getByRole("heading", { level: 2, name: empresa })).toBeVisible();
  await painel.getByRole("button", { name: "Aprovar" }).click();
  await expect(painel.getByText(/aprovado e publicado/)).toBeVisible();

  // Vitrine pública mostra o fornecedor
  const publico = await admin.newPage();
  await publico.goto("/fornecedores");
  await expect(publico.getByText(empresa).first()).toBeVisible();

  // Destaque liga (o interruptor só existe depois de aprovado)
  await painel.goto(`/admin/fornecedores?q=${encodeURIComponent(empresa)}`);
  await painel.getByRole("link", { name: new RegExp(empresa) }).first().click();
  await expect(painel.getByRole("switch", { name: "Destacar na vitrine" })).toBeEnabled();
  await painel.getByRole("switch", { name: "Destacar na vitrine" }).click();
  await expect(painel.getByText("Destacado no topo da vitrine.")).toBeVisible();

  // Suspende: some da vitrine
  await painel.getByRole("button", { name: "Suspender o fornecedor" }).click();
  await painel.getByLabel("Motivo da suspensão").fill("Teste automático de suspensão");
  await painel.getByRole("button", { name: "Suspender o fornecedor" }).last().click();
  await expect(painel.getByText("Fornecedor suspenso.")).toBeVisible();
  await publico.goto("/fornecedores");
  await expect(publico.getByText(empresa)).toHaveCount(0);

  // O painel do fornecedor avisa da suspensão
  await page.goto("/fornecedor");
  await expect(page.getByText("Seu perfil está suspenso")).toBeVisible();

  // Reativa
  await painel.getByRole("button", { name: "Reativar o fornecedor" }).click();
  await expect(painel.getByText(/Suspensão desfeita/)).toBeVisible();
  await admin.close();
});
