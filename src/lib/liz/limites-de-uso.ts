// Decide se uma pergunta pode ir ao modelo de IA da Liz. Puro (sem banco nem rede): as contagens vêm de fora.
// Respeita o que a administração configurou em /admin/madrinha: interruptor, ajuste do casal, limites por dia e mês,
// teto de custo do casal e de toda a Liz, e bloqueio por abuso.

export interface LimitesDoPlanoDaLiz {
  perDay: number;
  perMonth: number;
  costCapCents: number;
  autoBlock: boolean;
}

export interface EntradaDosLimites {
  limites: LimitesDoPlanoDaLiz;
  abuso: { perHour: number; blockHours: number; blockOffTopic: boolean; offTopicBeforeBlock: number };
  tetoGlobal: { monthlyCostCapCents: number; pauseAtCap: boolean };
  /** Ajuste do casal: ligado/desligado, bloqueio e mensagens a mais no mês. */
  ajuste: { enabled: boolean | null; blocked: boolean; extraMessages: number };
  uso: {
    naUltimaHora: number;
    hoje: number;
    noMes: number;
    foraDoAssuntoNoPeriodoDeBloqueio: number;
    custoDoCasalNoMesEmMicroReais: number;
    custoGlobalNoMesEmMicroReais: number;
  };
}

export type MotivoDaRecusa = "desligada" | "bloqueada" | "hora" | "dia" | "mes" | "custo-do-casal" | "teto-global" | "fora-do-assunto";

export type DecisaoDeUso = { permitido: true } | { permitido: false; motivo: MotivoDaRecusa };

const MICRO_REAIS_POR_CENTAVO = 10_000;

/** A primeira regra que não passa decide; a ordem vai do mais grave ao mais comum. */
export function decidirUsoDaLiz({ limites, abuso, tetoGlobal, ajuste, uso }: EntradaDosLimites): DecisaoDeUso {
  const recusa = (motivo: MotivoDaRecusa): DecisaoDeUso => ({ permitido: false, motivo });
  if (ajuste.enabled === false) return recusa("desligada");
  if (ajuste.blocked) return recusa("bloqueada");
  if (tetoGlobal.pauseAtCap && uso.custoGlobalNoMesEmMicroReais >= tetoGlobal.monthlyCostCapCents * MICRO_REAIS_POR_CENTAVO) return recusa("teto-global");
  if (abuso.blockOffTopic && uso.foraDoAssuntoNoPeriodoDeBloqueio >= abuso.offTopicBeforeBlock) return recusa("fora-do-assunto");
  if (uso.naUltimaHora >= abuso.perHour) return recusa("hora");
  if (!limites.autoBlock) return { permitido: true };
  if (uso.hoje >= limites.perDay) return recusa("dia");
  if (uso.noMes >= limites.perMonth + Math.max(0, ajuste.extraMessages)) return recusa("mes");
  if (uso.custoDoCasalNoMesEmMicroReais >= limites.costCapCents * MICRO_REAIS_POR_CENTAVO) return recusa("custo-do-casal");
  return { permitido: true };
}
