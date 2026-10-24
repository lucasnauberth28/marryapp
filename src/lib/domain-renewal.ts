// Regras puras do aviso de renovação do domínio próprio (sem banco nem Next, testadas isoladamente).
// O domínio do plano VIP vale 1 ano no Registro.br; avisamos o casal 60 e 30 dias antes do vencimento, uma vez cada.

const RENEWAL_REMINDER_DAYS = [60, 30] as const;
export type RenewalReminderDay = (typeof RENEWAL_REMINDER_DAYS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Qual aviso deve sair agora, ou null.
 * `lastSent` é DomainOrder.renewalReminderDays: o último aviso já enviado neste período (null = nenhum; volta a null
 * quando o vencimento muda, ou seja, depois de renovar). Se a rotina falhar num dia, o aviso mais próximo ainda sai.
 * Domínio vencido ou sem data não recebe aviso.
 */
export function dueRenewalReminder(params: { expiresAt: Date | null; now: Date; lastSent: number | null }): RenewalReminderDay | null {
  const { expiresAt, now, lastSent } = params;
  if (!expiresAt) return null;
  const msLeft = expiresAt.getTime() - now.getTime();
  if (msLeft <= 0) return null;
  const daysLeft = Math.ceil(msLeft / DAY_MS);
  for (const day of [...RENEWAL_REMINDER_DAYS].sort((a, b) => a - b)) {
    if (daysLeft > day) continue;
    const alreadySent = lastSent !== null && lastSent <= day;
    return alreadySent ? null : day;
  }
  return null;
}

/** Até quando a rotina precisa olhar: o maior aviso. */
export function renewalWindowEnd(now: Date): Date {
  return new Date(now.getTime() + Math.max(...RENEWAL_REMINDER_DAYS) * DAY_MS);
}

/** Próximo aviso previsto (para a tela): o primeiro que ainda não saiu, com a data em que sai. Null se já saíram todos ou venceu. */
export function nextRenewalReminder(params: { expiresAt: Date | null; now: Date; lastSent: number | null }): { day: RenewalReminderDay; on: Date } | null {
  const { expiresAt, now, lastSent } = params;
  if (!expiresAt || expiresAt.getTime() <= now.getTime()) return null;
  for (const day of RENEWAL_REMINDER_DAYS) {
    const sent = lastSent !== null && lastSent <= day;
    if (sent) continue;
    return { day, on: new Date(expiresAt.getTime() - day * DAY_MS) };
  }
  return null;
}

export type RenewalReminderStatus =
  | { kind: "sent"; day: number }
  | { kind: "due"; day: RenewalReminderDay }
  | { kind: "scheduled"; day: RenewalReminderDay; on: Date }
  | { kind: "none" };

/** Situação do aviso para a tela: último enviado, saindo na próxima rotina diária, previsto para uma data, ou nada previsto. */
export function renewalReminderStatus(params: { expiresAt: Date | null; now: Date; lastSent: number | null }): RenewalReminderStatus {
  const due = dueRenewalReminder(params);
  if (due) return { kind: "due", day: due };
  if (params.lastSent !== null) return { kind: "sent", day: params.lastSent };
  const next = nextRenewalReminder(params);
  return next ? { kind: "scheduled", ...next } : { kind: "none" };
}

/** Vencimento anual seguinte: a mesma data, 1 ano depois (29 de fevereiro cai em 28). */
export function addOneYear(date: Date): Date {
  const next = new Date(date.getTime());
  const month = next.getUTCMonth();
  next.setUTCFullYear(next.getUTCFullYear() + 1);
  if (next.getUTCMonth() !== month) next.setUTCDate(0);
  return next;
}
