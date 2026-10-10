"use client";

import { cn } from "@/lib/utils";

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Nome acessível: diz o que o interruptor controla. */
  label: string;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
}

/**
 * Interruptor (role="switch"). A área de toque tem 44px de altura mesmo com a pílula visível de 26px,
 * e funciona com Espaço e Enter. Estado sempre dito em texto para leitores de tela (aria-checked).
 */
export function ToggleSwitch({ checked, onChange, label, disabled, busy, className }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
      className={cn(
        "group relative grid h-11 w-14 shrink-0 cursor-pointer place-items-center rounded-xl focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative block h-[26px] w-11 rounded-full border transition-colors group-focus-visible:ring-2 group-focus-visible:ring-ameixa group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-papel",
          checked ? "border-ameixa bg-ameixa" : "border-linha-forte bg-areia",
        )}
      >
        <span
          className={cn(
            "absolute left-[3px] top-[3px] block size-[18px] rounded-full bg-papel shadow-sm transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0",
            busy && "animate-pulse",
          )}
        />
      </span>
    </button>
  );
}
