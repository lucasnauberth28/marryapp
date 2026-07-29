"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [val, setVal] = React.useState<string>(controlledValue ?? defaultValue);

  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setVal(controlledValue);
    }
  }, [controlledValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setVal(newValue);
    if (onChange) {
      onChange({ target: { name, value: newValue } });
    }
  };

  const handleContainerClick = () => {
    if (disabled) return;
    if (inputRef.current) {
      if ("showPicker" in HTMLInputElement.prototype) {
        try {
          inputRef.current.showPicker();
        } catch {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    }
  };

  // Formata data para exibição elegante no formato pt-BR
  const formattedDisplay = React.useMemo(() => {
    if (!val) return "";
    const parts = val.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return val;
  }, [val]);

  return (
    <div
      onClick={handleContainerClick}
      className={cn(
        "relative flex h-10 w-full items-center rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-xs transition-colors focus-within:ring-2 focus-within:ring-[#8C6D45]/30 focus-within:border-[#8C6D45] hover:bg-zinc-50/50 cursor-pointer select-none",
        disabled && "pointer-events-none opacity-50 bg-input/50",
        className
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-[#8C6D45]" />
      
      <span className={cn("flex-1 truncate font-sans text-sm", !formattedDisplay && "text-muted-foreground")}>
        {formattedDisplay || placeholder}
      </span>

      {/* Input nativo de data transparente para garantir integração perfeita com Forms e Modais */}
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="date"
        value={val}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-sm"
        tabIndex={disabled ? -1 : 0}
      />
    </div>
  );
}
