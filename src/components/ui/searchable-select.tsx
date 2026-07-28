"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const lower = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(lower) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(lower))
    );
  }, [options, search]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setSearch("");
  }, [disabled]);

  const handleSelect = useCallback((optionValue: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onValueChange(optionValue);
    setIsOpen(false);
    setSearch("");
  }, [onValueChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onValueChange("");
    setIsOpen(false);
    setSearch("");
  }, [onValueChange]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger */}
      <div
        onClick={handleToggle}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          "h-10 w-full rounded-lg border border-input bg-white px-3 py-2 pr-9 text-sm transition-all outline-none flex items-center justify-between shadow-sm cursor-pointer select-none",
          isOpen && "ring-2 ring-[#8C6D45]/30 border-[#8C6D45]",
          disabled && "pointer-events-none opacity-50 bg-input/50"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("absolute right-3 w-4 h-4 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full left-0 mt-1.5 w-full rounded-xl border border-zinc-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          style={{ zIndex: 999999 }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-zinc-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-zinc-200 bg-zinc-50 outline-none focus:ring-2 focus:ring-[#8C6D45]/20 focus:border-[#8C6D45]/50 transition-all placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-[200px] overflow-y-auto overscroll-contain py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-zinc-400">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleSelect(option.value, e)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors cursor-pointer",
                      isSelected
                        ? "bg-[#F3ECE3] text-[#8C6D45] font-semibold"
                        : "hover:bg-zinc-50 text-zinc-700"
                    )}
                  >
                    <span className="flex-1 truncate">
                      {option.label}
                      {option.sublabel && (
                        <span className="text-xs text-zinc-400 ml-1">{option.sublabel}</span>
                      )}
                    </span>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-[#8C6D45]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
