import { formatarHoraDoPainel } from "../../../_lib/datas-do-painel";
import type { ItemDoDia } from "./tipos";

/** Pontos do calendário no celular: tons mais fortes que os das etiquetas para aparecerem no fundo claro. */
export const PONTO_DO_CALENDARIO: Record<ItemDoDia["type"], string> = {
  WEDDING: "bg-ameixa",
  MEETING: "bg-salvia",
  BLOCKED: "bg-linha-forte",
};

export const PILULA_DO_CALENDARIO: Record<ItemDoDia["type"], string> = {
  WEDDING: "bg-ameixa text-on-ameixa",
  MEETING: "bg-salvia-suave text-salvia",
  BLOCKED: "bg-areia text-tinta-suave",
};

export function textoDaPilula(item: ItemDoDia) {
  if (item.type === "WEDDING") return item.title;
  if (item.type === "BLOCKED") return "Bloqueado";
  const time = formatarHoraDoPainel(item.time);
  return time ? `${item.title} · ${time}` : item.title;
}

export function itemFalado(item: ItemDoDia) {
  if (item.type === "WEDDING") return `Casamento de ${item.title}`;
  if (item.type === "BLOCKED") return `Data bloqueada${item.title !== "Data bloqueada" ? `: ${item.title}` : ""}`;
  const time = formatarHoraDoPainel(item.time);
  return `Reunião: ${item.title}${time ? ` às ${time}` : ""}`;
}
