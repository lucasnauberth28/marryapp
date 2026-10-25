"use client";
// A página de mesas: planta com as mesas, convidados sem mesa e arraste entre eles.
import { useState } from "react";
import Link from "next/link";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Box, Plus } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { estiloDoBotao } from "@/components/painel/styles";
import { CartaoDaMesa } from "./componentes/cartao-da-mesa";
import { PreviaDoConvidado } from "./componentes/linha-do-convidado";
import { ModalDeExclusaoDaMesa } from "./componentes/modal-de-exclusao-da-mesa";
import { ModalDeNovaMesa } from "./componentes/modal-de-nova-mesa";
import { PainelDosSemMesa } from "./componentes/painel-dos-sem-mesa";
import type { ConvidadoDaMesa, MesaComConvidados } from "./componentes/tipos";
import { useArrasteDeConvidados } from "./componentes/use-arraste-de-convidados";
import { useConvidadosNasMesas } from "./componentes/use-convidados-nas-mesas";

export type { ConvidadoDaMesa, MesaComConvidados } from "./componentes/tipos";

function resumoDasMesas(mesas: number, sentados: number, confirmados: number) {
  if (mesas === 0) return "Crie as mesas e depois arraste os convidados para cada uma.";
  return `${sentados} de ${confirmados} ${confirmados === 1 ? "confirmado já tem" : "confirmados já têm"} mesa · ${mesas} ${mesas === 1 ? "mesa" : "mesas"}`;
}

export function MesasCliente({ initialTables, initialUnassigned }: { initialTables: MesaComConvidados[]; initialUnassigned: ConvidadoDaMesa[] }) {
  const { tables, unassigned, seatedConfirmed, totalConfirmed, moveGuest } = useConvidadosNasMesas(initialTables, initialUnassigned);
  const arraste = useArrasteDeConvidados(tables, unassigned, moveGuest);
  const [novaAberta, setNovaAberta] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<MesaComConvidados | null>(null);

  return (
    <DndContext id="mesas" sensors={arraste.sensors} onDragStart={arraste.handleDragStart} onDragEnd={arraste.handleDragEnd} onDragCancel={arraste.handleDragCancel}>
      <div className="flex flex-col gap-6">
        <CabecalhoDaPagina
          eyebrow="Convidados"
          title="Mesas"
          description={resumoDasMesas(tables.length, seatedConfirmed, totalConfirmed)}
          actions={
            <>
              <Link href="/mesas/3d" className={estiloDoBotao.secondary}>
                <Box className="size-4" aria-hidden="true" />
                Ver em 3D
              </Link>
              <button type="button" onClick={() => setNovaAberta(true)} className={estiloDoBotao.primary}>
                <Plus className="size-4" aria-hidden="true" />
                Nova mesa
              </button>
            </>
          }
        />
        <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start">
          <PainelDosSemMesa guests={unassigned} tables={tables} totalConfirmed={totalConfirmed} onMove={moveGuest} />
          {/* Planta das mesas */}
          <section aria-label="Planta das mesas" className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fill,minmax(240px,1fr))] items-start gap-4">
            {tables.map((table, i) => (
              <CartaoDaMesa key={table.id} table={table} number={i + 1} tables={tables} onDelete={() => setParaExcluir(table)} onMove={moveGuest} />
            ))}
            <button
              type="button"
              onClick={() => setNovaAberta(true)}
              className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-linha-forte font-semibold text-tinta-suave transition-colors hover:bg-ameixa-suave hover:text-ameixa"
            >
              <Plus className="size-5" aria-hidden="true" />
              Nova mesa
            </button>
          </section>
        </div>
      </div>
      <DragOverlay dropAnimation={null}>{arraste.dragging ? <PreviaDoConvidado guest={arraste.dragging} /> : null}</DragOverlay>
      <ModalDeNovaMesa isOpen={novaAberta} onClose={() => setNovaAberta(false)} />
      <ModalDeExclusaoDaMesa mesa={paraExcluir} onClose={() => setParaExcluir(null)} />
    </DndContext>
  );
}
