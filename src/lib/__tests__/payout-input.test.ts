import { test } from "node:test";
import assert from "node:assert/strict";
import { bankHint, normalizePixKey, payoutCipherContext, pixKeyHint, validatePayoutInput } from "../payout-input.ts";

const CPF = "529.982.247-25";
const CNPJ = "11.222.333/0001-81";

test("chaves Pix: CPF, CNPJ, e-mail, celular e aleatória, normalizadas", () => {
  assert.deepEqual(normalizePixKey("CPF", CPF), { ok: true, value: "52998224725" });
  assert.deepEqual(normalizePixKey("CNPJ", CNPJ), { ok: true, value: "11222333000181" });
  assert.deepEqual(normalizePixKey("EMAIL", "  Ana.Silva@Gmail.com "), { ok: true, value: "ana.silva@gmail.com" });
  assert.deepEqual(normalizePixKey("PHONE", "(11) 98765-4321"), { ok: true, value: "+5511987654321" });
  assert.deepEqual(normalizePixKey("PHONE", "+55 11 98765-4321"), { ok: true, value: "+5511987654321" });
  assert.deepEqual(normalizePixKey("RANDOM", "123E4567-E89B-42D3-A456-426614174000"), { ok: true, value: "123e4567-e89b-42d3-a456-426614174000" });
});

test("chaves Pix inválidas são recusadas com mensagem em português", () => {
  for (const [type, value] of [
    ["CPF", "111.111.111-11"],
    ["CPF", "529.982.247-26"],
    ["CNPJ", "11.222.333/0001-82"],
    ["EMAIL", "sem-arroba"],
    ["EMAIL", "a@b"],
    ["PHONE", "(11) 3456-7890"],
    ["PHONE", "123"],
    ["RANDOM", "não-é-uuid"],
  ] as const) {
    const r = normalizePixKey(type, value);
    assert.equal(r.ok, false, `${type} ${value}`);
  }
});

test("Pix: máscara não revela a chave inteira e o documento só sai cifrado", () => {
  const r = validatePayoutInput({ type: "PIX_KEY", holderName: "Ana  Silva", holderDocument: CPF, pixKeyType: "CPF", pixKey: "52998224725" });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.value.keyHint, "Pix CPF final 25");
  assert.equal(r.value.documentLast4, "4725");
  assert.equal(r.value.holderName, "Ana Silva");
  assert.equal(r.value.holderDocumentKind, "CPF");
  assert.equal(r.value.pixKeySecret, "52998224725");
  assert.equal(r.value.bankSecret, null);
  assert.ok(!r.value.keyHint.includes("529982"));
});

test("a chave de CPF ou CNPJ precisa ser a do titular", () => {
  const r = validatePayoutInput({ type: "PIX_KEY", holderName: "Ana Silva", holderDocument: CPF, pixKeyType: "CPF", pixKey: "390.533.447-05" });
  assert.equal(r.ok, false);
  const ok = validatePayoutInput({ type: "PIX_KEY", holderName: "Ana Silva", holderDocument: CPF, pixKeyType: "EMAIL", pixKey: "ana@exemplo.com" });
  assert.ok(ok.ok);
  if (ok.ok) assert.equal(ok.value.keyHint, "Pix e-mail a***@exemplo.com");
  const pj = validatePayoutInput({ type: "PIX_KEY", holderName: "Casa Ana Ltda", holderDocument: CNPJ, pixKeyType: "CNPJ", pixKey: CNPJ });
  assert.ok(pj.ok);
  if (pj.ok) assert.equal(pj.value.holderDocumentKind, "CNPJ");
});

test("titular: nome e documento válidos são obrigatórios", () => {
  assert.equal(validatePayoutInput({ type: "PIX_KEY", holderName: "A", holderDocument: CPF, pixKeyType: "EMAIL", pixKey: "a@b.com" }).ok, false);
  assert.equal(validatePayoutInput({ type: "PIX_KEY", holderName: "Ana Silva", holderDocument: "123", pixKeyType: "EMAIL", pixKey: "a@b.com" }).ok, false);
  assert.equal(validatePayoutInput({ type: "PIX_KEY", holderName: "12345", holderDocument: CPF, pixKeyType: "EMAIL", pixKey: "a@b.com" }).ok, false);
  assert.equal(validatePayoutInput({ type: "OUTRO" }).ok, false);
  assert.equal(validatePayoutInput(null).ok, false);
});

test("conta bancária: máscara mostra banco, agência e só o fim da conta", () => {
  const r = validatePayoutInput({
    type: "BANK_ACCOUNT",
    holderName: "Ana Silva",
    holderDocument: CPF,
    bankCode: "260",
    agency: "0001",
    account: "1234545",
    accountDigit: "",
    accountKind: "PAGAMENTO",
  });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.value.keyHint, "Banco 260, ag 0001, conta •••• 45");
  assert.equal(r.value.pixKeySecret, null);
  assert.deepEqual(JSON.parse(r.value.bankSecret!), { bankCode: "260", agency: "0001", account: "1234545", accountDigit: "", accountKind: "PAGAMENTO" });
  assert.ok(!r.value.keyHint.includes("12345"));
});

test("conta bancária inválida é recusada", () => {
  const base = { type: "BANK_ACCOUNT", holderName: "Ana Silva", holderDocument: CPF, bankCode: "260", agency: "0001", account: "12345", accountKind: "CORRENTE" };
  assert.equal(validatePayoutInput(base).ok, true);
  assert.equal(validatePayoutInput({ ...base, bankCode: "26" }).ok, false);
  assert.equal(validatePayoutInput({ ...base, agency: "00a1" }).ok, false);
  assert.equal(validatePayoutInput({ ...base, account: "" }).ok, false);
  assert.equal(validatePayoutInput({ ...base, accountKind: "OUTRA" }).ok, false);
  assert.equal(validatePayoutInput({ ...base, accountDigit: "x" }).ok, true);
});

test("máscaras e contexto da cifra", () => {
  assert.equal(pixKeyHint("PHONE", "+5511987654321"), "Pix celular final 21");
  assert.equal(pixKeyHint("RANDOM", "123e4567-e89b-42d3-a456-426614174000"), "Pix chave aleatória final 4000");
  assert.equal(bankHint("001", "1", "9"), "Banco 001, ag 1, conta •••• 9");
  assert.notEqual(payoutCipherContext("w1", "pix"), payoutCipherContext("w2", "pix"));
  assert.notEqual(payoutCipherContext("w1", "pix"), payoutCipherContext("w1", "bank"));
});
