// Formatação em português do Brasil para as telas da administração. Sem dependências: roda no servidor,
// no navegador e nos testes. Datas e horas sempre no horário de Brasília.

const TZ = "America/Sao_Paulo";
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const SP_OFFSET_MS = 3 * 60 * 60 * 1000; // Brasília é UTC-3 o ano todo (sem horário de verão desde 2019)
const DAY_MS = 86_400_000;
const integer = new Intl.NumberFormat("pt-BR");
/** Número com separador de milhar: 1236 -> "1.236". */
export function formatInt(n: number): string {
  return integer.format(n);
}

/** Percentual inteiro: 0.614 -> "61%". Sem base (total zero), devolve null para a tela mostrar "sem dados". */
export function formatPercent(part: number, total: number): string | null {
  if (!total) return null;
  return `${Math.round((part / total) * 100)}%`;
}

/** Dia no calendário de Brasília como número (dias desde 1970), para comparar dias sem erro de fuso. */
function brasiliaDayNumber(date: Date): number {
  return Math.floor((date.getTime() - SP_OFFSET_MS) / DAY_MS);
}

function parts(date: Date) {
  const local = new Date(date.getTime() - SP_OFFSET_MS);
  return { y: local.getUTCFullYear(), m: local.getUTCMonth(), d: local.getUTCDate(), h: local.getUTCHours(), min: local.getUTCMinutes() };
}

const two = (n: number) => String(n).padStart(2, "0");

/** "17 abr 2027". */
export function formatDate(date: Date): string {
  const p = parts(date);
  return `${p.d} ${MONTHS[p.m]} ${p.y}`;
}

/** "17 abr" (sem o ano). */
export function formatDayMonth(date: Date): string {
  const p = parts(date);
  return `${p.d} ${MONTHS[p.m]}`;
}

/** "2 ago 2026, 21:02". */
export function formatDateTime(date: Date): string {
  const p = parts(date);
  return `${p.d} ${MONTHS[p.m]} ${p.y}, ${two(p.h)}:${two(p.min)}`;
}

/** "21:02". */
export function formatTime(date: Date): string {
  const p = parts(date);
  return `${two(p.h)}:${two(p.min)}`;
}

/** "sábado". */
export function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: TZ }).format(date);
}

/** "segunda, 12 de outubro de 2026" para o sobretítulo da Visão geral. */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(date);
}

/** "outubro" (mês por extenso). */
export function formatMonthName(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: TZ }).format(date);
}

/** Dias inteiros de `from` até `to` no calendário de Brasília (0 = hoje, negativo = já passou). */
export function daysBetween(to: Date, from: Date = new Date()): number {
  return brasiliaDayNumber(to) - brasiliaDayNumber(from);
}

/** "hoje", "amanhã", "em 9 dias", "ontem", "há 3 dias". */
export function relativeDay(date: Date, now: Date = new Date()): string {
  const n = daysBetween(date, now);
  if (n === 0) return "hoje";
  if (n === 1) return "amanhã";
  if (n === -1) return "ontem";
  return n > 0 ? `em ${n} dias` : `há ${-n} dias`;
}

/** Tempo passado curto: "agora", "há 5 min", "há 3 h", "ontem", "há 4 dias", depois "3 out" (ou "3 out 2025" de outro ano). */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const min = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000));
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24 && daysBetween(now, date) === 0) return `há ${h} h`;
  const days = daysBetween(now, date);
  if (days <= 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return parts(date).y === parts(now).y ? formatDayMonth(date) : formatDate(date);
}

/** Iniciais de um nome ou de "Ana Ribeiro e Rafael Duarte": "AR". */
export function initialsOf(name: string): string {
  const words = name.replace(/&/g, " ").split(/\s+/).filter((w) => w && !/^e$/i.test(w));
  const letter = (w: string | undefined) => w?.match(/\p{L}/u)?.[0]?.toLocaleUpperCase("pt-BR") ?? "";
  const out = `${letter(words[0])}${words.length > 1 ? letter(words[words.length > 3 ? 2 : 1]) : ""}`;
  return out || "?";
}
