// Regras puras dos dados de recebimento do casal (sem banco nem Next): validar o que a pessoa digitou,
// separar o que vai CIFRADO do que pode ficar à mostra (máscaras) e montar o texto da máscara.
// Nada aqui grava, loga ou devolve dado bancário inteiro além do que o chamador pediu para cifrar.
import { z } from "zod";
import { isValidCnpj, isValidCpf, normalizeDocument } from "./document-br.ts";

export const PIX_KEY_TYPES = ["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"] as const;
export type PixKeyType = (typeof PIX_KEY_TYPES)[number];

export const PIX_KEY_TYPE_LABEL: Record<PixKeyType, string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "E-mail",
  PHONE: "Celular",
  RANDOM: "Chave aleatória",
};

export const BANK_ACCOUNT_KINDS = ["CORRENTE", "POUPANCA", "PAGAMENTO"] as const;
export type BankAccountKind = (typeof BANK_ACCOUNT_KINDS)[number];

export const BANK_ACCOUNT_KIND_LABEL: Record<BankAccountKind, string> = {
  CORRENTE: "Conta corrente",
  POUPANCA: "Poupança",
  PAGAMENTO: "Conta de pagamento",
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

/** Chave Pix normalizada do jeito que o Banco Central espera (CPF/CNPJ só caracteres, celular +55, e-mail minúsculo). */
export function normalizePixKey(type: PixKeyType, raw: string): Result<string> {
  const text = String(raw ?? "").trim();
  switch (type) {
    case "CPF":
      return isValidCpf(text) ? { ok: true, value: normalizeDocument(text) } : fail("Esse CPF não parece certo. Confira os números.");
    case "CNPJ":
      return isValidCnpj(text) ? { ok: true, value: normalizeDocument(text) } : fail("Esse CNPJ não parece certo. Confira os números.");
    case "EMAIL": {
      const email = text.toLowerCase();
      const ok = email.length <= 77 && /^[a-z0-9._%+'-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(email);
      return ok ? { ok: true, value: email } : fail("Esse e-mail não parece certo. Confira antes de salvar.");
    }
    case "PHONE": {
      let digits = text.replace(/\D/g, "");
      if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
      const ok = /^[1-9][1-9]9\d{8}$/.test(digits);
      return ok ? { ok: true, value: `+55${digits}` } : fail("Informe o celular com DDD, por exemplo (11) 98765-4321.");
    }
    case "RANDOM": {
      const uuid = text.toLowerCase();
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid)
        ? { ok: true, value: uuid }
        : fail("A chave aleatória tem 36 caracteres, com hifens. Copie e cole do seu banco.");
    }
  }
}

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const HolderShape = {
  holderName: z.string().trim().min(3, "Informe o nome completo do titular.").max(120, "O nome do titular está longo demais."),
  holderDocument: z.string().trim().min(1, "Informe o CPF ou CNPJ do titular.").max(30, "Esse documento está longo demais."),
};

const PayoutInputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("PIX_KEY"),
    ...HolderShape,
    pixKeyType: z.enum(PIX_KEY_TYPES, { error: "Escolha o tipo da chave Pix." }),
    pixKey: z.string().trim().min(1, "Informe a chave Pix.").max(120, "Essa chave está longa demais."),
  }),
  z.object({
    type: z.literal("BANK_ACCOUNT"),
    ...HolderShape,
    bankCode: z.string().trim().regex(/^\d{3}$/, "O código do banco tem 3 números, como 260 ou 001."),
    agency: z.string().trim().regex(/^\d{1,5}$/, "A agência tem de 1 a 5 números, sem o dígito."),
    account: z.string().trim().regex(/^\d{1,12}$/, "A conta tem de 1 a 12 números, sem o dígito."),
    accountDigit: z.preprocess(emptyToUndefined, z.string().trim().regex(/^[0-9xX]{1,2}$/, "O dígito da conta tem 1 ou 2 caracteres.").optional()),
    accountKind: z.enum(BANK_ACCOUNT_KINDS, { error: "Escolha o tipo da conta." }),
  }),
]);
/** Dado já conferido: o que vai cifrado (`*Secret`) e o que pode ser gravado e mostrado (campos abertos). */
export interface ValidPayout {
  type: "PIX_KEY" | "BANK_ACCOUNT";
  holderName: string;
  holderDocumentKind: "CPF" | "CNPJ";
  documentSecret: string;
  documentLast4: string;
  keyHint: string;
  pixKeyType: PixKeyType | null;
  pixKeySecret: string | null;
  /** JSON do banco, agência, conta, dígito e tipo: só serve para ser cifrado. */
  bankSecret: string | null;
}

/** "PIX_KEY" + chave CPF/CNPJ: a chave tem de ser do próprio titular (mesmo documento). */
export function validatePayoutInput(raw: unknown): Result<ValidPayout> {
  const parsed = PayoutInputSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Confira os dados.");
  const input = parsed.data;

  const document = normalizeDocument(input.holderDocument);
  const holderDocumentKind = isValidCpf(document) ? "CPF" : isValidCnpj(document) ? "CNPJ" : null;
  if (!holderDocumentKind) return fail("O CPF ou CNPJ do titular não parece certo. Confira os números.");

  if (!/\p{L}{2,}/u.test(input.holderName)) return fail("Informe o nome completo do titular.");

  const base = {
    holderName: input.holderName.replace(/\s+/g, " "),
    holderDocumentKind,
    documentSecret: document,
    documentLast4: document.slice(-4),
  } as const;

  if (input.type === "PIX_KEY") {
    const key = normalizePixKey(input.pixKeyType, input.pixKey);
    if (!key.ok) return key;
    if ((input.pixKeyType === "CPF" || input.pixKeyType === "CNPJ") && key.value !== document) {
      return fail("A chave Pix de CPF ou CNPJ precisa ser a do próprio titular. Use o mesmo documento ou escolha outro tipo de chave.");
    }
    return {
      ok: true,
      value: {
        ...base,
        type: "PIX_KEY",
        keyHint: pixKeyHint(input.pixKeyType, key.value),
        pixKeyType: input.pixKeyType,
        pixKeySecret: key.value,
        bankSecret: null,
      },
    };
  }

  const accountDigit = (input.accountDigit ?? "").toUpperCase();
  const bank = {
    bankCode: input.bankCode,
    agency: input.agency,
    account: input.account,
    accountDigit,
    accountKind: input.accountKind,
  };
  return {
    ok: true,
    value: {
      ...base,
      type: "BANK_ACCOUNT",
      keyHint: bankHint(bank.bankCode, bank.agency, bank.account + accountDigit),
      pixKeyType: null,
      pixKeySecret: null,
      bankSecret: JSON.stringify(bank),
    },
  };
}

/** Máscara da chave Pix, sem decifrar: "Pix CPF final 12", "Pix e-mail l***@gmail.com". */
export function pixKeyHint(type: PixKeyType, normalizedKey: string): string {
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
export function bankHint(bankCode: string, agency: string, accountWithDigit: string): string {
  return `Banco ${bankCode}, ag ${agency}, conta •••• ${accountWithDigit.slice(-2)}`;
}

/** Documento do titular escondido para a tela: "CPF final 0925". */
export function documentHint(kind: "CPF" | "CNPJ", last4: string): string {
  return `${kind} final ${last4}`;
}

/** Contexto autenticado da cifra: amarra o dado ao casamento e ao campo (ver security/payout-crypto). */
export type PayoutField = "document" | "pix" | "bank";
export function payoutCipherContext(weddingId: string, field: PayoutField): string {
  return `payout:${weddingId}:${field}`;
}
