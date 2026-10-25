// Regras de sentar convidados nas mesas em 3D, sem banco nem navegador: lugares, grupos por cor, ocupação e busca.

export interface ConvidadoParaSentar {
  id: string;
  name: string;
  /** Grupo do convidado no painel (Pais, Amigos...). */
  category: string | null;
  /** Lugares que ele ocupa: ele e os acompanhantes. */
  seats: number;
  tableId: string | null;
}

export interface GrupoDeConvidados {
  key: string;
  label: string;
  color: string;
}

const SEM_GRUPO = "__sem_grupo";
const CORES_DOS_GRUPOS = ["#B2467F", "#5E2B4E", "#D18DB8", "#5F7FA6", "#6F9A6B", "#C8963E", "#7A6AA8", "#C06A5A"] as const;
const COR_NEUTRA = "#8E878B";

/** Lugares de um convidado: ele e quem ele pode levar. */
export function lugaresDoConvidado(allowedCompanions: number | null | undefined): number {
  return 1 + Math.max(0, Math.round(allowedCompanions ?? 0));
}

function chaveDoGrupo(category: string | null | undefined): string {
  const c = (category ?? "").trim();
  return c ? c.toLowerCase() : SEM_GRUPO;
}

/** Um grupo por categoria, na ordem alfabética, cada um com sua cor; quem não tem categoria fica em cinza. */
export function gruposDe(guests: Pick<ConvidadoParaSentar, "category">[]): GrupoDeConvidados[] {
  const labels = new Map<string, string>();
  for (const g of guests) {
    const k = chaveDoGrupo(g.category);
    if (k !== SEM_GRUPO && !labels.has(k)) labels.set(k, (g.category ?? "").trim());
  }
  const sorted = [...labels.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  const out: GrupoDeConvidados[] = sorted.map(([key, label], i) => ({ key, label, color: CORES_DOS_GRUPOS[i % CORES_DOS_GRUPOS.length] }));
  if (guests.some((g) => chaveDoGrupo(g.category) === SEM_GRUPO)) out.push({ key: SEM_GRUPO, label: "Sem grupo", color: COR_NEUTRA });
  return out;
}

export function corDoConvidado(groups: GrupoDeConvidados[], guest: Pick<ConvidadoParaSentar, "category">): string {
  const k = chaveDoGrupo(guest.category);
  return groups.find((g) => g.key === k)?.color ?? COR_NEUTRA;
}

export interface OcupacaoDaMesa {
  used: number;
  guests: ConvidadoParaSentar[];
}

export function ocupacaoPorMesa(tableIds: string[], guests: ConvidadoParaSentar[]): Record<string, OcupacaoDaMesa> {
  const out: Record<string, OcupacaoDaMesa> = {};
  for (const id of tableIds) out[id] = { used: 0, guests: [] };
  for (const g of guests) {
    if (!g.tableId || !out[g.tableId]) continue;
    out[g.tableId].used += g.seats;
    out[g.tableId].guests.push(g);
  }
  return out;
}

/** Cabe na mesa? O convidado que já está nela não conta duas vezes. */
export function podeSentar(capacity: number, occupied: OcupacaoDaMesa, guest: ConvidadoParaSentar, tableId: string): boolean {
  const already = guest.tableId === tableId ? guest.seats : 0;
  return occupied.used - already + guest.seats <= capacity;
}

/** Cor de cada cadeira ocupada, na ordem em que os convidados foram sentando; o que passa da capacidade não tem cadeira. */
export function coresDosLugares(occ: OcupacaoDaMesa, groups: GrupoDeConvidados[], chairs: number): string[] {
  const colors: string[] = [];
  for (const g of occ.guests) {
    const c = corDoConvidado(groups, g);
    for (let i = 0; i < g.seats; i++) colors.push(c);
  }
  return colors.slice(0, chairs);
}

function normalizarNome(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Busca por nome sem se importar com acento, maiúscula nem a ordem das palavras. */
export function combinaComNome(name: string, query: string): boolean {
  const q = normalizarNome(query);
  if (!q) return false;
  const n = normalizarNome(name);
  return q.split(/\s+/).every((part) => n.includes(part));
}
