import { MESES } from "../../_lib/datas-do-painel";

export interface VisitasPorDia {
  /** Dia (meia-noite UTC = dia em Brasília). */
  day: Date;
  count: number;
}

export const ESTILO_DO_SOBRETITULO = "text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase";

export function rotuloDoDia(day: Date) {
  return `${day.getUTCDate()} ${MESES[day.getUTCMonth()]}`;
}
