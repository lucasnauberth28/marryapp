export const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Datas do casamento são gravadas à meia-noite UTC: formata em UTC para não voltar um dia. */
export function formatarDataDoCasamento(date: Date | null): string | null {
  if (!date) return null;
  return `${date.getUTCDate()} ${MESES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export const NOMES_DOS_MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const DIAS_DA_SEMANA_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const DIAS_DA_SEMANA_LONGOS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** "Sábado, 17 abr 2027" (data gravada à meia-noite UTC). */
export function formatarDataDoCasamentoPorExtenso(date: Date | null): string | null {
  if (!date) return null;
  return `${DIAS_DA_SEMANA_LONGOS[date.getUTCDay()]}, ${formatarDataDoCasamento(date)}`;
}

/** Date (meia-noite UTC) -> "2026-10-09". */
export function paraDataIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "2026-10-09" -> Date à meia-noite UTC (ou null se inválida). */
export function interpretarDataIso(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || paraDataIso(date) !== value ? null : date;
}

/** "19:00" -> "19h"; "18:30" -> "18h30". */
export function formatarHoraDoPainel(time: string | null): string | null {
  if (!time) return null;
  const [h, m] = time.split(":");
  return `${Number(h)}h${m && m !== "00" ? m : ""}`;
}

const DESLOCAMENTO_DE_BRASILIA_EM_MS = 3 * 60 * 60 * 1000;

 // Brasília (UTC-3, sem horário de verão desde 2019)

/** "há 2 h", "há 15 min", "ontem" ou "3 out" (em horário de Brasília). */
export function formatarTempoRelativo(date: Date, now: Date = new Date()): string {
  const diffMin = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const local = new Date(date.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  const today = new Date(now.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  const days = Math.round(
    (Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) -
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())) /
      86400000,
  );
  if (days === 1) return "ontem";
  const sameYear = local.getUTCFullYear() === today.getUTCFullYear();
  return `${local.getUTCDate()} ${MESES[local.getUTCMonth()]}${sameYear ? "" : ` ${local.getUTCFullYear()}`}`;
}

/** Dia de hoje em Brasília, como Date à meia-noite UTC (mesmo formato das datas de casamento). */
export function hojeEmBrasilia(now: Date = new Date()): Date {
  const local = new Date(now.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

/** Data e hora em Brasília: "hoje, 14:20", "ontem, 09:05" ou "3 out, 14:20". */
export function formatarDataEHoraEmBrasilia(date: Date, now: Date = new Date()): string {
  const local = new Date(date.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  const day = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const diffDays = Math.round((hojeEmBrasilia(now).getTime() - day) / 86400000);
  const hm = `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
  if (diffDays === 0) return `hoje, ${hm}`;
  if (diffDays === 1) return `ontem, ${hm}`;
  const sameYear = local.getUTCFullYear() === new Date(now.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS).getUTCFullYear();
  return `${local.getUTCDate()} ${MESES[local.getUTCMonth()]}${sameYear ? "" : ` ${local.getUTCFullYear()}`}, ${hm}`;
}

/** Primeiro instante do mês corrente em Brasília, como Date UTC. */
export function inicioDoMesEmBrasilia(now: Date = new Date()): Date {
  const local = new Date(now.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) + DESLOCAMENTO_DE_BRASILIA_EM_MS);
}
