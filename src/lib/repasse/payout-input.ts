// Regras puras dos dados de recebimento do casal (sem banco nem Next): validar o que a pessoa digitou,
// separar o que vai CIFRADO do que pode ficar à mostra (máscaras) e montar o texto da máscara.
// Nada aqui grava, loga ou devolve dado bancário inteiro além do que o chamador pediu para cifrar.
import { z } from "zod";
import { ehCnpjValido, ehCpfValido, normalizarDocumento } from "../document-br.ts";

import { somenteDigitos } from "../formatacao/telefone.ts";
export const TIPOS_DE_CHAVE_PIX = ["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"] as const;
export type TipoDeChavePix = (typeof TIPOS_DE_CHAVE_PIX)[number];

export const ROTULO_DO_TIPO_DE_CHAVE_PIX: Record<TipoDeChavePix, string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "E-mail",
  PHONE: "Celular",
  RANDOM: "Chave aleatória",
};

export const TIPOS_DE_CONTA_BANCARIA = ["CORRENTE", "POUPANCA", "PAGAMENTO"] as const;
export type TipoDeContaBancaria = (typeof TIPOS_DE_CONTA_BANCARIA)[number];

export const ROTULO_DO_TIPO_DE_CONTA_BANCARIA: Record<TipoDeContaBancaria, string> = {
  CORRENTE: "Conta corrente",
  POUPANCA: "Poupança",
  PAGAMENTO: "Conta de pagamento",
};

type ResultadoDaValidacao<T> = { ok: true; value: T } | { ok: false; error: string };
const falhar = (error: string): { ok: false; error: string } => ({ ok: false, error });

/** Chave Pix normalizada do jeito que o Banco Central espera (CPF/CNPJ só caracteres, celular +55, e-mail minúsculo). */
export function normalizarChavePix(type: TipoDeChavePix, raw: string): ResultadoDaValidacao<string> {
  const text = String(raw ?? "").trim();
  switch (type) {
    case "CPF":
      return ehCpfValido(text) ? { ok: true, value: normalizarDocumento(text) } : falhar("Esse CPF não parece certo. Confira os números.");
    case "CNPJ":
      return ehCnpjValido(text) ? { ok: true, value: normalizarDocumento(text) } : falhar("Esse CNPJ não parece certo. Confira os números.");
    case "EMAIL": {
      const email = text.toLowerCase();
      const ok = email.length <= 77 && /^[a-z0-9._%+'-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(email);
      return ok ? { ok: true, value: email } : falhar("Esse e-mail não parece certo. Confira antes de salvar.");
    }
    case "PHONE": {
      let digits = somenteDigitos(text);
      if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
      const ok = /^[1-9][1-9]9\d{8}$/.test(digits);
      return ok ? { ok: true, value: `+55${digits}` } : falhar("Informe o celular com DDD, por exemplo (11) 98765-4321.");
    }
    case "RANDOM": {
      const uuid = text.toLowerCase();
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid)
        ? { ok: true, value: uuid }
        : falhar("A chave aleatória tem 36 caracteres, com hifens. Copie e cole do seu banco.");
    }
  }
}

const vazioParaIndefinido = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const FormatoDoTitular = {
  holderName: z.string().trim().min(3, "Informe o nome completo do titular.").max(120, "O nome do titular está longo demais."),
  holderDocument: z.string().trim().min(1, "Informe o CPF ou CNPJ do titular.").max(30, "Esse documento está longo demais."),
};

const EsquemaDaEntradaDeRepasse = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("PIX_KEY"),
    ...FormatoDoTitular,
    pixKeyType: z.enum(TIPOS_DE_CHAVE_PIX, { error: "Escolha o tipo da chave Pix." }),
    pixKey: z.string().trim().min(1, "Informe a chave Pix.").max(120, "Essa chave está longa demais."),
  }),
  z.object({
    type: z.literal("BANK_ACCOUNT"),
    ...FormatoDoTitular,
    bankCode: z.string().trim().regex(/^\d{3}$/, "O código do banco tem 3 números, como 260 ou 001."),
    agency: z.string().trim().regex(/^\d{1,5}$/, "A agência tem de 1 a 5 números, sem o dígito."),
    account: z.string().trim().regex(/^\d{1,12}$/, "A conta tem de 1 a 12 números, sem o dígito."),
    accountDigit: z.preprocess(vazioParaIndefinido, z.string().trim().regex(/^[0-9xX]{1,2}$/, "O dígito da conta tem 1 ou 2 caracteres.").optional()),
    accountKind: z.enum(TIPOS_DE_CONTA_BANCARIA, { error: "Escolha o tipo da conta." }),
  }),
]);
/** Dado já conferido: o que vai cifrado (`*Secret`) e o que pode ser gravado e mostrado (campos abertos). */
export interface RepasseValido {
  type: "PIX_KEY" | "BANK_ACCOUNT";
  holderName: string;
  holderDocumentKind: "CPF" | "CNPJ";
  documentSecret: string;
  documentLast4: string;
  keyHint: string;
  pixKeyType: TipoDeChavePix | null;
  pixKeySecret: string | null;
  /** JSON do banco, agência, conta, dígito e tipo: só serve para ser cifrado. */
  bankSecret: string | null;
}

