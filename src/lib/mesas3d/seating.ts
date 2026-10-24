// Regras de sentar convidados nas mesas em 3D, sem banco nem navegador: lugares, grupos por cor, ocupação e busca.

export interface SeatGuest {
  id: string;
  name: string;
  /** Grupo do convidado no painel (Pais, Amigos...). */
  category: string | null;
  /** Lugares que ele ocupa: ele e os acompanhantes. */
  seats: number;
  tableId: string | null;
}

export interface Group {
  key: string;
  label: string;
  color: string;
}

const NO_GROUP = "__sem_grupo";
export const GROUP_COLORS = ["#B2467F", "#5E2B4E", "#D18DB8", "#5F7FA6", "#6F9A6B", "#C8963E", "#7A6AA8", "#C06A5A"] as const;
const NEUTRAL_COLOR = "#8E878B";

/** Lugares de um convidado: ele e quem ele pode levar. */
export function seatsOfGuest(allowedCompanions: number | null | undefined): number {
  return 1 + Math.max(0, Math.round(allowedCompanions ?? 0));
}

export function groupKey(category: string | null | undefined): string {
  const c = (category ?? "").trim();
  return c ? c.toLowerCase() : NO_GROUP;
}

/** Um grupo por categoria, na ordem alfabética, cada um com sua cor; quem não tem categoria fica em cinza. */
export function groupsOf(guests: Pick<SeatGuest, "category">[]): Group[] {
  const labels = new Map<string, string>();
  for (const g of guests) {
    const k = groupKey(g.category);
    if (k !== NO_GROUP && !labels.has(k)) labels.set(k, (g.category ?? "").trim());
  }
  const sorted = [...labels.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  const out: Group[] = sorted.map(([key, label], i) => ({ key, label, color: GROUP_COLORS[i % GROUP_COLORS.length] }));
  if (guests.some((g) => groupKey(g.category) === NO_GROUP)) out.push({ key: NO_GROUP, label: "Sem grupo", color: NEUTRAL_COLOR });
  return out;
}

export function colorOfGuest(groups: Group[], guest: Pick<SeatGuest, "category">): string {
  const k = groupKey(guest.category);
  return groups.find((g) => g.key === k)?.color ?? NEUTRAL_COLOR;
}

export interface TableOccupancy {
  used: number;
  guests: SeatGuest[];
}

export function occupancyByTable(tableIds: string[], guests: SeatGuest[]): Record<string, TableOccupancy> {
  const out: Record<string, TableOccupancy> = {};
  for (const id of tableIds) out[id] = { used: 0, guests: [] };
  for (const g of guests) {
    if (!g.tableId || !out[g.tableId]) continue;
    out[g.tableId].used += g.seats;
    out[g.tableId].guests.push(g);
  }
  return out;
}

/** Cabe na mesa? O convidado que já está nela não conta duas vezes. */
export function canSeat(capacity: number, occupied: TableOccupancy, guest: SeatGuest, tableId: string): boolean {
  const already = guest.tableId === tableId ? guest.seats : 0;
  return occupied.used - already + guest.seats <= capacity;
}

/** Cor de cada cadeira ocupada, na ordem em que os convidados foram sentando; o que passa da capacidade não tem cadeira. */
export function seatColors(occ: TableOccupancy, groups: Group[], chairs: number): string[] {
  const colors: string[] = [];
  for (const g of occ.guests) {
    const c = colorOfGuest(groups, g);
    for (let i = 0; i < g.seats; i++) colors.push(c);
  }
  return colors.slice(0, chairs);
}

export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Busca por nome sem se importar com acento, maiúscula nem a ordem das palavras. */
export function matchesName(name: string, query: string): boolean {
  const q = normalizeName(query);
  if (!q) return false;
  const n = normalizeName(name);
  return q.split(/\s+/).every((part) => n.includes(part));
}
