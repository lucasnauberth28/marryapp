import { useMemo } from "react";
import { calcularDisposicao, type MesaDeEntrada } from "@/lib/mesas3d/layout";
import { CENARIO_PADRAO, type IdDoCenario } from "@/lib/mesas3d/scenarios";
import { gruposDe, ocupacaoPorMesa, coresDosLugares, type ConvidadoParaSentar } from "@/lib/mesas3d/seating";

/** Disposição do cenário e tudo que dela se deriva: grupos, ocupação por mesa e a cor de cada cadeira. */
export function useDadosDasMesas(scene: IdDoCenario | null, tables: MesaDeEntrada[], guests: ConvidadoParaSentar[]) {
  const effectiveScene = scene ?? CENARIO_PADRAO;
  const layout = useMemo(() => calcularDisposicao(effectiveScene, tables), [effectiveScene, tables]);
  const groups = useMemo(() => gruposDe(guests), [guests]);
  const occ = useMemo(() => ocupacaoPorMesa(layout.slots.map((s) => s.id), guests), [layout.slots, guests]);
  const slotsById = useMemo(() => new Map(layout.slots.map((s) => [s.id, s])), [layout.slots]);
  const fills = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const s of layout.slots) if (!s.decor) out[s.id] = coresDosLugares(occ[s.id], groups, s.cadeiras);
    return out;
  }, [layout.slots, occ, groups]);
  return { layout, groups, occ, slotsById, fills };
}

export type DadosDasMesas = ReturnType<typeof useDadosDasMesas>;
