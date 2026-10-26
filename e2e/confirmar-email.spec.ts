import { createHash, randomBytes } from "node:crypto";
import { cadastrarCasal, emailUnico, expect, noBanco, test } from "./helpers";

// Confirmação de e-mail: o cadastro por senha nasce "não confirmado" e o link do e-mail (uso único) confirma.

test("o cadastro por senha pede a confirmação, o link confirma uma vez só", async ({ page }) => {
  const email = emailUnico("confirmar");
  await cadastrarCasal(page, email);

  // Não confirmado: aviso no Resumo (depois do primeiro acesso) e a seção em Minha conta
  await page.goto("/conta");
  await expect(page.getByText(/Falta confirmar que/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar o link de confirmação" })).toBeVisible();

  // O link que chegaria no e-mail (só o hash fica no banco)
  const token = randomBytes(32).toString("base64url");
  await noBanco((db) =>
    db.query(
      `INSERT INTO email_verification_tokens (id, "userId", "tokenHash", "expiresAt") SELECT gen_random_uuid(), id, $2, now() + interval '1 day' FROM users WHERE username = $1`,
      [email, createHash("sha256").update(token).digest("hex")],
    ),
  );
  await page.goto(`/confirmar-email/${token}`);
  await expect(page.getByRole("heading", { name: "E-mail confirmado" })).toBeVisible();

  await page.goto("/conta");
  await expect(page.getByText(/está confirmado/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar o link de confirmação" })).toHaveCount(0);

  // Usado: abrir de novo não vale mais; link inventado também não
  await page.goto(`/confirmar-email/${token}`);
  await expect(page.getByRole("heading", { name: "Este link não vale mais" })).toBeVisible();
  await page.goto(`/confirmar-email/${randomBytes(32).toString("base64url")}`);
  await expect(page.getByRole("heading", { name: "Este link não vale mais" })).toBeVisible();
});
