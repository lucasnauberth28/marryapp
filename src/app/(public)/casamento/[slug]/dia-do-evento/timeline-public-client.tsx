"use client";

import { useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicTimelineEvent {
  id: string;
  title: string;
  /** "16:30" */
  time: string;
  description?: string | null;
}

/** Assina um relógio de um minuto: no servidor devolve null, e a tela só marca "Agora" no navegador. */
function subscribeClock(onTick: () => void) {
  const id = setInterval(onTick, 60_000);
  return () => clearInterval(id);
}
const minuteNow = () => Math.floor(Date.now() / 60_000);
const noClock = () => null;

const BRASILIA = "America/Sao_Paulo";

function brasiliaNow(minute: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRASILIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(minute * 60_000));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { day: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

/** "16:30" vira "16h30" e "16:00" vira "16h", como no design. */
function shortTime(time: string) {
  const [h, m] = time.split(":");
  if (h === undefined || m === undefined) return time;
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

export function TimelinePublicClient({
  events,
  dayKey,
  dateLabel,
}: {
  events: PublicTimelineEvent[];
  /** Dia do casamento ("2027-10-11"), para saber se é hoje. */
  dayKey: string | null;
  dateLabel: string | null;
}) {
  const minute = useSyncExternalStore(subscribeClock, minuteNow, noClock);
  const now = minute === null ? null : brasiliaNow(minute);
  const isToday = now !== null && dayKey !== null && now.day === dayKey;

  // Programação do dia: o item de agora é o último cujo horário já passou.
  let currentId: string | null = null;
  if (isToday && now) {
    const started = events.filter((e) => {
      const t = toMinutes(e.time);
      return t !== null && t <= now.minutes;
    });
    const last = [...started].sort((a, b) => (toMinutes(a.time) ?? 0) - (toMinutes(b.time) ?? 0)).pop();
    currentId = last?.id ?? null;
  }

  return (
    <>
      <div className="flex flex-col gap-1 text-center">
        {dateLabel ? <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">{dateLabel}</p> : null}
        <h1 className="font-display text-[40px] font-normal leading-[46px] tracking-[-0.015em] text-tinta">
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

      <section aria-labelledby="programacao-titulo" className="flex flex-col gap-3">
        <h2 id="programacao-titulo" className="text-xl font-semibold leading-7">
          Programação
        </h2>
        {events.length === 0 ? (
          <p className="rounded-[16px] border border-linha bg-papel px-5 py-8 text-center text-tinta-suave">
            O cronograma ainda está sendo preparado pelos noivos.
          </p>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-5 border-l border-champanhe py-1 pl-5">
            {events.map((event) => {
              const current = event.id === currentId;
              return (
                <li key={event.id} className="relative" aria-current={current ? "step" : undefined}>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-[7px] rounded-full",
                      current ? "-left-[27px] size-[13px] bg-ameixa shadow-[0_0_0_4px_var(--color-ameixa-suave)]" : "-left-[26px] size-[11px] bg-linha",
                    )}
                  />
                  <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 leading-6">
                    <strong className={cn("font-semibold", current && "text-ameixa")}>{shortTime(event.time)}</strong>
                    <span aria-hidden="true" className="text-tinta-suave">
                      ·
                    </span>
                    <span className={isToday && !current ? "text-tinta-suave" : "text-tinta"}>
                      {event.title}
                    </span>
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
            })}
          </ol>
        )}
      </section>
    </>
  );
}
