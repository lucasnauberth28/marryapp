"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DIAS_DA_SEMANA_CURTOS } from "../../../_lib/datas-do-painel";
import { type TipoDeEventoDoFornecedor } from "../../../_lib/pedidos";
import { PILULA_DO_CALENDARIO, PONTO_DO_CALENDARIO, itemFalado, textoDaPilula } from "./cores-do-calendario";
import { DetalheDoDia } from "./detalhe-do-dia";
import { JanelaDaAgenda } from "./janela-da-agenda";
import { useAgenda } from "./provedor-da-agenda";
import { colocarEmMaiuscula, dataPorExtenso, type ItemDoDia } from "./tipos";

interface PropriedadesDoDia {
  iso: string;
  day: number;
  items: ItemDoDia[];
  isToday: boolean;
  isPast: boolean;
  aoEscolher: (iso: string) => void;
}

function DiaDoCalendario({ iso, day, items, isToday, isPast, aoEscolher }: PropriedadesDoDia) {
  const spoken = [`${dataPorExtenso(iso)}${isToday ? ", hoje" : ""}`, items.length > 0 ? items.map(itemFalado).join("; ") : "sem compromissos"].join(". ");
  return (
    <button
      type="button"
      aria-label={spoken}
      aria-current={isToday ? "date" : undefined}
      onClick={() => aoEscolher(iso)}
      className="flex min-h-14 min-w-0 flex-col items-center gap-1 rounded-[10px] border border-linha bg-papel p-1 text-left transition-colors hover:border-linha-forte hover:bg-linho sm:min-h-[104px] sm:items-stretch sm:gap-1.5 sm:p-2"
    >
      <span aria-hidden="true" className={cn("text-sm font-semibold", isToday ? "grid size-7 place-items-center rounded-full bg-tinta text-linho" : "h-7 leading-7", isPast && !isToday && "text-tinta-suave")}>
        {day}
      </span>
      {/* No celular, cada compromisso vira um ponto; o detalhe abre ao tocar no dia. */}
      {items.length > 0 ? (
        <span aria-hidden="true" className="flex gap-1 sm:hidden">
          {items.slice(0, 3).map((item) => (
            <span key={`d-${item.type}-${item.id}`} className={cn("size-2 rounded-full", PONTO_DO_CALENDARIO[item.type])} />
          ))}
        </span>
      ) : null}
      {items.slice(0, 3).map((item) => (
        <span key={`${item.type}-${item.id}`} aria-hidden="true" className={cn("hidden rounded-md px-1.5 py-1 text-xs leading-4 font-semibold break-words sm:line-clamp-2", PILULA_DO_CALENDARIO[item.type])}>
          {textoDaPilula(item)}
        </span>
      ))}
      {items.length > 3 ? (
        <span aria-hidden="true" className="hidden text-xs font-semibold text-tinta-suave sm:inline">
          +{items.length - 3}
        </span>
      ) : null}
    </button>
  );
}

interface PropriedadesDoCalendario {
  year: number;
  /** 0 a 11 */
  month: number;
  todayIso: string;
  days: Record<string, ItemDoDia[]>;
}

export function CalendarioDaAgenda({ year, month, todayIso, days }: PropriedadesDoCalendario) {
  const { openForm } = useAgenda();
  const [selected, setSelected] = useState<string | null>(null);
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const isoOf = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  function abrirFormulario(kind: TipoDeEventoDoFornecedor) {
    const date = selected ?? todayIso;
    setSelected(null);
    openForm(kind, date);
  }

  return (
    <>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="grid grid-cols-7 gap-1 sm:min-w-[560px] sm:gap-1.5">
          {DIAS_DA_SEMANA_CURTOS.map((d) => (
            <span key={d} aria-hidden="true" className="text-center text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase">
              {d}
            </span>
          ))}
          {Array.from({ length: firstWeekday }, (_, i) => (
            <div key={`vazio-${i}`} aria-hidden="true" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const iso = isoOf(i + 1);
            return <DiaDoCalendario key={iso} iso={iso} day={i + 1} items={days[iso] ?? []} isToday={iso === todayIso} isPast={iso < todayIso} aoEscolher={setSelected} />;
          })}
        </div>
      </div>
      <JanelaDaAgenda open={selected !== null} onClose={() => setSelected(null)} title={selected ? colocarEmMaiuscula(dataPorExtenso(selected)) : ""}>
        <DetalheDoDia itens={selected ? (days[selected] ?? []) : []} aoExcluir={() => setSelected(null)} aoNovo={abrirFormulario} />
      </JanelaDaAgenda>
    </>
  );
}
