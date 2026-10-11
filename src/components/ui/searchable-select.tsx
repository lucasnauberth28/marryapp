"use client";

import * as React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Field, joinIds, type FloatOptions } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export type SearchableSelectProps = Omit<FloatOptions, "prefix" | "suffix" | "trailing"> & {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** Classes da raiz do campo. */
  className?: string;
};

/**
 * Seletor com busca (combobox) e rótulo flutuante.
 * Teclado: Enter, espaço ou seta para baixo abrem; setas movem a opção ativa; Enter escolhe;
 * Esc fecha e devolve o foco ao campo.
 */
export function SearchableSelect({
  options,
  value,
  onValueChange,
  id,
  name,
  required,
  searchPlaceholder = "Buscar…",
  emptyMessage = "Nenhum resultado encontrado.",
  disabled = false,
  className,
  label,
  hint,
  error,
  optional,
  icon,
  size,
  invalid,
}: SearchableSelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const listId = `${fieldId}-lista`;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.sublabel && o.sublabel.toLowerCase().includes(q))
    );
  }, [options, search]);

  const activeIndex = Math.min(active, Math.max(filtered.length - 1, 0));
  const optionId = (i: number) => `${fieldId}-opcao-${i}`;

  // Mantém a opção ativa à vista ao navegar pelo teclado.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[id="${fieldId}-opcao-${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, fieldId]);

  function openMenu() {
    if (disabled) return;
    setSearch("");
    setActive(Math.max(options.findIndex((o) => o.value === value), 0));
    setOpen(true);
  }

  function choose(optionValue: string) {
    onValueChange(optionValue);
    setOpen(false);
    setSearch("");
  }

  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      required={required}
      invalid={invalid}
      icon={icon}
      size={size}
      chevron
      control="custom"
      className={className}
      extra={<ChevronDown aria-hidden="true" className="ac-float__chevron" />}
    >
      {(c) => (
        <Popover
          open={open}
          onOpenChange={(next) => {
            if (next) openMenu();
            else {
              setOpen(false);
              setSearch("");
            }
          }}
        >
          <PopoverTrigger asChild>
            <button
              {...c}
              type="button"
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={open ? listId : undefined}
              aria-describedby={joinIds(c["aria-describedby"])}
              disabled={disabled}
              data-placeholder={selectedOption ? undefined : ""}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  if (!open) openMenu();
                }
              }}
            >
              <span>{selectedOption ? selectedOption.label : " "}</span>
            </button>
          </PopoverTrigger>
          {name ? <input type="hidden" name={name} value={value} /> : null}
          <PopoverContent
            align="start"
            sideOffset={6}
            className="w-(--radix-popover-trigger-width) min-w-56 overflow-hidden rounded-xl p-0"
          >
            <div className="border-b border-linha p-2">
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tinta-suave" />
                <input
                  type="text"
                  role="combobox"
                  aria-label={searchPlaceholder.replace(/…$/, "")}
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={filtered.length ? optionId(activeIndex) : undefined}
                  autoComplete="off"
                  value={search}
                  placeholder={searchPlaceholder}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActive(Math.min(activeIndex + 1, filtered.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActive(Math.max(activeIndex - 1, 0));
                    } else if (e.key === "Home") {
                      e.preventDefault();
                      setActive(0);
                    } else if (e.key === "End") {
                      e.preventDefault();
                      setActive(Math.max(filtered.length - 1, 0));
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      const opt = filtered[activeIndex];
                      if (opt) choose(opt.value);
                    }
                  }}
                  className="h-11 w-full rounded-lg border border-linha bg-linho pr-3 pl-9 text-base text-tinta outline-none placeholder:text-tinta-suave focus:border-ameixa focus:ring-2 focus:ring-ameixa/25 sm:h-10 sm:text-sm"
                />
              </div>
            </div>
            <div ref={listRef} id={listId} role="listbox" aria-label={typeof label === "string" ? label : undefined} className="max-h-60 overflow-y-auto overscroll-contain py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-tinta-suave">{emptyMessage}</div>
              ) : (
                filtered.map((option, i) => {
                  const isSelected = option.value === value;
                  return (
                    <div
                      key={option.value}
                      id={optionId(i)}
                      role="option"
                      aria-selected={isSelected}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseMove={() => setActive(i)}
                      onClick={() => choose(option.value)}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 text-sm text-tinta transition-colors sm:min-h-9",
                        i === activeIndex && "bg-areia/70",
                        isSelected && "font-semibold text-ameixa"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                        {option.sublabel ? <span className="ml-1 text-xs font-normal text-tinta-suave">{option.sublabel}</span> : null}
                      </span>
                      {isSelected ? <Check aria-hidden="true" className="size-4 shrink-0 text-ameixa" /> : null}
                    </div>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </Field>
  );
}
