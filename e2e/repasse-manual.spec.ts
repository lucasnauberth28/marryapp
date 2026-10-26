import { Client } from "pg";
import { criarCasalPronto, entrarComoAdmin, expect, novoContexto, SENHA, test } from "./helpers";

// Repasse manual dos presentes: a equipe transfere pelo banco e registra no detalhe do casal; o saldo do casal baixa,
// o valor nunca passa do que falta e o casal é avisado. Precisa de DATABASE_URL (o presente pago é semeado direto no banco).

const CPF = "529.982.247-25";

async function semearPresentePago(email: string, grossCents: number, feeCents: number) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const { rows } = await db.query<{ weddingId: string }>('SELECT "weddingId" FROM users WHERE username = $1', [email]);
    const weddingId = rows[0]?.weddingId;
    if (!weddingId) throw new Error("Casamento do teste não encontrado.");
    const gift = await db.query<{ id: string }>('INSERT INTO gifts (id, "weddingId", title, amount, "isPurchased") VALUES (gen_random_uuid(), $1, $2, $3, true) RETURNING id', [weddingId, "Presente do repasse", grossCents]);
    await db.query(
      `INSERT INTO transactions (id, "weddingId", "giftId", "guestName", amount, "netAmount", fee, "paymentMethod", status, "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'Convidado E2E', $3, $4, $5, 'PIX', 'APPROVED', now())`,
      [weddingId, gift.rows[0].id, grossCents, grossCents - feeCents, feeCents],
    );
  } finally {
    await db.end();
  }
}

test("a equipe registra o repasse, o saldo baixa, nunca passa do devido e o casal é avisado", async ({ page, browser }) => {
  const adminSenha = process.env.ADMIN_PASSWORD;
  if (!adminSenha) throw new Error("Defina ADMIN_PASSWORD (a mesma do servidor) para o teste entrar como admin.");

  // O casal cadastra e confirma onde receber
  const { email } = await criarCasalPronto(page, "repasse");
  await page.goto("/configuracoes/recebimento");
  await page.getByRole("button", { name: "Cadastrar onde receber" }).click();
  await page.getByLabel("Nome completo do titular").fill("Ana Teste Silva");
  await page.getByLabel("CPF ou CNPJ do titular").fill(CPF);
  await page.getByLabel("Tipo da chave").selectOption("EMAIL");
  await page.getByLabel("Chave Pix").fill("ana.repasse@exemplo.com");
  await page.getByLabel("Sua senha do Aceito").fill(SENHA);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Destino cadastrado")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar que está certo" }).click();
  await page.getByLabel("Sua senha do Aceito").fill(SENHA);
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByText(/Confirmado em/)).toBeVisible();

  // Um presente de R$ 100,00 pago, com R$ 3,99 de taxa: o líquido do casal é R$ 96,01
  await semearPresentePago(email, 10_000, 399);
  await page.goto("/configuracoes/recebimento");
  await expect(page.getByText("A repassar", { exact: true }).locator("..")).toContainText("R$ 96,01");

  // A administração abre o casal e registra um repasse parcial
  const contexto = await novoContexto(browser);
  const admin = await contexto.newPage();
  await entrarComoAdmin(admin, adminSenha);
  await admin.goto(`/admin/casais?q=${encodeURIComponent(email)}`);
  await admin.getByRole("link", { name: /Ana & Bia/ }).first().click();
  await expect(admin).toHaveURL(/\/admin\/casais\/[0-9a-f-]{36}$/);
  await admin.goto(`${admin.url()}?aba=pagamentos`);
  const painel = admin.locator("section").filter({ has: admin.getByRole("heading", { name: "Repasse dos presentes" }) });
  await expect(painel).toContainText("Há saldo a repassar");
  await expect(painel.getByText("Falta repassar", { exact: true }).locator("..")).toContainText("R$ 96,01");

  // Acima do que falta: o botão não deixa
  await painel.getByLabel("Valor repassado (R$)").fill("100,00");
  await expect(painel.getByText("O valor passa do que falta repassar.")).toBeVisible();
  await expect(painel.getByRole("button", { name: "Registrar repasse" })).toBeDisabled();

  await painel.getByLabel("Valor repassado (R$)").fill("50,00");
  await painel.getByLabel("Referência do comprovante (opcional)").fill("E2E-001");
  await painel.getByRole("button", { name: "Registrar repasse" }).click();
  await expect(painel.getByText(/E2E-001/)).toBeVisible();
  await expect(painel.getByText("Falta repassar", { exact: true }).locator("..")).toContainText("R$ 46,01");
  await contexto.close();

  // O casal vê o que já foi repassado e recebe o aviso
  await page.goto("/configuracoes/recebimento");
  await expect(page.getByText("Já repassado", { exact: true }).locator("..")).toContainText("R$ 50,00");
  await page.goto("/notificacoes");
  await expect(page.getByText("Repasse de R$ 50,00 enviado").first()).toBeVisible();
});
