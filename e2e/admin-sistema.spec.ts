import type { Browser, Page } from "@playwright/test";
import { criarCasalPronto, entrar, expect, novoContexto, test } from "./helpers";

// Madrinha, Comunicados, Suporte, Saúde e Configurações da administração: acesso negado para casal e visitante nas
// Server Actions, e o modo de manutenção aplicado de verdade (casal só leitura, convidado avisado, admin livre).

const adminSenha = () => {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) throw new Error("Defina ADMIN_PASSWORD (a mesma do servidor) para o teste entrar como admin.");
  return senha;
};

async function comoAdmin(browser: Browser) {
  const context = await novoContexto(browser);
  const page = await context.newPage();
  await entrar(page, "admin", adminSenha());
  return { context, page };
}

interface Captura {
  rota: string;
  acaoId: string;
  corpo: string;
}

/** Clica e captura a chamada da Server Action (cabeçalho next-action e corpo) SEM deixar que ela chegue ao servidor. */
async function capturarAcao(page: Page, rota: string, clicar: () => Promise<void>): Promise<Captura> {
  let captura: Captura | null = null;
  await page.route("**/*", async (route) => {
    const req = route.request();
    const id = req.headers()["next-action"];
    if (req.method() === "POST" && id && !captura) {
      captura = { rota, acaoId: id, corpo: req.postData() ?? "[]" };
      await route.abort();
      return;
    }
    await route.continue();
  });
  await clicar();
  await expect.poll(() => captura, { timeout: 10_000 }).not.toBeNull();
  await page.unroute("**/*");
  return captura!;
}

test("Server Actions da administração recusam casal e visitante, e nada é gravado", async ({ browser }) => {
  test.setTimeout(240_000);
  const admin = await comoAdmin(browser);
  const p = admin.page;
  const capturas: Record<string, Captura> = {};

  // Madrinha: limites
  await p.goto("/admin/madrinha");
  const limiteAntes = await p.getByLabel("Mensagens por dia").first().inputValue();
  const novoLimite = limiteAntes === "31" ? "32" : "31";
  await p.getByLabel("Mensagens por dia").first().fill(novoLimite);
  capturas.madrinha = await capturarAcao(p, "/admin/madrinha", () => p.getByRole("button", { name: "Salvar limites" }).click());

  // Comunicados: rascunho
  await p.goto("/admin/comunicados");
  await p.getByLabel("Título").fill("Comunicado que não pode ser gravado");
  await p.getByLabel("Mensagem").fill("Texto de teste do rascunho.");
  capturas.comunicados = await capturarAcao(p, "/admin/comunicados", () => p.getByRole("button", { name: "Salvar rascunho" }).click());

  // Suporte: pedido de ajuda
  await p.goto("/admin/suporte");
  const pedidos = p.locator("section", { has: p.getByRole("heading", { name: "Pedidos de ajuda" }) });
  await pedidos.getByRole("button", { name: "Registrar pedido" }).click();
  await pedidos.getByLabel("Assunto").fill("Pedido que não pode ser gravado");
  await pedidos.getByLabel("Quem pediu").fill("Fulana de Tal");
  capturas.suporte = await capturarAcao(p, "/admin/suporte", () => pedidos.locator("form").getByRole("button", { name: "Registrar pedido" }).click());

  // Suporte: link de nova senha
  await p.reload();
  await p.getByLabel("E-mail da pessoa").first().fill("ninguem@e2e.aceito.test");
  capturas.senha = await capturarAcao(p, "/admin/suporte", () => p.getByRole("button", { name: "Enviar link de redefinição" }).click());

  // Saúde: alertas
  await p.goto("/admin/saude");
  await p.getByLabel("Enviar alertas para").fill("alerta-negado@e2e.aceito.test");
  capturas.saude = await capturarAcao(p, "/admin/saude", () => p.getByRole("button", { name: "Salvar alertas" }).click());

  // Configurações: remetente
  await p.goto("/admin/configuracoes");
  await p.getByLabel("E-mail de envio").fill("negado@e2e.aceito.test");
  capturas.config = await capturarAcao(p, "/admin/configuracoes", () => p.getByRole("button", { name: "Salvar remetente" }).click());

  // Casal e visitante tentam repetir cada chamada
  const casalCtx = await novoContexto(browser);
  const casal = await casalCtx.newPage();
  await criarCasalPronto(casal, "sistema-negado");
  const visitanteCtx = await novoContexto(browser);

  for (const [nome, c] of Object.entries(capturas)) {
    for (const [quem, ctx] of [["casal", casalCtx], ["visitante", visitanteCtx]] as const) {
      const resposta = await ctx.request.post(c.rota, {
        headers: { "next-action": c.acaoId, "content-type": "text/plain;charset=UTF-8", accept: "text/x-component" },
        data: c.corpo,
        maxRedirects: 0,
      });
      const texto = await resposta.text();
      expect(texto, `${nome} como ${quem}`).not.toContain('"success":true');
      expect(texto, `${nome} como ${quem}`).not.toContain("Comunicado que não pode ser gravado");
    }
  }

  // Nada foi gravado: o limite segue como estava, sem rascunho nem pedido, e o remetente não mudou
  await p.goto("/admin/madrinha");
  await expect(p.getByLabel("Mensagens por dia").first()).toHaveValue(limiteAntes);
  await p.goto("/admin/comunicados");
  await expect(p.getByText("Comunicado que não pode ser gravado")).toHaveCount(0);
  await p.goto("/admin/suporte");
  await expect(p.getByText("Pedido que não pode ser gravado")).toHaveCount(0);
  await p.goto("/admin/configuracoes");
  await expect(p.getByLabel("E-mail de envio")).toHaveValue("");

  // A API de exportação de titulares também recusa
  const exportacao = await casalCtx.request.get("/api/admin/suporte/exportar?pedido=3f2504e0-4f89-41d3-9a0c-0305e82c3301", { maxRedirects: 0 });
  expect([401, 403, 307, 308]).toContain(exportacao.status());

  await admin.context.close();
  await casalCtx.close();
  await visitanteCtx.close();
});

