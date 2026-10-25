// A programação que os modelos mostram: a do casal, ou, sem ela, a cerimônia e a recepção que já constam no site.
import type { MomentoDaProgramacao } from "./catalogo";

interface Base {
  /** Momentos escritos pelo casal (vazio: usa os horários do site). */
  momentos: readonly MomentoDaProgramacao[];
  /** "Sábado, 12 de setembro" ou nulo. */
  diaPorExtenso: string | null;
  cerimonia: string | null;
  recepcao: string | null;
  local: string;
}

export function programaDoSite({ momentos, diaPorExtenso, cerimonia, recepcao, local }: Base): MomentoDaProgramacao[] {
  if (momentos.length > 0) return [...momentos];
  const dia = diaPorExtenso ? diaPorExtenso.charAt(0).toUpperCase() + diaPorExtenso.slice(1) : "";
  const padrao = [
    cerimonia ? { title: "Cerimônia", day: dia, time: cerimonia, place: local } : null,
    recepcao ? { title: "Recepção", day: dia, time: recepcao, place: local } : null,
  ];
  return padrao.filter((m): m is MomentoDaProgramacao => m !== null);
}
