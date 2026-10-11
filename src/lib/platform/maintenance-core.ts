// Regras puras do modo de manutenção (sem banco nem Next): quem é barrado, o texto mostrado e a data de volta.

export interface MaintenanceState {
  enabled: boolean;
  message: string;
  /** ISO 8601 com fuso, ou null. */
  backAt: string | null;
}

/** A administração da plataforma ("*") nunca é barrada: é ela quem liga e desliga o modo. */
export function isMaintenanceExempt(allowedPaths: readonly string[] | null | undefined): boolean {
  return Array.isArray(allowedPaths) && allowedPaths.includes("*");
}

/** Texto de recusa quando uma escrita do painel do casal é barrada pela manutenção; null = pode escrever. */
export function maintenanceRefusal(state: MaintenanceState, allowedPaths: readonly string[] | null | undefined): string | null {
  if (!state.enabled || isMaintenanceExempt(allowedPaths)) return null;
  const back = formatBackAt(state.backAt);
  return `O Aceito está em manutenção e o painel está só para leitura. ${state.message.trim()}${back ? ` Voltamos ${back}.` : ""}`.replace(/\s+/g, " ").trim();
}

const TZ = "America/Sao_Paulo";

/** "17 de outubro às 23:30" no horário de Brasília; vazio se não houver data. */
export function formatBackAt(backAt: string | null): string {
  if (!backAt) return "";
  const date = new Date(backAt);
  if (Number.isNaN(date.getTime())) return "";
  const day = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: TZ }).format(date);
  const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ }).format(date);
  return `${day} às ${time}`;
}

/** Data (AAAA-MM-DD) e hora (HH:MM) de Brasília para os campos do formulário a partir do ISO guardado. */
export function splitBackAt(backAt: string | null): { date: string; time: string } {
  if (!backAt) return { date: "", time: "" };
  const d = new Date(backAt);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const local = new Date(d.getTime() - 3 * 3_600_000).toISOString(); // Brasília é UTC-3 o ano todo
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

/** Junta data e hora de Brasília (campos do formulário) no ISO guardado; null se faltar algum. */
export function joinBackAt(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
