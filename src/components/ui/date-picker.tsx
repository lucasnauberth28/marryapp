"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
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

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

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
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

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
              "w-full h-10 justify-start text-left font-normal bg-white border-zinc-200 shadow-xs hover:bg-zinc-50 px-3 rounded-lg text-sm transition-colors",
              !selectedDate && "text-muted-foreground",
              open && "ring-2 ring-[#8C6D45]/30 border-[#8C6D45]",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-[#8C6D45]" />
            <span className="flex-1 truncate">{formattedDisplay || placeholder}</span>
            {selectedDate && (
              <span
                onClick={handleClear}
                className="ml-auto text-zinc-400 hover:text-zinc-600 p-0.5 rounded-full"
                title="Limpar data"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[280px] p-3 shadow-2xl border-zinc-200 rounded-xl" align="start">
          {/* Header de Navegação por Mês e Ano */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-600 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-bold text-xs text-zinc-800 capitalize font-sans">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>

            <button
              type="button"
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-600 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Rótulos dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAYS.map((day) => (
              <span key={day} className="text-[10px] font-semibold text-zinc-400 py-1">
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
                    !isCurrentMonth && "text-zinc-300 font-normal",
                    isCurrentMonth && !isSelected && "text-zinc-700 font-medium hover:bg-zinc-100",
                    isSelected && "bg-[#8C6D45] text-white font-bold shadow-xs hover:bg-[#755630]"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Controles do Rodapé */}
          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-zinc-100 text-xs">
            <button
              type="button"
              onClick={() => handleSelectDate(new Date())}
              className="text-[#8C6D45] hover:underline font-bold text-[11px] cursor-pointer"
            >
              Hoje
            </button>
            {selectedDate && (
              <button
                type="button"
                onClick={(e) => handleClear(e)}
                className="text-zinc-400 hover:text-zinc-600 font-medium text-[11px] cursor-pointer"
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
