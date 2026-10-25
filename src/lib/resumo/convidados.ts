// Resumo do casamento: convites e pessoas, convites enviados e prazo de confirmação.
import { ehSoPresentePendente } from "../convidados/guest-origin.ts";
import { diasEntreChaves } from "./datas.ts";

export interface LinhaDeConvidado {
  id: string;
  name: string;
  phone: string | null;
  rsvpStatus: "PENDING" | "CONFIRMED" | "DECLINED";
  category: string | null;
  allowedCompanions: number;
  confirmedCompanions: number;
  hasReceivedMessage: boolean;
  inviteSharedAt: Date | null;
}

/** O convite chegou a esta pessoa: enviado pelo painel, enviado pelo WhatsApp do casal ou já respondido. */
export function conviteChegou(g: Pick<LinhaDeConvidado, "hasReceivedMessage" | "inviteSharedAt" | "rsvpStatus">): boolean {
  return g.hasReceivedMessage || g.inviteSharedAt !== null || g.rsvpStatus !== "PENDING";
}

export interface ContagemDeConvidados {
  /** Um convite por convidado (quem só presenteou e não respondeu não é convite). */
  invites: { total: number; confirmed: number; declined: number; pending: number };
  /** Pessoas: o convidado e os acompanhantes (confirmados, ou os permitidos para quem não vai ou não respondeu). */
  people: { total: number; confirmed: number; declined: number; pending: number };
  /** Convites que já chegaram (ver inviteReached). */
  sent: number;
  /** Convites pendentes com telefone cadastrado que ainda não chegaram. */
  unsentWithPhone: number;
}

export function contarConvidados(all: readonly LinhaDeConvidado[]): ContagemDeConvidados {
  const guests = all.filter((g) => !ehSoPresentePendente(g));
  const people = { total: 0, confirmed: 0, declined: 0, pending: 0 };
  const invites = { total: guests.length, confirmed: 0, declined: 0, pending: 0 };
  let sent = 0;
  let unsentWithPhone = 0;
  for (const g of guests) {
    if (g.rsvpStatus === "CONFIRMED") {
      invites.confirmed += 1;
      people.confirmed += 1 + g.confirmedCompanions;
    } else if (g.rsvpStatus === "DECLINED") {
      invites.declined += 1;
      people.declined += 1 + g.allowedCompanions;
    } else {
      invites.pending += 1;
      people.pending += 1 + g.allowedCompanions;
    }
    if (conviteChegou(g)) sent += 1;
    else if (g.phone) unsentWithPhone += 1;
  }
  people.total = people.confirmed + people.declined + people.pending;
  return { invites, people, sent, unsentWithPhone };
}

const porNome = (a: LinhaDeConvidado, b: LinhaDeConvidado) => a.name.localeCompare(b.name, "pt-BR");

/** Quem ainda não recebeu o convite, para "Enviar por convidado": com telefone primeiro, depois por nome. */
export function convidadosParaConvidar(all: readonly LinhaDeConvidado[]): LinhaDeConvidado[] {
  return all
    .filter((g) => !ehSoPresentePendente(g) && !conviteChegou(g))
    .sort((a, b) => Number(Boolean(b.phone)) - Number(Boolean(a.phone)) || porNome(a, b));
}

/** Quem não respondeu, para "Lembrar quem não respondeu": quem já recebeu o convite primeiro, com telefone, depois por nome. */
export function convidadosParaLembrar(all: readonly LinhaDeConvidado[]): LinhaDeConvidado[] {
  return all
    .filter((g) => !ehSoPresentePendente(g) && g.rsvpStatus === "PENDING")
    .sort(
      (a, b) =>
        Number(conviteChegou(b)) - Number(conviteChegou(a)) || Number(Boolean(b.phone)) - Number(Boolean(a.phone)) || porNome(a, b),
    );
}

/** Lugares do convite: o convidado e os acompanhantes que pode levar. */
export function lugaresDe(g: Pick<LinhaDeConvidado, "allowedCompanions">): number {
  return 1 + g.allowedCompanions;
}

// ---------- Prazo de confirmação ----------

export type SituacaoDoPrazo = "none" | "far" | "soon" | "today" | "passed";

/** Dias para o prazo em que ele passa a "chegando" (a mesma régua da sugestão da Liz). */
const DIAS_PARA_PRAZO_PROXIMO = 7;

export function informacoesDoPrazo(todayKey: string, deadlineKey: string | null): { state: SituacaoDoPrazo; days: number } {
  if (!deadlineKey) return { state: "none", days: 0 };
  const days = diasEntreChaves(todayKey, deadlineKey);
  if (days < 0) return { state: "passed", days };
  if (days === 0) return { state: "today", days };
  return { state: days <= DIAS_PARA_PRAZO_PROXIMO ? "soon" : "far", days };
}
