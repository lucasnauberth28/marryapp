// Situação de um casal para a administração (Casais, Casal e Visão geral). Puro: sem banco nem Next.
//
// "Com problema" é DERIVADO, nunca guardado. Regra (SCHEMA.md seção 6), qualquer uma das três:
//   1. casamento suspenso;
//   2. pagamento de plano do casal REJEITADO ou com FALHA nos últimos 7 dias;
//   3. casamento em até 14 dias com o onboarding incompleto.
// Mudou a regra? Mude só aqui (e o `where` equivalente em casais-filters.ts, que o teste confere).

const UM_DIA_EM_MS = 86_400_000;

export const DIAS_DE_PROBLEMA_NO_PAGAMENTO = 7;
export const DIAS_PARA_CASAMENTO_PROXIMO = 14;
export const DIAS_DE_INATIVIDADE = 14;
/** Cadastro sem onboarding concluído há mais que isto aparece como "Onboarding parado". */
const DIAS_DE_INICIO_PARADO = 2;

export interface FatosDoCasal {
  suspendedAt: Date | null;
  /** Data do pagamento de plano do casal mais recente com status REJECTED ou FAILED (ou null). */
  failedPaymentAt: Date | null;
  weddingDate: Date | null;
  onboardedAt: Date | null;
  createdAt: Date;
  lastActiveAt: Date | null;
}

type CodigoDoProblema = "suspended" | "payment_failed" | "onboarding_close";
export interface ProblemaDoCasal {
  code: CodigoDoProblema;
  title: string;
}

/** Dias do calendário até a data (0 = hoje). Usa dia UTC-3 (Brasília). */
function diasAPartirDeAgora(date: Date, now: Date): number {
  const SP = 3 * 60 * 60 * 1000;
  return Math.floor((date.getTime() - SP) / UM_DIA_EM_MS) - Math.floor((now.getTime() - SP) / UM_DIA_EM_MS);
}

export function casalProblems(f: FatosDoCasal, now: Date = new Date()): ProblemaDoCasal[] {
  const out: ProblemaDoCasal[] = [];
  if (f.suspendedAt) out.push({ code: "suspended", title: "Casamento suspenso" });
  if (f.failedPaymentAt && now.getTime() - f.failedPaymentAt.getTime() <= DIAS_DE_PROBLEMA_NO_PAGAMENTO * UM_DIA_EM_MS) {
    out.push({ code: "payment_failed", title: "Pagamento do plano não passou" });
  }
  if (!f.onboardedAt && f.weddingDate) {
    const days = diasAPartirDeAgora(f.weddingDate, now);
    if (days >= 0 && days <= DIAS_PARA_CASAMENTO_PROXIMO) out.push({ code: "onboarding_close", title: "Casamento chegando e o cadastro não foi concluído" });
  }
  return out;
}

/** Última vez que o casal apareceu: a visita ao painel ou, sem registro, o cadastro. */
export function vistoPorUltimoEm(f: Pick<FatosDoCasal, "lastActiveAt" | "createdAt">): Date {
  return f.lastActiveAt ?? f.createdAt;
}

export type SituacaoDoCasal = "suspended" | "problem" | "onboarding" | "inactive" | "active";

/** Situação mostrada na lista (uma só, a mais importante primeiro). */
export function situacaoDoCasal(f: FatosDoCasal, now: Date = new Date()): SituacaoDoCasal {
  if (f.suspendedAt) return "suspended";
  if (casalProblems(f, now).length > 0) return "problem";
  if (!f.onboardedAt && now.getTime() - f.createdAt.getTime() > DIAS_DE_INICIO_PARADO * UM_DIA_EM_MS) return "onboarding";
  if (now.getTime() - vistoPorUltimoEm(f).getTime() > DIAS_DE_INATIVIDADE * UM_DIA_EM_MS) return "inactive";
  return "active";
}

export const ROTULO_DA_SITUACAO: Record<SituacaoDoCasal, string> = {
  suspended: "Suspenso",
  problem: "Com problema",
  onboarding: "Onboarding parado",
  inactive: "Sem atividade",
  active: "Ativo",
};
