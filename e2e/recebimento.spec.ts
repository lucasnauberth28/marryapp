import { criarCasalPronto, entrarComoAdmin, expect, novoContexto, SENHA, test } from "./helpers";
import type { Browser, Page } from "@playwright/test";

// Onde receber os presentes: cadastro com senha, só máscara depois de salvo, troca exigindo a senha de novo,
// confirmação, e a administração vendo o casal (só leitura) sem conseguir cadastrar nem ver o dado inteiro.
// Exige PAYOUT_ENCRYPTION_KEY no servidor (sem ela o cadastro fica indisponível, por desenho).

const CPF = "529.982.247-25";
const CPF_SO_DIGITOS = "52998224725";

const adminSenha = () => {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) throw new Error("Defina ADMIN_PASSWORD (a mesma do servidor) para o teste entrar como admin.");
  return senha;
};

async function abrirTela(page: Page) {
  await page.goto("/configuracoes/recebimento");
  await expect(page.getByRole("heading", { level: 1, name: "Onde receber os presentes" })).toBeVisible();
}

async function paginaAdmin(browser: Browser) {
  const contexto = await novoContexto(browser);
  const page = await contexto.newPage();
  await entrarComoAdmin(page, adminSenha());
  await expect(page).toHaveURL(/\/admin$/);
  return { contexto, page };
}

test("o casal cadastra, vê só a máscara, troca exigindo a senha e confirma", async ({ page }) => {
  await criarCasalPronto(page, "recebimento");
  await abrirTela(page);

  // O texto é honesto: cadastro agora, repasse liberado pela equipe, sem prazo inventado
  await expect(page.getByText(/chegam ao Aceito e depois são repassados para este destino/)).toBeVisible();
  await expect(page.getByText(/3,99%/).first()).toBeVisible();
  await expect(page.getByText(/liberado pela equipe do Aceito/)).toBeVisible();
  await expect(page.getByText(/automático/i)).toHaveCount(0);
  await expect(page.getByText("Nenhum destino cadastrado")).toBeVisible();

  // Pix de CPF
  await page.getByRole("button", { name: "Cadastrar onde receber" }).click();
  await page.getByLabel("Nome completo do titular").fill("Ana Teste Silva");
  await page.getByLabel("CPF ou CNPJ do titular").fill(CPF);
  await page.getByLabel("Tipo da chave").selectOption("CPF");
  await page.getByLabel("Chave Pix").fill(CPF);

  // Senha errada: recusa e não grava
  await page.getByLabel("Sua senha do Aceito").fill("senha-errada-123");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.locator("p[role=alert]")).toContainText("A senha não confere");
  await expect(page.getByLabel("Sua senha do Aceito")).toHaveValue("");

  // Chave de CPF de outra pessoa: recusa antes mesmo da senha
  await page.getByLabel("Chave Pix").fill("390.533.447-05");
  await page.getByLabel("Sua senha do Aceito").fill(SENHA);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.locator("p[role=alert]")).toContainText("do próprio titular");

  // Senha certa: salva e mostra só a máscara
  await page.getByLabel("Chave Pix").fill(CPF);
  await page.getByLabel("Sua senha do Aceito").fill(SENHA);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Destino cadastrado")).toBeVisible();
  await expect(page.getByText("Pix CPF final 25")).toBeVisible();
  await expect(page.getByText("CPF final 4725")).toBeVisible();
  await expect(page.getByText("Falta confirmar que está certo")).toBeVisible();

  // Recarregar também não traz o dado inteiro, nem no HTML
  await abrirTela(page);
  await expect(page.getByText("Pix CPF final 25")).toBeVisible();
  const html = await page.content();
  expect(html).not.toContain(CPF_SO_DIGITOS);
  expect(html).not.toContain(CPF);
  await expect(page.locator("input[type=text]")).toHaveCount(0);

  // Trocar para conta bancária: o formulário abre vazio e pede a senha de novo
  await page.getByRole("button", { name: "Trocar os dados" }).click();
  await expect(page.getByLabel("Nome completo do titular")).toHaveValue("");
  await page.getByText("Conta bancária", { exact: true }).click();
  await page.getByLabel("Nome completo do titular").fill("Ana Teste Silva");
  await page.getByLabel("CPF ou CNPJ do titular").fill(CPF);
  await page.getByLabel("Código do banco").fill("260");
  await page.getByLabel("Agência").fill("0001");
  await page.getByLabel("Conta", { exact: true }).fill("1234545");
  await page.getByLabel("Tipo da conta").selectOption("PAGAMENTO");
  await page.getByLabel("Sua senha do Aceito").fill("outra-senha-errada");
  await page.getByRole("button", { name: "Salvar os novos dados" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("A senha não confere");
  await page.getByLabel("Sua senha do Aceito").fill(SENHA);
  await page.getByRole("button", { name: "Salvar os novos dados" }).click();
  await expect(page.getByText("Banco 260, ag 0001, conta •••• 45")).toBeVisible();
  await expect(page.getByText("Falta confirmar que está certo")).toBeVisible();
  expect(await page.content()).not.toContain("1234545");

  // O aviso da troca chega ao sino do painel
  await page.goto("/notificacoes");
  await expect(page.getByText("Os dados de recebimento foram alterados").first()).toBeVisible();

  // Confirmar também pede a senha
  await abrirTela(page);
  await page.getByRole("button", { name: "Confirmar que está certo" }).click();
  await page.getByLabel("Sua senha do Aceito").fill(SENHA);
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByText(/Confirmado em/)).toBeVisible();
});

