// Textos das sugestões da Liz: situação observada + motivo relevante, só com dados reais do casamento.
// Puro (sem banco nem Next), para o resumo e as tarefas dizerem a mesma coisa.

const longDate = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" });

const longDateYear = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "2027-03-15" (data de calendário) em "15 de março"; com o ano quando não é o ano de hoje. */
function dayLabel(key: string, todayKey: string): string {
  const date = new Date(`${key}T00:00:00Z`);
  return key.slice(0, 4) === todayKey.slice(0, 4) ? longDate.format(date) : longDateYear.format(date);
}

export interface RsvpTipInput {
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
export function rsvpPendingTipText({ pending, pendingPeople, deadlineKey, todayKey, weddingDays }: RsvpTipInput): string {
  const invites = pending === 1 ? "1 convite" : `${pending.toLocaleString("pt-BR")} convites`;
  const people = pendingPeople === undefined ? "" : ` (${pendingPeople === 1 ? "1 pessoa" : `${pendingPeople.toLocaleString("pt-BR")} pessoas`})`;
  const situation = `${invites} ainda sem resposta${people}.`;
  let reason = "";
  if (deadlineKey) {
    if (deadlineKey < todayKey) reason = `O prazo definido por vocês terminou em ${dayLabel(deadlineKey, todayKey)}.`;
    else if (deadlineKey === todayKey) reason = "O prazo definido por vocês termina hoje.";
    else reason = `O prazo definido por vocês termina em ${dayLabel(deadlineKey, todayKey)}.`;
  } else if (weddingDays !== null && weddingDays >= 0) {
    reason = weddingDays === 0 ? "O casamento é hoje." : weddingDays === 1 ? "Falta 1 dia para o casamento." : `Faltam ${weddingDays} dias para o casamento.`;
  }
  return reason ? `${situation} ${reason}` : situation;
}

/** A partir de quantos dias antes do prazo (ou do casamento, sem prazo) a sugestão pede atenção. */
export const RSVP_PRAZO_PERTO_DIAS = 7;

/** Dias de calendário entre duas chaves "AAAA-MM-DD" (negativo quando `to` já passou). */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/**
 * O motivo da sugestão de convidados sem resposta é um prazo apertado? Usa o mesmo motivo do texto:
 * o prazo do casal quando existe, senão a data do casamento. Prazo vencido também conta.
 */
export function rsvpTipUrgent({ deadlineKey, todayKey, weddingDays }: Omit<RsvpTipInput, "pending" | "pendingPeople">): boolean {
  if (deadlineKey) return daysBetween(todayKey, deadlineKey) <= RSVP_PRAZO_PERTO_DIAS;
  return weddingDays !== null && weddingDays >= 0 && weddingDays <= RSVP_PRAZO_PERTO_DIAS;
}

/** Para onde a ação "Ver convidados sem resposta" leva: a lista já filtrada. */
export const RSVP_PENDING_HREF = "/convidados?resposta=sem-resposta";
export const RSVP_PENDING_ACTION = "Ver convidados sem resposta";
