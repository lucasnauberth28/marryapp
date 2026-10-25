"use client";

import * as React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Campo, juntarIds, type OpcoesDoCampoFlutuante } from "@/components/ui/field";
import { JanelaFlutuante, ConteudoDaJanelaFlutuante, GatilhoDaJanelaFlutuante } from "@/components/ui/popover";
import { CalendarioDoMes } from "./seletor-de-data/calendario";
import { useSeletorDeData } from "./seletor-de-data/use-seletor-de-data";

export type PropriedadesDoSeletorDeData = Omit<OpcoesDoCampoFlutuante, "prefix" | "suffix" | "trailing" | "icon"> & {
  id?: string;
  name?: string;
  value?: string; // YYYY-MM-DD
  defaultValue?: string;
  onChange?: (e: { target: { name?: string; value: string } }) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Classes da raiz do campo. */
  className?: string;
};

/** Seletor de data com rótulo flutuante: o rótulo já nasce no alto (o campo nunca fica vazio). */
export function SeletorDeData({ id, name, value: controlledValue, defaultValue = "", onChange, placeholder = "Selecione uma data", disabled = false, required = false, className, label, hint, error, optional, size, invalid }: PropriedadesDoSeletorDeData) {
  const autoId = React.useId();
  const s = useSeletorDeData({ name, controlledValue, defaultValue, onChange });
  const formattedDisplay = s.selectedDate ? format(s.selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "";

  return (
    <Campo
      id={id ?? autoId}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      required={required}
      invalid={invalid}
      icon={CalendarIcon}
      size={size}
      control="custom"
      className={className}
      trailing={
        s.selectedDate && !disabled ? (
          <button type="button" onClick={s.limpar} aria-label="Limpar data" className="grid size-11 cursor-pointer place-items-center rounded-[10px] text-tinta-suave transition-colors hover:bg-areia hover:text-tinta">
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : undefined
      }
    >
      {(c) => (
        <JanelaFlutuante open={s.open} onOpenChange={s.setOpen}>
          {name && <input type="hidden" name={name} value={s.valorParaOFormulario} />}
          <GatilhoDaJanelaFlutuante asChild>
            <button {...c} type="button" disabled={disabled} data-float="always" aria-describedby={juntarIds(c["aria-describedby"])}>
              <span className={cn(!s.selectedDate && "text-tinta-suave")}>{formattedDisplay || placeholder}</span>
            </button>
          </GatilhoDaJanelaFlutuante>

          <ConteudoDaJanelaFlutuante className="w-[280px] p-3 shadow-2xl border-linha rounded-xl" align="start">
            <CalendarioDoMes currentMonth={s.currentMonth} selectedDate={s.selectedDate} aoMudarMes={s.setCurrentMonth} aoEscolher={s.escolher} aoLimpar={s.limpar} />
          </ConteudoDaJanelaFlutuante>
        </JanelaFlutuante>
      )}
    </Campo>
  );
}