type BaseDoRepasse = Pick<RepasseValido, "holderName" | "holderDocumentKind" | "documentSecret" | "documentLast4">;
type EntradaDoRepasse = z.infer<typeof EsquemaDaEntradaDeRepasse>;

function repasseDaChavePix(input: Extract<EntradaDoRepasse, { type: "PIX_KEY" }>, base: BaseDoRepasse, document: string): ResultadoDaValidacao<RepasseValido> {
  const key = normalizarChavePix(input.pixKeyType, input.pixKey);
  if (!key.ok) return key;
  if ((input.pixKeyType === "CPF" || input.pixKeyType === "CNPJ") && key.value !== document) {
    return falhar("A chave Pix de CPF ou CNPJ precisa ser a do próprio titular. Use o mesmo documento ou escolha outro tipo de chave.");
  }
  return {
    ok: true,
    value: { ...base, type: "PIX_KEY", keyHint: dicaDaChavePix(input.pixKeyType, key.value), pixKeyType: input.pixKeyType, pixKeySecret: key.value, bankSecret: null },
  };
}

function repasseDaContaBancaria(input: Extract<EntradaDoRepasse, { type: "BANK_ACCOUNT" }>, base: BaseDoRepasse): ResultadoDaValidacao<RepasseValido> {
  const accountDigit = (input.accountDigit ?? "").toUpperCase();
  const bank = { bankCode: input.bankCode, agency: input.agency, account: input.account, accountDigit, accountKind: input.accountKind };
  return {
    ok: true,
    value: {
      ...base,
      type: "BANK_ACCOUNT",
      keyHint: dicaDoBanco(bank.bankCode, bank.agency, bank.account + accountDigit),
      pixKeyType: null,
      pixKeySecret: null,
      bankSecret: JSON.stringify(bank),
    },
  };
}

/** "PIX_KEY" + chave CPF/CNPJ: a chave tem de ser do próprio titular (mesmo documento). */
export function validarEntradaDeRepasse(raw: unknown): ResultadoDaValidacao<RepasseValido> {
  const parsed = EsquemaDaEntradaDeRepasse.safeParse(raw);
  if (!parsed.success) return falhar(parsed.error.issues[0]?.message ?? "Confira os dados.");
  const input = parsed.data;

  const document = normalizarDocumento(input.holderDocument);
  const holderDocumentKind = ehCpfValido(document) ? "CPF" : ehCnpjValido(document) ? "CNPJ" : null;
  if (!holderDocumentKind) return falhar("O CPF ou CNPJ do titular não parece certo. Confira os números.");

  if (!/\p{L}{2,}/u.test(input.holderName)) return falhar("Informe o nome completo do titular.");

  const base = { holderName: input.holderName.replace(/\s+/g, " "), holderDocumentKind, documentSecret: document, documentLast4: document.slice(-4) } as const;
  return input.type === "PIX_KEY" ? repasseDaChavePix(input, base, document) : repasseDaContaBancaria(input, base);
}

/** Máscara da chave Pix, sem decifrar: "Pix CPF final 12", "Pix e-mail l***@gmail.com". */
export function dicaDaChavePix(type: TipoDeChavePix, normalizedKey: string): string {
  switch (type) {
    case "CPF":
    case "CNPJ":
    case "PHONE":
      return `Pix ${type === "PHONE" ? "celular" : type} final ${normalizedKey.slice(-2)}`;
    case "EMAIL": {
      const [user, domain] = normalizedKey.split("@");
      return `Pix e-mail ${user[0]}***@${domain}`;
    }
    case "RANDOM":
      return `Pix chave aleatória final ${normalizedKey.slice(-4)}`;
  }
}

/** Máscara da conta: "Banco 260, ag 0001, conta •••• 45" (só os 2 últimos caracteres da conta). */
export function dicaDoBanco(bankCode: string, agency: string, accountWithDigit: string): string {
  return `Banco ${bankCode}, ag ${agency}, conta •••• ${accountWithDigit.slice(-2)}`;
}

/** Documento do titular escondido para a tela: "CPF final 0925". */
export function dicaDoDocumento(kind: "CPF" | "CNPJ", last4: string): string {
  return `${kind} final ${last4}`;
}

/** Contexto autenticado da cifra: amarra o dado ao casamento e ao campo (ver security/payout-crypto). */
export type CampoDoRepasse = "document" | "pix" | "bank";
export function contextoDaCifraDoRepasse(weddingId: string, field: CampoDoRepasse): string {
  return `payout:${weddingId}:${field}`;
}
