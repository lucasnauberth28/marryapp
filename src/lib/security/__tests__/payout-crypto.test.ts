import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  ErroDeCifraDoRepasse,
  decifrarSegredoDoRepasse,
  cifrarSegredoDoRepasse,
  cifraDoRepasseEstaConfigurada,
  precisaCifrarDeNovo,
  versaoDaChaveDoRepasseDe,
  cifrarDeNovoOSegredoDoRepasse,
} from "../payout-crypto.ts";

// Chaves geradas na hora do teste: nenhum valor fixo no repositório.
const keyB64 = () => randomBytes(32).toString("base64");
const keyHex = () => randomBytes(32).toString("hex");
const ctx = "wedding:w1:pix";

test("ida e volta com chave em base64 e em hexadecimal", () => {
  for (const key of [keyB64(), keyHex()]) {
    const env = { PAYOUT_ENCRYPTION_KEY: key };
    const secret = "123.456.789-09 ação";
    const payload = cifrarSegredoDoRepasse(secret, ctx, env);
    assert.ok(payload.startsWith("p1.1."));
    assert.equal(decifrarSegredoDoRepasse(payload, ctx, env), secret);
    assert.ok(!payload.includes("123"), "o texto aberto não pode aparecer no cifrado");
  }
});

test("IV diferente a cada vez: o mesmo texto nunca gera o mesmo cifrado", () => {
  const env = { PAYOUT_ENCRYPTION_KEY: keyB64() };
  const a = cifrarSegredoDoRepasse("mesma-chave-pix", ctx, env);
  const b = cifrarSegredoDoRepasse("mesma-chave-pix", ctx, env);
  assert.notEqual(a, b);
  assert.notEqual(a.split(".")[2], b.split(".")[2]);
});

test("adulteração é detectada (cifrado, etiqueta e IV)", () => {
  const env = { PAYOUT_ENCRYPTION_KEY: keyB64() };
  const parts = cifrarSegredoDoRepasse("segredo", ctx, env).split(".");
  for (const index of [2, 3, 4]) {
    const copy = [...parts];
    const raw = Buffer.from(copy[index], "base64url");
    raw[0] ^= 0x01;
    copy[index] = raw.toString("base64url");
    assert.throws(() => decifrarSegredoDoRepasse(copy.join("."), ctx, env), (e) => e instanceof ErroDeCifraDoRepasse && e.code === "decrypt_failed");
  }
});

test("contexto diferente (outro casamento ou outro campo) não abre", () => {
  const env = { PAYOUT_ENCRYPTION_KEY: keyB64() };
  const payload = cifrarSegredoDoRepasse("segredo", "wedding:w1:pix", env);
  assert.throws(() => decifrarSegredoDoRepasse(payload, "wedding:w2:pix", env), /decifrar/);
  assert.throws(() => decifrarSegredoDoRepasse(payload, "wedding:w1:document", env), /decifrar/);
});

test("chave errada falha", () => {
  const payload = cifrarSegredoDoRepasse("segredo", ctx, { PAYOUT_ENCRYPTION_KEY: keyB64() });
  assert.throws(() => decifrarSegredoDoRepasse(payload, ctx, { PAYOUT_ENCRYPTION_KEY: keyB64() }), (e) => e instanceof ErroDeCifraDoRepasse && e.code === "decrypt_failed");
});

test("formato inválido falha, sem vazar o conteúdo", () => {
  const env = { PAYOUT_ENCRYPTION_KEY: keyB64() };
  for (const bad of ["", "texto-aberto", "p1.1.a.b", "p2.1.a.b.c", "p1.x.a.b.c", "p1.1.AA.AA.AA", "p1.1..."]) {
    assert.throws(() => decifrarSegredoDoRepasse(bad, ctx, env), (e) => e instanceof ErroDeCifraDoRepasse && e.code === "invalid_payload" && !String(e.message).includes(bad || "\u0000"));
  }
  assert.equal(versaoDaChaveDoRepasseDe("lixo"), null);
});

