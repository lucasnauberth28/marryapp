import { somenteDigitos } from "./formatacao/telefone.ts";
// Resultado dos envios pelo WhatsApp em linguagem simples, e quem realmente recebeu.
// Puro (sem banco nem Next): as telas só dizem "enviado" quando o envio foi confirmado.

export interface SendOutcome {
  phone: string;
  success: boolean;
  error?: string;
}

const digits = (value: string | null | undefined) => somenteDigitos(value);

/** Ids dos convidados cujo número recebeu a mensagem (envio confirmado). Quem falhou fica de fora. */
export function guestIdsReached(guests: Array<{ id: string; phone: string | null }>, results: SendOutcome[]): string[] {
  const reached = new Set(results.filter((r) => r.success).map((r) => digits(r.phone)));
  return guests.filter((g) => reached.has(digits(g.phone))).map((g) => g.id);
}

/** Motivo da falha para o casal, sem código de erro nem resposta técnica do serviço. */
export function sendFailureReason(results: SendOutcome[]): string {
  const errors = results.filter((r) => !r.success).map((r) => r.error ?? "");
  if (errors.some((e) => /n[aã]o configurad|servi[cç]o n[aã]o configurado/i.test(e))) {
    return "O envio pelo WhatsApp ainda não está disponível. Tentem de novo mais tarde.";
  }
  if (errors.length > 0 && errors.every((e) => /n[uú]mero .*n[aã]o possui conta/i.test(e))) {
    return errors.length === 1 ? "Esse número não tem WhatsApp." : "Esses números não têm WhatsApp.";
  }
  return "Não deu para enviar agora. Tentem de novo em instantes.";
}

const KIND = {
  mensagem: { one: "mensagem enviada", many: "mensagens enviadas", notOne: "não foi enviada", notMany: "não foram enviadas" },
  convite: { one: "convite enviado", many: "convites enviados", notOne: "não foi enviado", notMany: "não foram enviados" },
  lembrete: { one: "lembrete enviado", many: "lembretes enviados", notOne: "não foi enviado", notMany: "não foram enviados" },
} as const;

/** "3 convites enviados." ou "2 convites enviados. 1 não foi enviado: confiram se o número tem WhatsApp." */
export function sendSummary(sent: number, failed: number, kind: keyof typeof KIND): string {
  const k = KIND[kind];
  const done = `${sent} ${sent === 1 ? k.one : k.many}.`;
  if (failed === 0) return done;
  return `${done} ${failed} ${failed === 1 ? k.notOne : k.notMany}: confiram se os números têm WhatsApp.`;
}
