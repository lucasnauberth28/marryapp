// Situação de um casal para a administração (Casais, Casal e Visão geral). Puro: sem banco nem Next.
//
// "Com problema" é DERIVADO, nunca guardado. Regra (SCHEMA.md seção 6), qualquer uma das três:
//   1. casamento suspenso;
//   2. pagamento de plano do casal REJEITADO ou com FALHA nos últimos 7 dias;
//   3. casamento em até 14 dias com o onboarding incompleto.
// Mudou a regra? Mude só aqui (e o `where` equivalente em casais-filters.ts, que o teste confere).

const DAY_MS = 86_400_000;

export const PAYMENT_PROBLEM_DAYS = 7;
export const WEDDING_SOON_DAYS = 14;
export const INACTIVE_DAYS = 14;
/** Cadastro sem onboarding concluído há mais que isto aparece como "Onboarding parado". */
const ONBOARDING_STALLED_DAYS = 2;

export interface CasalFacts {
  suspendedAt: Date | null;
  /** Data do pagamento de plano do casal mais recente com status REJECTED ou FAILED (ou null). */
  failedPaymentAt: Date | null;
  weddingDate: Date | null;
  onboardedAt: Date | null;
  createdAt: Date;
  lastActiveAt: Date | null;
}

type ProblemCode = "suspended" | "payment_failed" | "onboarding_close";
export interface CasalProblem {
  code: ProblemCode;
  title: string;
}

/** Dias do calendário até a data (0 = hoje). Usa dia UTC-3 (Brasília). */
function daysFromNow(date: Date, now: Date): number {
  const SP = 3 * 60 * 60 * 1000;
  return Math.floor((date.getTime() - SP) / DAY_MS) - Math.floor((now.getTime() - SP) / DAY_MS);
}

export function casalProblems(f: CasalFacts, now: Date = new Date()): CasalProblem[] {
  const out: CasalProblem[] = [];
  if (f.suspendedAt) out.push({ code: "suspended", title: "Casamento suspenso" });
  if (f.failedPaymentAt && now.getTime() - f.failedPaymentAt.getTime() <= PAYMENT_PROBLEM_DAYS * DAY_MS) {
    out.push({ code: "payment_failed", title: "Pagamento do plano não passou" });
  }
  if (!f.onboardedAt && f.weddingDate) {
    const days = daysFromNow(f.weddingDate, now);
    if (days >= 0 && days <= WEDDING_SOON_DAYS) out.push({ code: "onboarding_close", title: "Casamento chegando e o cadastro não foi concluído" });
  }
  return out;
}

/** Última vez que o casal apareceu: a visita ao painel ou, sem registro, o cadastro. */
export function lastSeenAt(f: Pick<CasalFacts, "lastActiveAt" | "createdAt">): Date {
  return f.lastActiveAt ?? f.createdAt;
}

export type CasalSituation = "suspended" | "problem" | "onboarding" | "inactive" | "active";

/** Situação mostrada na lista (uma só, a mais importante primeiro). */
export function casalSituation(f: CasalFacts, now: Date = new Date()): CasalSituation {
  if (f.suspendedAt) return "suspended";
  if (casalProblems(f, now).length > 0) return "problem";
  if (!f.onboardedAt && now.getTime() - f.createdAt.getTime() > ONBOARDING_STALLED_DAYS * DAY_MS) return "onboarding";
  if (now.getTime() - lastSeenAt(f).getTime() > INACTIVE_DAYS * DAY_MS) return "inactive";
  return "active";
}

export const SITUATION_LABEL: Record<CasalSituation, string> = {
  suspended: "Suspenso",
  problem: "Com problema",
  onboarding: "Onboarding parado",
  inactive: "Sem atividade",
  active: "Ativo",
};
