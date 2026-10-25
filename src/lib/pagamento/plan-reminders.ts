// Regras puras dos avisos de vencimento do plano do fornecedor (sem banco nem Next), testáveis isoladamente.

/** Avisos enviados antes do fim do período pago, em dias. Cada um sai uma vez por período. */
const DIAS_DOS_LEMBRETES_DO_PLANO = [7, 1] as const;
export type DiaDoLembreteDoPlano = (typeof DIAS_DOS_LEMBRETES_DO_PLANO)[number];

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

/**
 * Qual aviso deve sair agora, ou null.
 * `lastSent` é o PartnerVendor.planReminderDays: o último aviso já enviado neste período
 * (null quando nenhum saiu; volta a null a cada novo pagamento).
 * Se a rotina falhar num dia, o aviso mais próximo do vencimento ainda sai (o de 7 é pulado).
 */
export function lembreteDevido(params: { expiresAt: Date | null; now: Date; lastSent: number | null }): DiaDoLembreteDoPlano | null {
  const { expiresAt, now, lastSent } = params;
  if (!expiresAt) return null;
  const msLeft = expiresAt.getTime() - now.getTime();
  if (msLeft <= 0) return null;
  const daysLeft = Math.ceil(msLeft / UM_DIA_EM_MS);

  // Do mais próximo ao mais distante: o primeiro cujo prazo já chegou e que ainda não saiu.
  for (const day of [...DIAS_DOS_LEMBRETES_DO_PLANO].sort((a, b) => a - b)) {
    if (daysLeft > day) continue;
    const alreadySent = lastSent !== null && lastSent <= day;
    return alreadySent ? null : day;
  }
  return null;
}

/** Janela de busca da rotina: só fornecedores que vencem até o maior aviso. */
export function fimDaJanelaDoLembrete(now: Date): Date {
  return new Date(now.getTime() + Math.max(...DIAS_DOS_LEMBRETES_DO_PLANO) * UM_DIA_EM_MS);
}
