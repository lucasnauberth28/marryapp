"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

export interface DatePickerProps {
  id?: string;
  name?: string;
  value?: string; // YYYY-MM-DD
  defaultValue?: string;
  onChange?: (e: { target: { name?: string; value: string } }) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function DatePicker({
  id,
  name,
  value: controlledValue,
  defaultValue = "",
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  required = false,
  className,
}: DatePickerProps) {
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
    <div className="w-full relative">
      {name && (
        <input
          type="hidden"
          name={name}
          value={controlledValue !== undefined ? controlledValue : internalValue}
          required={required}
        />
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full h-11 justify-start text-left font-normal text-base bg-papel border-linha-forte hover:bg-papel hover:border-tinta-suave px-4 rounded-xl transition-colors",
              !selectedDate && "text-tinta-suave",
              open && "ring-2 ring-ameixa/25 border-ameixa",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-ameixa" />
            <span className="flex-1 truncate">{formattedDisplay || placeholder}</span>
            {selectedDate && (
              <span
                onClick={handleClear}
                className="ml-auto text-tinta-suave hover:text-tinta p-0.5 rounded-full"
                title="Limpar data"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[280px] p-3 shadow-2xl border-linha rounded-xl" align="start">
          {/* Header de Navegação por Mês e Ano */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
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
              className="p-1 rounded-lg hover:bg-areia text-tinta-suave transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Rótulos dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAYS.map((day) => (
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
                  className={cn(
                    "h-7 w-7 mx-auto rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer",
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
        </PopoverContent>
      </Popover>
    </div>
  );
}
