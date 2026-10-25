// Regras puras do aviso de renovação do domínio próprio (sem banco nem Next, testadas isoladamente).
// O domínio do plano VIP vale 1 ano no Registro.br; avisamos o casal 60 e 30 dias antes do vencimento, uma vez cada.

const DIAS_DOS_LEMBRETES_DE_RENOVACAO = [60, 30] as const;
export type DiaDoLembreteDeRenovacao = (typeof DIAS_DOS_LEMBRETES_DE_RENOVACAO)[number];

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

/**
 * Qual aviso deve sair agora, ou null.
 * `lastSent` é DomainOrder.renewalReminderDays: o último aviso já enviado neste período (null = nenhum; volta a null
 * quando o vencimento muda, ou seja, depois de renovar). Se a rotina falhar num dia, o aviso mais próximo ainda sai.
 * Domínio vencido ou sem data não recebe aviso.
 */
export function lembreteDeRenovacaoDevido(params: { expiresAt: Date | null; now: Date; lastSent: number | null }): DiaDoLembreteDeRenovacao | null {
  const { expiresAt, now, lastSent } = params;
  if (!expiresAt) return null;
  const msLeft = expiresAt.getTime() - now.getTime();
  if (msLeft <= 0) return null;
  const daysLeft = Math.ceil(msLeft / UM_DIA_EM_MS);
  for (const day of [...DIAS_DOS_LEMBRETES_DE_RENOVACAO].sort((a, b) => a - b)) {
    if (daysLeft > day) continue;
    const alreadySent = lastSent !== null && lastSent <= day;
    return alreadySent ? null : day;
  }
  return null;
}

/** Até quando a rotina precisa olhar: o maior aviso. */
export function fimDaJanelaDeRenovacao(now: Date): Date {
  return new Date(now.getTime() + Math.max(...DIAS_DOS_LEMBRETES_DE_RENOVACAO) * UM_DIA_EM_MS);
}

/** Próximo aviso previsto (para a tela): o primeiro que ainda não saiu, com a data em que sai. Null se já saíram todos ou venceu. */
export function proximoLembreteDeRenovacao(params: { expiresAt: Date | null; now: Date; lastSent: number | null }): { day: DiaDoLembreteDeRenovacao; on: Date } | null {
  const { expiresAt, now, lastSent } = params;
  if (!expiresAt || expiresAt.getTime() <= now.getTime()) return null;
  for (const day of DIAS_DOS_LEMBRETES_DE_RENOVACAO) {
    const sent = lastSent !== null && lastSent <= day;
    if (sent) continue;
    return { day, on: new Date(expiresAt.getTime() - day * UM_DIA_EM_MS) };
  }
  return null;
}

export type SituacaoDoLembreteDeRenovacao =
  | { kind: "sent"; day: number }
  | { kind: "due"; day: DiaDoLembreteDeRenovacao }
  | { kind: "scheduled"; day: DiaDoLembreteDeRenovacao; on: Date }
  | { kind: "none" };

/** Situação do aviso para a tela: último enviado, saindo na próxima rotina diária, previsto para uma data, ou nada previsto. */
export function situacaoDoLembreteDeRenovacao(params: { expiresAt: Date | null; now: Date; lastSent: number | null }): SituacaoDoLembreteDeRenovacao {
  const due = lembreteDeRenovacaoDevido(params);
  if (due) return { kind: "due", day: due };
  if (params.lastSent !== null) return { kind: "sent", day: params.lastSent };
  const next = proximoLembreteDeRenovacao(params);
  return next ? { kind: "scheduled", ...next } : { kind: "none" };
}

/** Vencimento anual seguinte: a mesma data, 1 ano depois (29 de fevereiro cai em 28). */
export function somarUmAno(date: Date): Date {
  const next = new Date(date.getTime());
  const month = next.getUTCMonth();
  next.setUTCFullYear(next.getUTCFullYear() + 1);
  if (next.getUTCMonth() !== month) next.setUTCDate(0);
  return next;
}