test("a administração só vê a máscara e, entrando como o casal, não consegue cadastrar nem trocar", async ({ page, browser }) => {
  const { email } = await criarCasalPronto(page, "recebimento-admin");
  await abrirTela(page);
  await page.getByRole("button", { name: "Cadastrar onde receber" }).click();
  await page.getByLabel("Nome completo do titular").fill("Ana Teste Silva");
  await page.getByLabel("CPF ou CNPJ do titular").fill(CPF);
  await page.getByLabel("Tipo da chave").selectOption("EMAIL");
  await page.getByLabel("Chave Pix").fill("ana.teste@exemplo.com");
  await page.getByLabel("Sua senha do Aceito").fill(SENHA);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Pix e-mail a***@exemplo.com")).toBeVisible();

  const { contexto, page: admin } = await paginaAdmin(browser);
  await admin.goto(`/admin/casais?q=${encodeURIComponent(email)}`);
  await admin.getByRole("link", { name: /Ana & Bia/ }).first().click();
  await expect(admin).toHaveURL(/\/admin\/casais\/[0-9a-f-]{36}$/);
  const base = admin.url();

  // Detalhe do casal: máscara, nunca o dado; nenhum botão que decifre
  await admin.goto(`${base}?aba=pagamentos`);
  const painel = admin.locator("section").filter({ has: admin.getByRole("heading", { name: "Dados de recebimento" }) });
  await expect(painel).toContainText("Pix e-mail a***@exemplo.com");
  await expect(painel).toContainText("Falta o casal confirmar");
  await expect(painel).toContainText("CPF final 4725");
  await expect(painel.getByRole("button")).toHaveCount(0);
  const htmlAdmin = await admin.content();
  expect(htmlAdmin).not.toContain("ana.teste@exemplo.com");
  expect(htmlAdmin).not.toContain(CPF_SO_DIGITOS);

  // Entrando como o casal (somente leitura): vê a máscara, mas o cadastro e a troca não existem
  await admin.getByRole("link", { name: "Entrar como este casal" }).click();
  await admin.getByLabel("Por que você vai entrar?").selectOption("Atender um pedido de suporte");
  await admin.getByRole("button", { name: /^Entrar como Ana & Bia/ }).click();
  await expect(admin).toHaveURL(/\/dashboard$/);
  await admin.goto("/configuracoes/recebimento");
  await expect(admin.getByText("Pix e-mail a***@exemplo.com")).toBeVisible();
  await expect(admin.getByText(/Só quem é do casal cadastra ou altera|Você está só olhando este casal/).first()).toBeVisible();
  await expect(admin.getByRole("button", { name: "Trocar os dados" })).toHaveCount(0);
  await expect(admin.getByRole("button", { name: "Remover" })).toHaveCount(0);
  await expect(admin.getByRole("button", { name: "Confirmar que está certo" })).toHaveCount(0);
  await contexto.close();
});
