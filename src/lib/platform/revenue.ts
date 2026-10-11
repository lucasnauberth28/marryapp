// Cálculos puros de receita da administração (sem banco nem Next, testados isoladamente).
// Mês sempre no calendário de Brasília (UTC-3 o ano todo). Valores em centavos.
// Quem lê o banco e usa isto: lib/platform/queries/receita.ts.

const SP_OFFSET_MS = 3 * 60 * 60 * 1000;
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** "2026-10": o mês de Brasília em que a data cai. */
export function brasiliaMonthKey(date: Date): string {
  const local = new Date(date.getTime() - SP_OFFSET_MS);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Primeiro instante do mês ("2026-10") em Brasília. */
export function monthStartOf(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1) + SP_OFFSET_MS);
}

/** Chave do mês `delta` meses depois (ou antes, se negativo) de `key`. */
export function shiftMonthKey(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** "Out" para "2026-10". */
export function monthShortLabel(key: string): string {
  return MONTHS[Number(key.split("-")[1]) - 1] ?? key;
}

/** Os últimos `count` meses, do mais antigo ao atual ("2026-04" ... "2026-10"). */
export function lastMonthKeys(now: Date, count = 7): string[] {
  const current = brasiliaMonthKey(now);
  return Array.from({ length: count }, (_, i) => shiftMonthKey(current, i - (count - 1)));
}

export interface PaidRow {
  /** Centavos. */
  amount: number;
  planType: string;
  paidAt: Date | null;
}

export interface MonthBucket {
  key: string;
  label: string;
  /** Planos de casal (pagamento único). */
  couple: number;
  /** Planos de fornecedor (mensalidades). */
  vendor: number;
  total: number;
  payments: number;
  /** Mês em andamento (a barra do gráfico fica mais clara). */
  inProgress: boolean;
}

/** Soma os pagamentos aprovados por mês de pagamento, separando casais e fornecedores. Meses sem pagamento aparecem zerados. */
export function bucketRevenue(rows: PaidRow[], now: Date, count = 7): MonthBucket[] {
  const keys = lastMonthKeys(now, count);
  const current = keys[keys.length - 1];
  const buckets = new Map<string, MonthBucket>(
    keys.map((key) => [key, { key, label: monthShortLabel(key), couple: 0, vendor: 0, total: 0, payments: 0, inProgress: key === current }]),
  );
  for (const row of rows) {
    if (!row.paidAt || row.amount <= 0) continue;
    const bucket = buckets.get(brasiliaMonthKey(row.paidAt));
    if (!bucket) continue;
    if (row.planType === "VENDOR") bucket.vendor += row.amount;
    else bucket.couple += row.amount;
    bucket.total += row.amount;
    bucket.payments += 1;
  }
  return keys.map((key) => buckets.get(key)!);
}

/**
 * Janela de comparação "até o mesmo ponto do mês": do começo do mês passado até o mesmo instante
 * (relativo ao começo do mês) em que estamos. Nunca ultrapassa o fim do mês passado.
 */
export function previousMonthWindow(now: Date): { start: Date; end: Date } {
  const currentKey = brasiliaMonthKey(now);
  const currentStart = monthStartOf(currentKey);
  const start = monthStartOf(shiftMonthKey(currentKey, -1));
  const elapsed = now.getTime() - currentStart.getTime();
  return { start, end: new Date(Math.min(start.getTime() + elapsed, currentStart.getTime())) };
}

/** Variação percentual inteira contra o período anterior; null quando não há base (anterior zero). */
export function percentChange(current: number, previous: number): number | null {
  if (!previous || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Texto curto da variação: "18%" (sempre sem sinal; o componente mostra a seta). */
export function percentLabel(change: number): string {
  return `${Math.abs(change)}%`;
}

/** Valor médio por pagamento (centavos, arredondado), ou null sem pagamentos. */
export function averagePayment(totalCents: number, payments: number): number | null {
  return payments > 0 ? Math.round(totalCents / payments) : null;
}

export interface MonthlyPlanVendor {
  tier: "PRO" | "MASTER";
  count: number;
}

/** Mensalidades vigentes: Pro e Master pagantes vezes o preço de cada plano. */
export function monthlyRecurring(vendors: MonthlyPlanVendor[], prices: { pro: number; master: number }): { cents: number; pro: number; master: number } {
  const pro = vendors.filter((v) => v.tier === "PRO").reduce((n, v) => n + v.count, 0);
  const master = vendors.filter((v) => v.tier === "MASTER").reduce((n, v) => n + v.count, 0);
  return { cents: pro * prices.pro + master * prices.master, pro, master };
}

/** Maior valor do gráfico e a escala (teto redondo para as linhas de grade), sempre > 0. */
export function chartScale(buckets: MonthBucket[]): { max: number; ticks: number[] } {
  const peak = Math.max(0, ...buckets.map((b) => b.total));
  if (peak === 0) return { max: 100_00, ticks: [0, 50_00, 100_00] };
  const exponent = 10 ** Math.floor(Math.log10(peak));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.map((s) => s * exponent).find((v) => v >= peak) ?? 10 * exponent;
  return { max: step, ticks: [0, step / 2, step] };
}
