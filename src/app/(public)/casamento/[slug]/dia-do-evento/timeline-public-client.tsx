"use client";

import { useSyncExternalStore } from "react";
import { Programacao, itemDeAgora, type EventoPublicoDaLinhaDoTempo } from "./componentes/programacao";
import { agoraEmBrasilia, assinarRelogio, minutoAtual, semRelogio } from "./componentes/tempo";

function CabecalhoDoDia({ dateLabel, isToday }: { dateLabel: string | null; isToday: boolean }) {
  return (
    <div className="flex flex-col gap-1 text-center">
      {dateLabel ? <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">{dateLabel}</p> : null}
      <h1 className="font-display text-[40px] font-medium leading-[46px] tracking-[-0.015em] text-tinta">
        {isToday ? (
          <>
            É <em className="italic text-ameixa">hoje</em>!
          </>
        ) : (
          "O grande dia"
        )}
      </h1>
      {!isToday ? <p className="text-tinta-suave">Acompanhe os horários para não perder nenhum momento especial.</p> : null}
    </div>
  );
}

export function LinhaDoTempoPublicaCliente({
  events,
  dayKey,
  dateLabel,
}: {
  events: EventoPublicoDaLinhaDoTempo[];
  /** Dia do casamento ("2027-10-11"), para saber se é hoje. */
  dayKey: string | null;
  dateLabel: string | null;
}) {
  const minute = useSyncExternalStore(assinarRelogio, minutoAtual, semRelogio);
  const now = minute === null ? null : agoraEmBrasilia(minute);
  const isToday = now !== null && dayKey !== null && now.day === dayKey;
  const currentId = isToday && now ? itemDeAgora(events, now.minutes) : null;

  return (
    <>
      <CabecalhoDoDia dateLabel={dateLabel} isToday={isToday} />
      <Programacao events={events} currentId={currentId} isToday={isToday} />
    </>
  );
}
