"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  id?: string;
  name?: string;
  value?: string; // HH:mm
  onChange?: (e: { target: { name?: string; value: string } }) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function TimePicker({
  id,
  name,
  value = "",
  onChange,
  placeholder = "HH:mm",
  disabled = false,
  required = false,
  className,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [isOpen]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (!isOpen && hours < 0) {
      // Initialize to current time if empty
      const now = new Date();
      fireChange(now.getHours(), now.getMinutes());
    }
    setIsOpen((prev) => !prev);
  }, [disabled, isOpen, hours, fireChange]);

  const displayValue = hours >= 0 && minutes >= 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    : "";

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Hidden input for forms */}
      {name && <input type="hidden" name={name} value={value} required={required} />}

      {/* Trigger */}
      <div
        onClick={handleToggle}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm transition-all outline-none flex items-center shadow-sm cursor-pointer select-none",
          isOpen && "ring-2 ring-[#8C6D45]/30 border-[#8C6D45]",
          disabled && "pointer-events-none opacity-50 bg-input/50",
        )}
        id={id}
      >
        <span className={cn("font-mono tracking-wider", !displayValue && "text-muted-foreground")}>
          {displayValue || placeholder}
        </span>
        <div className="absolute right-3 pointer-events-none">
          <Clock className="w-4 h-4 text-zinc-400" />
        </div>
      </div>

      {/* Dropdown Spinner */}
      {isOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full left-0 mt-1.5 rounded-xl border border-zinc-200 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          style={{ zIndex: 999999 }}
        >
          <div className="flex items-center gap-3">
            {/* Hours Column */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={incrementHour}
                className="w-12 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 transition cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#F3ECE3] border border-[#E8E2D9]">
                <span className="text-xl font-bold font-mono text-[#8C6D45] tracking-wider">
                  {hours >= 0 ? String(hours).padStart(2, "0") : "--"}
                </span>
              </div>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={decrementHour}
                className="w-12 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 transition cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Separator */}
            <span className="text-2xl font-bold text-[#8C6D45] select-none pb-0.5">:</span>

            {/* Minutes Column */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={incrementMinute}
                className="w-12 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 transition cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#F3ECE3] border border-[#E8E2D9]">
                <span className="text-xl font-bold font-mono text-[#8C6D45] tracking-wider">
                  {minutes >= 0 ? String(minutes).padStart(2, "0") : "--"}
                </span>
              </div>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={decrementMinute}
                className="w-12 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 transition cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-100">
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
                  "px-2 py-1 text-xs rounded-md font-medium transition cursor-pointer",
                  displayValue === preset
                    ? "bg-[#8C6D45] text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
