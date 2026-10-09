// Regras puras dos avisos de vencimento do plano do fornecedor (sem banco nem Next), testáveis isoladamente.

/** Avisos enviados antes do fim do período pago, em dias. Cada um sai uma vez por período. */
export const PLAN_REMINDER_DAYS = [7, 1] as const;
export type PlanReminderDay = (typeof PLAN_REMINDER_DAYS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Qual aviso deve sair agora, ou null.
 * `lastSent` é o PartnerVendor.planReminderDays: o último aviso já enviado neste período
 * (null quando nenhum saiu; volta a null a cada novo pagamento).
 * Se a rotina falhar num dia, o aviso mais próximo do vencimento ainda sai (o de 7 é pulado).
 */
export function dueReminder(params: { expiresAt: Date | null; now: Date; lastSent: number | null }): PlanReminderDay | null {
  const { expiresAt, now, lastSent } = params;
  if (!expiresAt) return null;
  const msLeft = expiresAt.getTime() - now.getTime();
  if (msLeft <= 0) return null;
  const daysLeft = Math.ceil(msLeft / DAY_MS);

  // Do mais próximo ao mais distante: o primeiro cujo prazo já chegou e que ainda não saiu.
  for (const day of [...PLAN_REMINDER_DAYS].sort((a, b) => a - b)) {
    if (daysLeft > day) continue;
    const alreadySent = lastSent !== null && lastSent <= day;
    return alreadySent ? null : day;
  }
  return null;
}

/** Janela de busca da rotina: só fornecedores que vencem até o maior aviso. */
export function reminderWindowEnd(now: Date): Date {
  return new Date(now.getTime() + Math.max(...PLAN_REMINDER_DAYS) * DAY_MS);
}
