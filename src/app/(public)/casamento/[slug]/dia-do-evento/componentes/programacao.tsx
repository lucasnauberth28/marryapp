import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { emMinutos, horaCurta } from "./tempo";

export interface EventoPublicoDaLinhaDoTempo {
  id: string;
  title: string;
  /** "16:30" */
  time: string;
  description?: string | null;
}

/** Programação do dia: o item de agora é o último cujo horário já passou. */
export function itemDeAgora(events: EventoPublicoDaLinhaDoTempo[], minutosAgora: number): string | null {
  const iniciados = events.filter((e) => {
    const t = emMinutos(e.time);
    return t !== null && t <= minutosAgora;
  });
  return [...iniciados].sort((a, b) => (emMinutos(a.time) ?? 0) - (emMinutos(b.time) ?? 0)).pop()?.id ?? null;
}

function ItemDaProgramacao({ event, current, isToday }: { event: EventoPublicoDaLinhaDoTempo; current: boolean; isToday: boolean }) {
  return (
    <li className="relative" aria-current={current ? "step" : undefined}>
      <span
        aria-hidden="true"
        className={cn("absolute top-[7px] rounded-full", current ? "-left-[27px] size-[13px] bg-ameixa shadow-[0_0_0_4px_var(--color-ameixa-suave)]" : "-left-[26px] size-[11px] bg-linha")}
      />
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 leading-6">
        <strong className={cn("font-semibold", current && "text-ameixa")}>{horaCurta(event.time)}</strong>
        <span aria-hidden="true" className="text-tinta-suave">
          ·
        </span>
        <span className={isToday && !current ? "text-tinta-suave" : "text-tinta"}>{event.title}</span>
        {current ? (
          <span className="ml-1 inline-flex min-h-[22px] items-center gap-1 rounded-[6px] bg-sucesso-suave px-2 text-xs font-semibold text-sucesso">
            <Check aria-hidden="true" className="size-3" strokeWidth={2.5} />
            Agora
          </span>
        ) : null}
      </p>
      {event.description ? <p className="mt-0.5 text-sm leading-5 text-tinta-suave">{event.description}</p> : null}
    </li>
  );
}

export function Programacao({ events, currentId, isToday }: { events: EventoPublicoDaLinhaDoTempo[]; currentId: string | null; isToday: boolean }) {
  return (
    <section aria-labelledby="programacao-titulo" className="flex flex-col gap-3">
      <h2 id="programacao-titulo" className="text-xl font-semibold leading-7">
        Programação
      </h2>
      {events.length === 0 ? (
        <p className="rounded-[16px] border border-linha bg-papel px-5 py-8 text-center text-tinta-suave">O cronograma ainda está sendo preparado pelos noivos.</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-5 border-l border-rosa py-1 pl-5">
          {events.map((event) => (
            <ItemDaProgramacao key={event.id} event={event} current={event.id === currentId} isToday={isToday} />
          ))}
        </ol>
      )}
    </section>
  );
}
