import { NOMES_DOS_MESES } from "../../../_lib/vendor-panel";

export type ItemDoDia =
  | { type: "WEDDING"; id: string; title: string; location: string | null }
  | { type: "MEETING" | "BLOCKED"; id: string; title: string; time: string | null; notes: string | null; leadId: string | null };

export interface OpcaoDePedido {
  id: string;
  label: string;
}

const ESTILO_DO_BOTAO =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";
export const ESTILO_DO_BOTAO_PRIMARIO = `${ESTILO_DO_BOTAO} bg-ameixa text-on-ameixa hover:bg-ameixa-hover`;
export const ESTILO_DO_BOTAO_SECUNDARIO = `${ESTILO_DO_BOTAO} border border-linha-forte bg-papel text-tinta hover:bg-areia`;
export const ESTILO_DO_BOTAO_DISCRETO = `${ESTILO_DO_BOTAO} text-tinta-suave hover:bg-areia hover:text-tinta`;
export { ESTILO_DO_BOTAO };

const DIAS_DA_SEMANA_LONGOS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** "2026-10-09" -> "sexta, 9 de outubro". */
export function dataPorExtenso(iso: string) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return `${DIAS_DA_SEMANA_LONGOS[d.getUTCDay()]}, ${d.getUTCDate()} de ${NOMES_DOS_MESES[d.getUTCMonth()]}`;
}

export function colocarEmMaiuscula(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
