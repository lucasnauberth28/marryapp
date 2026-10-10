"use client";

import { useSyncExternalStore } from "react";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 20_000);
  return () => clearInterval(id);
}

/** Agora, em minutos cheios: o valor só muda a cada minuto e o contador não re-renderiza à toa. */
function getNow() {
  return Math.floor(Date.now() / MINUTE) * MINUTE;
}

/** No servidor não há "agora" confiável para o navegador: a hidratação começa com marcadores. */
function getServerNow() {
  return null;
}

/**
 * Instante do casamento: o dia gravado (meio-dia UTC) com o horário da cerimônia no horário de Brasília.
 * Sem horário, conta até o início do dia.
 */
export function weddingInstant(date: Date, ceremonyTime?: string | null): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(ceremonyTime ?? "");
  const hours = m ? Math.min(Number(m[1]), 23) : 0;
  const minutes = m ? Math.min(Number(m[2]), 59) : 0;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours + 3, minutes);
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

const unitClass =
  "flex min-w-[72px] flex-col items-center rounded-b-[6px] rounded-t-full border border-linha bg-papel px-2 py-3 text-center md:min-w-20";
const numClass =
  "block pt-2 font-display text-[32px] font-medium leading-9 text-ameixa tabular-nums [font-variant-numeric:lining-nums_tabular-nums] md:text-[40px] md:leading-[44px]";
const labelClass = "mt-1 block text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave";

/** Contagem regressiva em dias, horas e minutos. No próprio dia mostra "É hoje!"; depois disso, nada. */
export function WeddingCountdown({ target }: { target: number }) {
  const now = useSyncExternalStore(subscribe, getNow, getServerNow);

  if (now !== null && target - now <= 0) {
    if (now - target > DAY) return null;
    return <p className="font-display text-3xl italic text-ameixa md:text-4xl">É hoje!</p>;
  }

  const remaining = now === null ? null : target - now;
  const days = remaining === null ? null : Math.floor(remaining / DAY);
  const hours = remaining === null ? null : Math.floor((remaining % DAY) / (60 * MINUTE));
  const minutes = remaining === null ? null : Math.floor((remaining % (60 * MINUTE)) / MINUTE);
  const pad = (n: number | null) => (n === null ? "--" : String(n).padStart(2, "0"));

  const label =
    days === null || hours === null || minutes === null
      ? "Contagem regressiva para o casamento"
      : `Faltam ${plural(days, "dia", "dias")}, ${plural(hours, "hora", "horas")} e ${plural(minutes, "minuto", "minutos")}`;

  return (
    <div role="timer" aria-label={label} className="inline-flex items-stretch gap-2">
      <div className={unitClass}>
        <span className={numClass} aria-hidden="true">
          {days === null ? "--" : days}
        </span>
        <span className={labelClass} aria-hidden="true">
          dias
        </span>
      </div>
      <div className={unitClass}>
        <span className={numClass} aria-hidden="true">
          {pad(hours)}
        </span>
        <span className={labelClass} aria-hidden="true">
          horas
        </span>
      </div>
      <div className={unitClass}>
        <span className={numClass} aria-hidden="true">
          {pad(minutes)}
        </span>
        <span className={labelClass} aria-hidden="true">
          min
        </span>
      </div>
    </div>
  );
}
