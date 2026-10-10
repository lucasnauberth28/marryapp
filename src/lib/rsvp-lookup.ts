// Resultado da busca do convite pelo telefone (tela pública de confirmação de presença).
// Cada situação tem a sua mensagem: limite de tentativas não pode parecer "convite não encontrado".

import { TOO_MANY_ATTEMPTS_MESSAGE } from "./rate-limit-message.ts";

export { TOO_MANY_ATTEMPTS_MESSAGE };

export interface PublicRsvpGuest {
  id: string;
  name: string;
  allowedCompanions: number;
  rsvpStatus: "PENDING" | "CONFIRMED" | "DECLINED";
  dietaryRestrictions: string | null;
}

export type GuestLookup =
  | { status: "found"; guest: PublicRsvpGuest }
  | { status: "not_found" }
  | { status: "invalid_phone" }
  | { status: "rate_limited" };

/** Mensagem para a pessoa quando o convite não foi achado; null quando achou. */
export function lookupMessage(result: GuestLookup): string | null {
  switch (result.status) {
    case "found":
      return null;
    case "rate_limited":
      return TOO_MANY_ATTEMPTS_MESSAGE;
    case "invalid_phone":
      return "Confira o número: use o WhatsApp com DDD, por exemplo (11) 91234-5678.";
    case "not_found":
      return "Não achamos um convite com este número. Use o WhatsApp com DDD que os noivos têm de você. Se ainda não achar, fale com eles.";
  }
}
