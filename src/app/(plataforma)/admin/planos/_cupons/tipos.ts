import { formatarReais } from "@/lib/formatacao/dinheiro";

export interface LinhaDeCupom {
  id: string;
  code: string;
  percentOff: number | null;
  amountOff: number | null;
  planIds: string[];
  maxRedemptions: number | null;
  redemptions: number;
  /** "2026-12-31" (dia de Brasília) ou null. */
  expiresOn: string | null;
  /** Já formatado ("31 dez 2026"). */
  expiresLabel: string | null;
  expired: boolean;
  active: boolean;
}

export interface EscolhaDePlano {
  id: string;
  label: string;
}

export type RascunhoDoCupom = {
  code: string;
  kind: "percent" | "amount";
  value: string;
  planIds: string[];
  maxRedemptions: string;
  expiresAt: string;
  active: boolean;
};

export const ESTILO_DO_BOTAO =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const RASCUNHO_VAZIO_DO_CUPOM: RascunhoDoCupom = { code: "", kind: "percent", value: "", planIds: [], maxRedemptions: "", expiresAt: "", active: true };

/** "10,50" ou "10.50" -> 1050 centavos; null se não for um valor. */
export function reaisParaCentavos(value: string): number | null {
  const clean = value.trim().replace(/\s|R\$/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

function centavosParaReais(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function rotuloDoDesconto(c: Pick<LinhaDeCupom, "percentOff" | "amountOff">) {
  if (c.percentOff) return `${c.percentOff}% de desconto`;
  if (c.amountOff) return `${formatarReais(c.amountOff)} de desconto`;
  return "Sem desconto";
}

export function situacaoDe(c: LinhaDeCupom): { label: string; tone: string } {
  if (!c.active) return { label: "Pausado", tone: "bg-areia text-tinta" };
  if (c.expired) return { label: "Vencido", tone: "bg-perigo-suave text-perigo" };
  if (c.maxRedemptions !== null && c.redemptions >= c.maxRedemptions) return { label: "Esgotado", tone: "bg-aviso-suave text-aviso" };
  return { label: "Valendo", tone: "bg-sucesso-suave text-sucesso" };
}

export function rascunhoDe(c: LinhaDeCupom): RascunhoDoCupom {
  return {
    code: c.code,
    kind: c.percentOff ? "percent" : "amount",
    value: c.percentOff ? String(c.percentOff) : c.amountOff ? centavosParaReais(c.amountOff) : "",
    planIds: c.planIds,
    maxRedemptions: c.maxRedemptions ? String(c.maxRedemptions) : "",
    expiresAt: c.expiresOn ?? "",
    active: c.active,
  };
}