test("as telas novas redirecionam casal e visitante", async ({ browser }) => {
  test.setTimeout(180_000);
  const visitante = await novoContexto(browser);
  const pv = await visitante.newPage();
  for (const rota of ["/admin/madrinha", "/admin/madrinha/controles", "/admin/comunicados", "/admin/suporte", "/admin/saude", "/admin/configuracoes", "/admin/usuarios", "/admin/atividades"]) {
    await pv.goto(rota);
    await expect(pv, rota).toHaveURL(/\/login/);
  }
  const casalCtx = await novoContexto(browser);
  const casal = await casalCtx.newPage();
  await criarCasalPronto(casal, "sistema-telas");
  for (const rota of ["/admin/madrinha", "/admin/madrinha/controles", "/admin/comunicados", "/admin/suporte", "/admin/saude", "/admin/configuracoes", "/admin/usuarios", "/admin/atividades"]) {
    await casal.goto(rota);
    await expect(casal, rota).toHaveURL(/\/dashboard$/);
  }
  await visitante.close();
  await casalCtx.close();
});

// Liga a manutenção do SERVIDOR por alguns segundos: testes de casal rodando ao mesmo tempo seriam barrados.
// Por isso só roda quando pedido, sozinho: E2E_MANUTENCAO=1 npx playwright test e2e/admin-sistema.spec.ts --workers=1
test("modo de manutenção: casal só lê, convidado é avisado e a administração segue livre", async ({ browser }) => {
  test.skip(!process.env.E2E_MANUTENCAO, "Liga a manutenção do servidor: rode sozinho com E2E_MANUTENCAO=1 e --workers=1.");
  test.setTimeout(240_000);
  const admin = await comoAdmin(browser);
  const casalCtx = await novoContexto(browser);
  const casal = await casalCtx.newPage();
  const { sitePath } = await criarCasalPronto(casal, "sistema-manutencao");
  const p = admin.page;

  async function ligar(ligado: boolean) {
    await p.goto("/admin/configuracoes");
    const chave = p.getByRole("switch", { name: "Modo de manutenção" });
    if ((await chave.getAttribute("aria-checked")) !== String(ligado)) await chave.click();
    await p.getByLabel("Mensagem que as pessoas veem").fill("Estamos melhorando o Aceito. Voltamos em alguns minutos.");
    await p.locator("form").filter({ hasText: "Mensagem que as pessoas veem" }).getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(p.getByText(ligado ? /Modo de manutenção ligado/ : /Modo de manutenção desligado/)).toBeVisible();
  }

  try {
    await ligar(true);

    // Casal: faixa de aviso e nenhuma escrita
    await casal.goto("/pendencias");
    await expect(casal.getByText("Estamos em manutenção.")).toBeVisible();
    await casal.getByRole("button", { name: "Nova tarefa" }).first().click();
    await casal.getByLabel("O que precisa ser feito?").fill("Tarefa durante a manutenção");
    await casal.getByRole("button", { name: "Criar tarefa" }).click();
    await casal.waitForTimeout(1500);
    await casal.goto("/pendencias");
    await expect(casal.getByText("Tarefa durante a manutenção")).toHaveCount(0);

    // Convidado: aviso no site público
    const convidado = await novoContexto(browser);
    const pc = await convidado.newPage();
    await pc.goto(sitePath);
    await expect(pc.getByText("Estamos em manutenção.")).toBeVisible();
    await convidado.close();

    // A administração nunca é barrada
    await p.goto("/admin");
    await expect(p.getByRole("heading", { level: 1 })).toBeVisible();
    await p.goto("/admin/madrinha");
    await expect(p.getByRole("heading", { level: 1, name: "Madrinha" })).toBeVisible();
  } finally {
    await ligar(false);
  }

  await casal.goto("/pendencias");
  await expect(casal.getByText("Estamos em manutenção.")).toHaveCount(0);
  await admin.context.close();
  await casalCtx.close();
});
