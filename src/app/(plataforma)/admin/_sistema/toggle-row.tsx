"use client";

import { useId, type ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * Linha com título, explicação e interruptor (Switch). `locked` deixa o interruptor desligado e travado,
 * com o motivo no texto (nunca um interruptor que finge funcionar).
 */
export function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  locked,
  className,
}: {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onCheckedChange?: (value: boolean) => void;
  disabled?: boolean;
  locked?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-4 py-3", className)}>
      <div className="min-w-0">
        <p id={`${id}-t`} className="text-[15px] font-semibold leading-5 text-tinta">
          {label}
        </p>
        {description && (
          <p id={`${id}-d`} className="mt-0.5 text-sm leading-5 text-tinta-suave">
            {description}
          </p>
        )}
      </div>
      <Switch
        checked={locked ? false : checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled || locked}
        aria-labelledby={`${id}-t`}
        aria-describedby={description ? `${id}-d` : undefined}
        className="mt-0.5"
      />
    </div>
  );
}
