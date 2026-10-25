"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Campo, juntarIds, type OpcoesDoCampoFlutuante } from "@/components/ui/field";
import { JanelaFlutuante, ConteudoDaJanelaFlutuante, GatilhoDaJanelaFlutuante } from "@/components/ui/popover";
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  isValid,
} from "date-fns";
import { ptBR } from "date-fns/locale";

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

const DIAS_DA_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Seletor de data com rótulo flutuante: o rótulo já nasce no alto (o campo nunca fica vazio). */
export function SeletorDeData({
  id,
  name,
  value: controlledValue,
  defaultValue = "",
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  required = false,
  className,
  label,
  hint,
  error,
  optional,
  size,
  invalid,
}: PropriedadesDoSeletorDeData) {
  const autoId = React.useId();
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string>(controlledValue ?? defaultValue);

  // Acompanha o valor controlado (ajuste durante o render, sem efeito)
  const [prevControlled, setPrevControlled] = useState(controlledValue);
  if (prevControlled !== controlledValue) {
    setPrevControlled(controlledValue);
    if (controlledValue !== undefined) setInternalValue(controlledValue);
  }

  const selectedDate = useMemo(() => {
    const val = controlledValue !== undefined ? controlledValue : internalValue;
    if (!val) return null;
    const parsed = parseISO(val);
    return isValid(parsed) ? parsed : null;
  }, [controlledValue, internalValue]);

  const [currentMonth, setCurrentMonth] = useState<Date>(() => selectedDate || new Date());

  // Ao mudar a data escolhida, o calendário vai para o mês dela
  const [prevSelected, setPrevSelected] = useState(selectedDate);
  if (prevSelected !== selectedDate) {
    setPrevSelected(selectedDate);
    if (selectedDate) setCurrentMonth(selectedDate);
  }

  const handleSelectDate = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd");
    setInternalValue(formatted);
    if (onChange) {
      onChange({ target: { name, value: formatted } });
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalValue("");
    if (onChange) {
      onChange({ target: { name, value: "" } });
    }
  };

  // Month navigation grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const formattedDisplay = selectedDate
    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "";

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
        selectedDate && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpar data"
            className="grid size-11 cursor-pointer place-items-center rounded-[10px] text-tinta-suave transition-colors hover:bg-areia hover:text-tinta"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : undefined
      }
    >
      {(c) => (
        <JanelaFlutuante open={open} onOpenChange={setOpen}>
          {name && (
            <input
              type="hidden"
              name={name}
              value={controlledValue !== undefined ? controlledValue : internalValue}
            />
          )}
          <GatilhoDaJanelaFlutuante asChild>
            <button
              {...c}
              type="button"
              disabled={disabled}
              data-float="always"
              aria-describedby={juntarIds(c["aria-describedby"])}
            >
              <span className={cn(!selectedDate && "text-tinta-suave")}>{formattedDisplay || placeholder}</span>
            </button>
          </GatilhoDaJanelaFlutuante>

          <ConteudoDaJanelaFlutuante className="w-[280px] p-3 shadow-2xl border-linha rounded-xl" align="start">
            {/* Header de Navegação por Mês e Ano */}
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                type="button"
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                aria-label="Mês anterior"
                className="p-1 rounded-lg hover:bg-areia text-tinta-suave transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold text-xs text-tinta capitalize font-sans">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </span>

              <button
                type="button"
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                aria-label="Próximo mês"
                className="p-1 rounded-lg hover:bg-areia text-tinta-suave transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Rótulos dos Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DIAS_DA_SEMANA.map((day) => (
                <span key={day} className="text-xs font-semibold text-tinta-suave py-1">
                  {day}
                </span>
              ))}
            </div>

            {/* Grade de Dias do Mês */}
            <div className="grid grid-cols-7 gap-1 text-center font-sans">
              {days.map((day: Date) => {
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={day.toString()}
                    type="button"
                    onClick={() => handleSelectDate(day)}
                    aria-label={format(day, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    aria-pressed={isSelected}
                    className={cn(
                      "h-8 w-8 mx-auto rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer",
                      !isCurrentMonth && "text-tinta-suave/50 font-normal",
                      isCurrentMonth && !isSelected && "text-tinta font-medium hover:bg-areia",
                      isSelected && "bg-brand text-white font-bold shadow-xs hover:bg-brand-600"
                    )}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            {/* Controles do Rodapé */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-linha text-xs">
              <button
                type="button"
                onClick={() => handleSelectDate(new Date())}
                className="text-brand hover:underline font-bold text-xs cursor-pointer"
              >
                Hoje
              </button>
              {selectedDate && (
                <button
                  type="button"
                  onClick={(e) => handleClear(e)}
                  className="text-tinta-suave hover:text-tinta font-medium text-xs cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </ConteudoDaJanelaFlutuante>
        </JanelaFlutuante>
      )}
    </Campo>
  );
}
