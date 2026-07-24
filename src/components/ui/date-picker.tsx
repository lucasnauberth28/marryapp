"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
  placeholder = "dd/mm/aaaa",
  disabled = false,
  required = false,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string>(controlledValue ?? defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);

  // Data selecionada válida ou null
  const selectedDate = useMemo(() => {
    const val = controlledValue !== undefined ? controlledValue : internalValue;
    if (!val) return null;
    const parsed = parseISO(val);
    return isValid(parsed) ? parsed : null;
  }, [controlledValue, internalValue]);

  const [currentMonth, setCurrentMonth] = useState<Date>(
    selectedDate || new Date()
  );

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
      if (controlledValue) {
        const parsed = parseISO(controlledValue);
        if (isValid(parsed)) setCurrentMonth(parsed);
      }
    }
  }, [controlledValue]);

  // Fechar popover ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd");
    setInternalValue(formatted);
    if (onChange) {
      onChange({ target: { name, value: formatted } });
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalValue("");
    if (onChange) {
      onChange({ target: { name, value: "" } });
    }
  };

  // Grade de dias do mês
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const displayFormatted = selectedDate
    ? format(selectedDate, "dd/MM/yyyy")
    : "";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Campo oculto para formulários HTML nativos */}
      {name && <input type="hidden" name={name} value={controlledValue !== undefined ? controlledValue : internalValue} required={required} />}

      {/* Input Display (Estilo PrimeVue) */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm transition-all outline-none flex items-center justify-between shadow-sm cursor-pointer select-none",
          isOpen && "ring-2 ring-[#8C6D45]/30 border-[#8C6D45]",
          disabled && "pointer-events-none opacity-50 bg-input/50",
          className
        )}
        id={id}
      >
        <span className={cn("truncate font-sans", !displayFormatted && "text-muted-foreground")}>
          {displayFormatted || placeholder}
        </span>

        <div className="absolute right-3 flex items-center gap-1 text-zinc-400 group-hover:text-[#8C6D45] transition-colors pointer-events-none">
          <CalendarIcon className="w-4 h-4 text-zinc-400" />
        </div>
      </div>

      {/* Floating PrimeVue Style Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-[300px] rounded-xl border border-zinc-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150 right-0 sm:left-0">
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="font-bold text-sm text-zinc-800 capitalize font-sans">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>

            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAYS.map((day) => (
              <span key={day} className="text-[11px] font-semibold text-zinc-400 py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {days.map((day) => {
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={day.toString()}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={cn(
                    "h-8 w-8 mx-auto rounded-full text-xs flex items-center justify-center transition-all cursor-pointer font-sans",
                    !isCurrentMonth && "text-zinc-300 font-normal",
                    isCurrentMonth && !isSelected && "text-zinc-700 font-medium hover:bg-zinc-100",
                    isSelected && "bg-[#8C6D45] text-white font-bold shadow-sm hover:bg-[#755630]"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 text-xs font-sans">
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="text-[#8C6D45] hover:underline font-bold"
            >
              Hoje
            </button>
            {selectedDate && (
              <button
                type="button"
                onClick={handleClear}
                className="text-zinc-400 hover:text-zinc-600 font-medium"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
