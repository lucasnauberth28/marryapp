"use client";

import { useState } from "react";
import type { PresenteLocal as Gift } from "@/types/local";
import { CabecalhoDosPresentes } from "./componentes/cabecalho";
import { BarraDeBuscaEOrdem, GradeDePresentes, SemPresentes, filtrarEOrdenar, type Ordenacao } from "./componentes/lista";

interface PropriedadesDosPresentesPublicos {
  initialGifts: Gift[];
  coupleNames: string;
  /** Falso quando o cartão não está disponível: a tela só fala de Pix. */
  cardEnabled?: boolean;
}

export function PresentesPublicosCliente({ initialGifts, coupleNames, cardEnabled = true }: PropriedadesDosPresentesPublicos) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<Ordenacao>("default");

  return (
    <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-16 sm:px-6">
      <CabecalhoDosPresentes coupleNames={coupleNames} cardEnabled={cardEnabled} />
      {initialGifts.length === 0 ? (
        <SemPresentes />
      ) : (
        <>
          <BarraDeBuscaEOrdem search={search} aoBuscar={setSearch} sortBy={sortBy} aoOrdenar={setSortBy} />
          <GradeDePresentes gifts={filtrarEOrdenar(initialGifts, search, sortBy)} />
        </>
      )}
    </div>
  );
}
