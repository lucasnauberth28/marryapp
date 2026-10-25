"use client";

import { useEffect, useRef } from "react";

import type { MotorDasMesas3D } from "@/lib/mesas3d/engine";
import type { ArrastoEmAndamento, EstadoAoVivo, PropriedadesDaVisao, ReferenciasDaVisao } from "./visao/tipos";
import { ConteudoDaVisao } from "./visao/conteudo";
import { useAcoesDaVisao } from "./visao/use-acoes";
import { useArrastarConvidado } from "./visao/use-arrastar";
import { useDadosDasMesas } from "./visao/use-dados-das-mesas";
import { useEstadoDaVisao } from "./visao/use-estado";
import { useMotorDasMesas } from "./visao/use-motor";
import { useSentar } from "./visao/use-sentar";

/**
 * Mesas em 3D: a lista de convidados ao lado do cenário. No modo "edit" (o casal) dá para arrastar o convidado até a mesa,
 * ou tocar no nome e depois na mesa; no modo "view" (o link compartilhado) só se busca o próprio nome e a câmera leva à mesa.
 */
export function VisaoDasMesas3D({ mode, coupleNames, initialScene, tables, guests: initialGuests, initialShareToken = null }: PropriedadesDaVisao) {
  const edit = mode === "edit";
  const e = useEstadoDaVisao(edit, initialScene, initialGuests, initialShareToken);
  const dados = useDadosDasMesas(e.scene, tables, e.guests);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MotorDasMesas3D | null>(null);
  const labelRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const ghostRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<ArrastoEmAndamento | null>(null);
  const suppressClickRef = useRef(false);
  const aoVivo: EstadoAoVivo = { edit, selectedId: e.selectedId, guests: e.guests, occ: dados.occ, slotsById: dados.slotsById, layoutSlots: dados.layout.slots };
  const live = useRef(aoVivo);
  useEffect(() => {
    live.current = aoVivo;
  });
  const refs: ReferenciasDaVisao = { canvasRef, hostRef, engineRef, labelRefs, ghostRef, loadingRef, dragRef, suppressClickRef, live };

  const seat = useSentar(live, e.setGuests);
  const { noGl } = useMotorDasMesas({ refs, estado: e, tables, fills: dados.fills, seat });
  useArrastarConvidado(refs, e.setDropId, seat);
  const acoes = useAcoesDaVisao(edit, e, refs);

  return <ConteudoDaVisao edit={edit} coupleNames={coupleNames} tables={tables} refs={refs} estado={e} dados={dados} noGl={noGl} acoes={acoes} seat={seat} />;
}
