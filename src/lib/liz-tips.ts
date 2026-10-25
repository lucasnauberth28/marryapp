import { formatarDataCivilLonga, formatarDataCivilSemAno } from "./formatacao/data.ts";
// Textos das sugestões da Liz: situação observada + motivo relevante, só com dados reais do casamento.
// Puro (sem banco nem Next), para o resumo e as tarefas dizerem a mesma coisa.



/** "2027-03-15" (data de calendário) em "15 de março"; com o ano quando não é o ano de hoje. */
function rotuloDoDia(key: string, todayKey: string): string {
  const date = new Date(`${key}T00:00:00Z`);
  return key.slice(0, 4) === todayKey.slice(0, 4) ? formatarDataCivilSemAno(date) : formatarDataCivilLonga(date);
}

export interface EntradaDaDicaDeConfirmacao {
  /** Convites sem resposta (um por convidado; quem só presenteou fica de fora). */
  pending: number;
  /** Pessoas nesses convites (o convidado e os acompanhantes); quando vem, a frase diz as duas unidades. */
  pendingPeople?: number;
  /** Prazo de confirmação definido pelo casal, "AAAA-MM-DD", ou null quando não definiu. */
  deadlineKey: string | null;
  /** Hoje no fuso do casal, "AAAA-MM-DD". */
  todayKey: string;
  /** Dias até o casamento (null sem data ou depois que passou). */
  weddingDays: number | null;
}

/**
 * "[N] convites ainda sem resposta ([M] pessoas). O prazo definido por vocês termina em [data]."
 * Sempre com a unidade: convite é a quem cobrar a resposta, pessoa é o número para o buffet.
 * Sem prazo definido, não inventa um: usa a data do casamento se existir, ou só a situação.
 */
export function textoDaDicaDeConfirmacaoPendente({ pending, pendingPeople, deadlineKey, todayKey, weddingDays }: EntradaDaDicaDeConfirmacao): string {
  const invites = pending === 1 ? "1 convite" : `${pending.toLocaleString("pt-BR")} convites`;
  const people = pendingPeople === undefined ? "" : ` (${pendingPeople === 1 ? "1 pessoa" : `${pendingPeople.toLocaleString("pt-BR")} pessoas`})`;
  const situation = `${invites} ainda sem resposta${people}.`;
  let reason = "";
  if (deadlineKey) {
    if (deadlineKey < todayKey) reason = `O prazo definido por vocês terminou em ${rotuloDoDia(deadlineKey, todayKey)}.`;
    else if (deadlineKey === todayKey) reason = "O prazo definido por vocês termina hoje.";
    else reason = `O prazo definido por vocês termina em ${rotuloDoDia(deadlineKey, todayKey)}.`;
  } else if (weddingDays !== null && weddingDays >= 0) {
    reason = weddingDays === 0 ? "O casamento é hoje." : weddingDays === 1 ? "Falta 1 dia para o casamento." : `Faltam ${weddingDays} dias para o casamento.`;
  }
  return reason ? `${situation} ${reason}` : situation;
}

/** A partir de quantos dias antes do prazo (ou do casamento, sem prazo) a sugestão pede atenção. */
const DIAS_PARA_PRAZO_DE_CONFIRMACAO_PROXIMO = 7;

/** Dias de calendário entre duas chaves "AAAA-MM-DD" (negativo quando `to` já passou). */
function diasEntre(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/**
 * O motivo da sugestão de convidados sem resposta é um prazo apertado? Usa o mesmo motivo do texto:
 * o prazo do casal quando existe, senão a data do casamento. Prazo vencido também conta.
 */
export function dicaDeConfirmacaoUrgente({ deadlineKey, todayKey, weddingDays }: Omit<EntradaDaDicaDeConfirmacao, "pending" | "pendingPeople">): boolean {
  if (deadlineKey) return diasEntre(todayKey, deadlineKey) <= DIAS_PARA_PRAZO_DE_CONFIRMACAO_PROXIMO;
  return weddingDays !== null && weddingDays >= 0 && weddingDays <= DIAS_PARA_PRAZO_DE_CONFIRMACAO_PROXIMO;
}

/** Para onde a ação "Ver convidados sem resposta" leva: a lista já filtrada. */
export const LINK_DAS_CONFIRMACOES_PENDENTES = "/convidados?resposta=sem-resposta";
export const ACAO_DAS_CONFIRMACOES_PENDENTES = "Ver convidados sem resposta";
