import type { obterIdentidadeDoCasamentoPrincipal } from "@/lib/casamento/wedding";
import type { obterPlanoDoCasamento } from "@/lib/casamento/wedding-plan";
import type { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";

export type ContextoDaPagina = Awaited<ReturnType<typeof exigirCasamentoNaPagina>>;
export type IdentidadeDoCasamento = Awaited<ReturnType<typeof obterIdentidadeDoCasamentoPrincipal>>;
export type PlanoDoCasamento = Awaited<ReturnType<typeof obterPlanoDoCasamento>>;
export type Permissao = (caminho: string) => boolean;

/** Quantos convidados aparecem em cada lista curta do convite. */
export const EXIBIDOS_NAS_LISTAS = 3;

export const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export const textoDosLugares = (n: number) => `${n} ${n === 1 ? "lugar" : "lugares"}`;
export const colocarEmMaiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
