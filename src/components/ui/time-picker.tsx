"use client";

import { useId } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Campo, juntarIds, type OpcoesDoCampoFlutuante } from "@/components/ui/field";
import { JanelaFlutuante, ConteudoDaJanelaFlutuante, GatilhoDaJanelaFlutuante } from "@/components/ui/popover";
import { PainelDoSeletorDeHora } from "./seletor-de-hora/painel";
import { useSeletorDeHora } from "./seletor-de-hora/use-seletor-de-hora";

export type PropriedadesDoSeletorDeHora = Omit<OpcoesDoCampoFlutuante, "prefix" | "suffix" | "trailing" | "icon"> & {
  id?: string;
  name?: string;
  value?: string; // HH:mm
  onChange?: (e: { target: { name?: string; value: string } }) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Classes da raiz do campo. */
  className?: string;
};

/** Seletor de hora com rótulo flutuante: o rótulo já nasce no alto (o campo nunca fica vazio). */
export function SeletorDeHora({ id, name, value = "", onChange, placeholder = "HH:mm", disabled = false, required = false, className, label, hint, error, optional, size, invalid }: PropriedadesDoSeletorDeHora) {
  const autoId = useId();
  const s = useSeletorDeHora(value, name, disabled, onChange);

  return (
    <Campo id={id ?? autoId} label={label} hint={hint} error={error} optional={optional} required={required} invalid={invalid} icon={Clock} size={size} control="custom" className={className}>
      {(c) => (
        <JanelaFlutuante open={s.isOpen} onOpenChange={s.handleOpenChange}>
          {name && <input type="hidden" name={name} value={value} />}
          <GatilhoDaJanelaFlutuante asChild>
            <button {...c} type="button" disabled={disabled} data-float="always" aria-describedby={juntarIds(c["aria-describedby"])}>
              <span className={cn("tracking-wider", !s.displayValue && "text-tinta-suave")}>{s.displayValue || placeholder}</span>
            </button>
          </GatilhoDaJanelaFlutuante>

          <ConteudoDaJanelaFlutuante align="start" className="w-auto rounded-xl p-4 shadow-2xl">
            <PainelDoSeletorDeHora
              hours={s.hours}
              minutes={s.minutes}
              displayValue={s.displayValue}
              mover={s.mover}
              aoEscolherPredefinicao={(h, m) => {
                s.fireChange(h, m);
                s.setIsOpen(false);
              }}
            />
          </ConteudoDaJanelaFlutuante>
        </JanelaFlutuante>
      )}
    </Campo>
  );
}
