// Janelas do seletor "Período" da Visão geral (?periodo=30d|mes|90d). Puro: sem banco nem Next.
import { chaveDoMesEmBrasilia, inicioDoMesDe, janelaDoMesAnterior } from "./revenue.ts";

export const PERIODOS = ["30d", "mes", "90d"] as const;
export type Periodo = (typeof PERIODOS)[number];

const UM_DIA_EM_MS = 86_400_000;

export interface JanelasDoPeriodo {
  period: Periodo;
  /** Do começo da janela até agora. */
  current: { from: Date; to: Date };
  /** A janela anterior, do mesmo tamanho (no mês, "até o mesmo ponto do mês passado"). */
  previous: { from: Date; to: Date };
  /** "Últimos 30 dias", "Este mês", "Últimos 90 dias". */
  label: string;
  /** Para o rótulo do cartão e a dica: "30 dias", "no mês", "90 dias". */
  short: string;
}

export function janelasDoPeriodo(period: Periodo, now: Date = new Date()): JanelasDoPeriodo {
  if (period === "mes") {
    const prev = janelaDoMesAnterior(now);
    return { period, current: { from: inicioDoMesDe(chaveDoMesEmBrasilia(now)), to: now }, previous: { from: prev.start, to: prev.end }, label: "Este mês", short: "no mês" };
  }
  const days = period === "90d" ? 90 : 30;
  return {
    period,
    current: { from: new Date(now.getTime() - days * UM_DIA_EM_MS), to: now },
    previous: { from: new Date(now.getTime() - 2 * days * UM_DIA_EM_MS), to: new Date(now.getTime() - days * UM_DIA_EM_MS) },
    label: `Últimos ${days} dias`,
    short: `${days} dias`,
  };
}
