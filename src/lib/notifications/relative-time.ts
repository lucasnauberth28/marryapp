// "há 5 min", "ontem", "3 out": tempo relativo dos avisos, em horário de Brasília. Puro.

const DESLOCAMENTO_DE_BRASILIA_EM_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3, sem horário de verão desde 2019)
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const numeroDoDia = (d: Date) => {
  const local = new Date(d.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
};

export function tempoRelativo(date: Date, now: Date): string {
  const diffMin = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;

  const days = Math.round((numeroDoDia(now) - numeroDoDia(date)) / 86400000);
  if (days <= 1) return "ontem";
  if (days < 7) return `há ${days} dias`;

  const local = new Date(date.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  const sameYear = local.getUTCFullYear() === new Date(now.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS).getUTCFullYear();
  return `${local.getUTCDate()} ${MESES[local.getUTCMonth()]}${sameYear ? "" : ` ${local.getUTCFullYear()}`}`;
}
