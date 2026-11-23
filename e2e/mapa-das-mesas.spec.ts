import { criarCasalPronto, expect, noBanco, test } from "./helpers";

// Mapa do salão: as mesas vistas de cima, em qualquer plano, e o link "Ache a sua mesa" que o convidado abre sem login.

test("o casal vê o salão de cima, cria o link e o convidado acha a própria mesa pelo nome", async ({ page, browser }) => {
  const { email } = await criarCasalPronto(page, "mapa-mesas");
  await noBanco(async (db) => {
    const { rows } = await db.query('SELECT "weddingId" FROM users WHERE username = $1', [email]);
    const weddingId = rows[0].weddingId as string;
    const mesa = await db.query(`INSERT INTO tables (id, "weddingId", name, capacity) VALUES (gen_random_uuid(), $1, 'Padrinhos', 6) RETURNING id`, [weddingId]);
    await db.query(
      `INSERT INTO guests (id, "weddingId", name, "rsvpStatus", "allowedCompanions", "tableId", "updatedAt") VALUES (gen_random_uuid(), $1, 'Marina Álvares', 'CONFIRMED', 1, $2, now())`,
      [weddingId, mesa.rows[0].id],
    );
  });

  await page.goto("/mesas");
  await page.getByRole("button", { name: "Agora não" }).click({ timeout: 5000 }).catch(() => {});
  await expect(page.getByRole("link", { name: /3D/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Mapa do salão/ }).click();
  await expect(page.getByRole("img", { name: "Mesa Padrinhos: 2 de 6 lugares" })).toBeVisible();

  await page.getByRole("button", { name: "Compartilhar" }).click();
  await page.getByRole("button", { name: "Criar link" }).click();
  const url = await page.getByLabel("Link de visualização").inputValue();
  expect(url).toMatch(/\/mapa-das-mesas\//);

  // O convidado abre o link sem conta: a lista não aparece até digitar, e a busca ignora acento
  const convidado = await browser.newContext();
  const publica = await convidado.newPage();
  await publica.goto(url);
  await expect(publica.getByRole("heading", { name: "Ache a sua mesa" })).toBeVisible();
  await expect(publica.getByText("Marina Álvares")).toHaveCount(0);
  await publica.getByLabel("Digite o seu nome").fill("marina alvares");
  await expect(publica.getByRole("status")).toContainText("Mesa Padrinhos");
  await convidado.close();

  // Link desligado: a página some
  await page.getByRole("button", { name: "Desligar" }).click();
  const fora = await browser.newContext();
  const resposta = await (await fora.newPage()).goto(url);
  expect(resposta?.status()).toBe(404);
  await fora.close();
});
