"use client";

import * as React from "react";
import { useState, useCallback, useMemo, useId } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Campo, juntarIds, type OpcoesDoCampoFlutuante } from "@/components/ui/field";
import { JanelaFlutuante, ConteudoDaJanelaFlutuante, GatilhoDaJanelaFlutuante } from "@/components/ui/popover";

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
export function SeletorDeHora({
  id,
  name,
  value = "",
  onChange,
  placeholder = "HH:mm",
  disabled = false,
  required = false,
  className,
  label,
  hint,
  error,
  optional,
  size,
  invalid,
}: PropriedadesDoSeletorDeHora) {
  const autoId = useId();
  const [isOpen, setIsOpen] = useState(false);

  // Parse value into hours and minutes
  const { hours, minutes } = useMemo(() => {
    if (!value || !value.includes(":")) return { hours: -1, minutes: -1 };
    const [h, m] = value.split(":").map(Number);
    return { hours: isNaN(h) ? -1 : h, minutes: isNaN(m) ? -1 : m };
  }, [value]);

  const fireChange = useCallback((h: number, m: number) => {
    const formatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    onChange?.({ target: { name, value: formatted } });
  }, [name, onChange]);

  const incrementHour = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const h = hours < 0 ? 0 : (hours + 1) % 24;
    const m = minutes < 0 ? 0 : minutes;
    fireChange(h, m);
  }, [hours, minutes, fireChange]);

  const decrementHour = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const h = hours <= 0 ? 23 : hours - 1;
    const m = minutes < 0 ? 0 : minutes;
    fireChange(h, m);
  }, [hours, minutes, fireChange]);

  const incrementMinute = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const m = minutes < 0 ? 0 : (minutes + 1) % 60;
    const h = hours < 0 ? 0 : hours;
    fireChange(h, m);
  }, [hours, minutes, fireChange]);

  const decrementMinute = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const m = minutes <= 0 ? 59 : minutes - 1;
    const h = hours < 0 ? 0 : hours;
    fireChange(h, m);
  }, [hours, minutes, fireChange]);

  const handleOpenChange = useCallback((next: boolean) => {
    if (next && disabled) return;
    if (next && hours < 0) {
      // Sem horário ainda: começa pela hora atual
      const now = new Date();
      fireChange(now.getHours(), now.getMinutes());
    }
    setIsOpen(next);
  }, [disabled, hours, fireChange]);

  const displayValue = hours >= 0 && minutes >= 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
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
      icon={Clock}
      size={size}
      control="custom"
      className={className}
    >
      {(c) => (
        <JanelaFlutuante open={isOpen} onOpenChange={handleOpenChange}>
          {name && <input type="hidden" name={name} value={value} />}
          <GatilhoDaJanelaFlutuante asChild>
            <button
              {...c}
              type="button"
              disabled={disabled}
              data-float="always"
              aria-describedby={juntarIds(c["aria-describedby"])}
            >
              <span className={cn("tracking-wider", !displayValue && "text-tinta-suave")}>
                {displayValue || placeholder}
              </span>
            </button>
          </GatilhoDaJanelaFlutuante>

          <ConteudoDaJanelaFlutuante align="start" className="w-auto rounded-xl p-4 shadow-2xl">
          <div className="flex items-center gap-3">
            {/* Hours Column */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={incrementHour}
                aria-label="Aumentar a hora"
                className="w-12 h-8 flex items-center justify-center rounded-lg hover:bg-areia text-tinta-suave transition cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-100 border border-line">
                <span className="text-xl font-bold font-mono text-brand tracking-wider">
                  {hours >= 0 ? String(hours).padStart(2, "0") : "--"}
                </span>
              </div>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={decrementHour}
                aria-label="Diminuir a hora"
                className="w-12 h-8 flex items-center justify-center rounded-lg hover:bg-areia text-tinta-suave transition cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Separator */}
            <span className="text-2xl font-bold text-brand select-none pb-0.5">:</span>

            {/* Minutes Column */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={incrementMinute}
                aria-label="Aumentar os minutos"
                className="w-12 h-8 flex items-center justify-center rounded-lg hover:bg-areia text-tinta-suave transition cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-100 border border-line">
                <span className="text-xl font-bold font-mono text-brand tracking-wider">
                  {minutes >= 0 ? String(minutes).padStart(2, "0") : "--"}
                </span>
              </div>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={decrementMinute}
                aria-label="Diminuir os minutos"
                className="w-12 h-8 flex items-center justify-center rounded-lg hover:bg-areia text-tinta-suave transition cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-linha">
            {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((preset) => (
              <button
                key={preset}
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const [h, m] = preset.split(":").map(Number);
                  fireChange(h, m);
                  setIsOpen(false);
                }}
                className={cn(
                  "min-h-9 px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer",
                  displayValue === preset
                    ? "bg-brand text-white"
                    : "bg-areia text-tinta-suave hover:bg-linha"
                )}
              >
                {preset}
              </button>
            ))}
          </div>
          </ConteudoDaJanelaFlutuante>
        </JanelaFlutuante>
      )}
    </Campo>
  );
}