test("falha fechado: sem chave, chave curta, longa demais ou fraca", () => {
  assert.throws(() => cifrarSegredoDoRepasse("x", ctx, {}), (e) => e instanceof ErroDeCifraDoRepasse && e.code === "not_configured");
  assert.throws(() => cifrarSegredoDoRepasse("x", ctx, { PAYOUT_ENCRYPTION_KEY: "   " }), /não está configurada/);
  assert.throws(() => cifrarSegredoDoRepasse("x", ctx, { PAYOUT_ENCRYPTION_KEY: randomBytes(16).toString("base64") }), (e) => e instanceof ErroDeCifraDoRepasse && e.code === "invalid_key");
  assert.throws(() => cifrarSegredoDoRepasse("x", ctx, { PAYOUT_ENCRYPTION_KEY: randomBytes(16).toString("hex") }), /32 bytes/);
  assert.throws(() => cifrarSegredoDoRepasse("x", ctx, { PAYOUT_ENCRYPTION_KEY: randomBytes(48).toString("base64") }), /32 bytes/);
  assert.throws(() => cifrarSegredoDoRepasse("x", ctx, { PAYOUT_ENCRYPTION_KEY: "0".repeat(64) }), /fraca/);
  assert.throws(() => cifrarSegredoDoRepasse("x", ctx, { PAYOUT_ENCRYPTION_KEY: "não é chave" }), /32 bytes/);
  assert.equal(cifraDoRepasseEstaConfigurada({}), false);
  assert.equal(cifraDoRepasseEstaConfigurada({ PAYOUT_ENCRYPTION_KEY: "curta" }), false);
  assert.equal(cifraDoRepasseEstaConfigurada({ PAYOUT_ENCRYPTION_KEY: keyB64() }), true);
  assert.throws(() => cifrarSegredoDoRepasse("", ctx, { PAYOUT_ENCRYPTION_KEY: keyB64() }), /Nada para cifrar/);
});

test("a mensagem de erro nunca traz a chave nem o texto aberto", () => {
  const key = keyB64();
  const payload = cifrarSegredoDoRepasse("segredo-muito-especial", ctx, { PAYOUT_ENCRYPTION_KEY: key });
  try {
    decifrarSegredoDoRepasse(payload, ctx, { PAYOUT_ENCRYPTION_KEY: keyB64() });
    assert.fail("deveria falhar");
  } catch (e) {
    const text = String((e as Error).message) + String((e as Error).stack);
    assert.ok(!text.includes(key) && !text.includes("segredo-muito-especial") && !text.includes(payload));
  }
});

test("rotação: versão no dado, chave anterior ainda abre e recifrar passa para a nova", () => {
  const oldKey = keyB64();
  const newKey = keyB64();
  const oldPayload = cifrarSegredoDoRepasse("conta-12345", ctx, { PAYOUT_ENCRYPTION_KEY: oldKey });
  assert.equal(versaoDaChaveDoRepasseDe(oldPayload), 1);

  const rotated = { PAYOUT_ENCRYPTION_KEY: newKey, PAYOUT_ENCRYPTION_KEY_VERSION: "2", PAYOUT_ENCRYPTION_KEY_PREVIOUS: oldKey };
  assert.equal(decifrarSegredoDoRepasse(oldPayload, ctx, rotated), "conta-12345");
  assert.equal(precisaCifrarDeNovo(oldPayload, rotated), true);

  const fresh = cifrarDeNovoOSegredoDoRepasse(oldPayload, ctx, rotated);
  assert.equal(versaoDaChaveDoRepasseDe(fresh), 2);
  assert.equal(precisaCifrarDeNovo(fresh, rotated), false);
  assert.equal(decifrarSegredoDoRepasse(fresh, ctx, { PAYOUT_ENCRYPTION_KEY: newKey, PAYOUT_ENCRYPTION_KEY_VERSION: "2" }), "conta-12345");

  // Sem a chave anterior, o dado antigo não abre (e o erro diz que a versão não está mais configurada)
  assert.throws(
    () => decifrarSegredoDoRepasse(oldPayload, ctx, { PAYOUT_ENCRYPTION_KEY: newKey, PAYOUT_ENCRYPTION_KEY_VERSION: "2" }),
    (e) => e instanceof ErroDeCifraDoRepasse && e.code === "unknown_key_version",
  );
  assert.throws(() => cifrarSegredoDoRepasse("x", ctx, { PAYOUT_ENCRYPTION_KEY: newKey, PAYOUT_ENCRYPTION_KEY_VERSION: "0" }), /VERSION/);
});
