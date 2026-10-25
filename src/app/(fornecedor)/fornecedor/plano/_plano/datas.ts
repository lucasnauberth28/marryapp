import { formatarDataDoCasamento } from "../../../_lib/datas-do-painel";

export const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;
const DESLOCAMENTO_DE_BRASILIA_EM_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3, sem horário de verão desde 2019)

/** "14 out 2026" no horário de Brasília; sem o ano quando `short` e for o ano corrente. */
export function formatarData(date: Date, now: Date, short = false): string {
  const local = new Date(date.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  const label = formatarDataDoCasamento(local) ?? "";
  if (!short) return label;
  const sameYear = local.getUTCFullYear() === new Date(now.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS).getUTCFullYear();
  return sameYear ? label.replace(/ \d{4}$/, "") : label;
}
