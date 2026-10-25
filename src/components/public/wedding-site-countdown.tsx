"use client";

import { useSyncExternalStore } from "react";

import { pluralizar } from "@/lib/formatacao/plural";
const UM_MINUTO_EM_MS = 60_000;
const UM_DIA_EM_MS = 24 * 60 * UM_MINUTO_EM_MS;

function assinarRelogio(onChange: () => void) {
  const id = setInterval(onChange, 20_000);
  return () => clearInterval(id);
}

/** Agora, em minutos cheios: o valor só muda a cada minuto e o contador não re-renderiza à toa. */
function obterAgora() {
  return Math.floor(Date.now() / UM_MINUTO_EM_MS) * UM_MINUTO_EM_MS;
}

/** No servidor não há "agora" confiável para o navegador: a hidratação começa com marcadores. */
function obterAgoraNoServidor() {
  return null;
}

/**
 * Instante do casamento: o dia gravado (meio-dia UTC) com o horário da cerimônia no horário de Brasília.
 * Sem horário, conta até o início do dia.
 */
export function instanteDoCasamento(date: Date, ceremonyTime?: string | null): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(ceremonyTime ?? "");
  const hours = m ? Math.min(Number(m[1]), 23) : 0;
  const minutes = m ? Math.min(Number(m[2]), 59) : 0;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours + 3, minutes);
}

const classeDaUnidade =
  "flex min-w-[72px] flex-col items-center rounded-b-[6px] rounded-t-full border border-linha bg-papel px-2 py-3 text-center md:min-w-20";
const classeDoNumero =
  "block pt-2 font-num text-[32px] font-medium leading-9 text-ameixa tabular-nums [font-variant-numeric:lining-nums_tabular-nums] md:text-[40px] md:leading-[44px]";
const classeDoRotulo = "mt-1 block text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave";

/** Contagem regressiva em dias, horas e minutos. No próprio dia mostra "É hoje!"; depois disso, nada. */
export function ContagemRegressivaDoCasamento({ target }: { target: number }) {
  const now = useSyncExternalStore(assinarRelogio, obterAgora, obterAgoraNoServidor);

  if (now !== null && target - now <= 0) {
    if (now - target > UM_DIA_EM_MS) return null;
    return <p className="font-display text-3xl text-ameixa md:text-4xl">É hoje!</p>;
  }

  const remaining = now === null ? null : target - now;
  const days = remaining === null ? null : Math.floor(remaining / UM_DIA_EM_MS);
  const hours = remaining === null ? null : Math.floor((remaining % UM_DIA_EM_MS) / (60 * UM_MINUTO_EM_MS));
  const minutes = remaining === null ? null : Math.floor((remaining % (60 * UM_MINUTO_EM_MS)) / UM_MINUTO_EM_MS);
  const pad = (n: number | null) => (n === null ? "--" : String(n).padStart(2, "0"));

  const label =
    days === null || hours === null || minutes === null
      ? "Contagem regressiva para o casamento"
      : `Faltam ${pluralizar(days, "dia", "dias")}, ${pluralizar(hours, "hora", "horas")} e ${pluralizar(minutes, "minuto", "minutos")}`;

  return (
    <div role="timer" aria-label={label} className="inline-flex items-stretch gap-2">
      <div className={classeDaUnidade}>
        <span className={classeDoNumero} aria-hidden="true">
          {days === null ? "--" : days}
        </span>
        <span className={classeDoRotulo} aria-hidden="true">
          dias
        </span>
      </div>
      <div className={classeDaUnidade}>
        <span className={classeDoNumero} aria-hidden="true">
          {pad(hours)}
        </span>
        <span className={classeDoRotulo} aria-hidden="true">
          horas
        </span>
      </div>
      <div className={classeDaUnidade}>
        <span className={classeDoNumero} aria-hidden="true">
          {pad(minutes)}
        </span>
        <span className={classeDoRotulo} aria-hidden="true">
          min
        </span>
      </div>
    </div>
  );
}
