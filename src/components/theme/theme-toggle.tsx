"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OPCOES_DE_TEMA, interpretarPreferenciaDeTema } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

const OPTION_ICON = { light: Sun, dark: Moon, system: Monitor } as const;

/** Sol no claro, lua no escuro: troca por CSS (data-theme), então o HTML do servidor já sai certo. */
function ThemeIcon({ className }: { className?: string }) {
  return (
    <>
      <Sun aria-hidden="true" className={cn("dark:hidden", className)} />
      <Moon aria-hidden="true" className={cn("hidden dark:block", className)} />
    </>
  );
}

/** Opções "Claro / Escuro / Do aparelho" para dentro de um DropdownMenu que já existe (menu da conta). */
export function ThemeMenuItems() {
  const { preference, setPreference } = useTheme();
  return (
    <>
      <DropdownMenuLabel className="text-xs font-semibold text-tinta-suave">Aparência</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={preference} onValueChange={(v) => setPreference(interpretarPreferenciaDeTema(v))}>
        {OPCOES_DE_TEMA.map(({ value, label }) => {
          const Icon = OPTION_ICON[value];
          return (
            <DropdownMenuRadioItem key={value} value={value} className="min-h-11 cursor-pointer text-base">
              <Icon aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          );
        })}
      </DropdownMenuRadioGroup>
    </>
  );
}

/**
 * Botão de ícone (sol/lua, 44px) que abre o menu "Claro / Escuro / Do aparelho".
 * Para cabeçalhos e barras: <ThemeToggle /> (aceita variant e className do Button).
 */
export function ThemeToggle({
  className,
  variant = "ghost",
  align = "end",
}: {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  align?: "start" | "center" | "end";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="icon" className={cn("text-tinta-suave", className)} aria-label="Aparência do aplicativo">
          <ThemeIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        <ThemeMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Seletor em linha com as três opções sempre visíveis (rádios nativos: setas e foco de graça).
 * Para a tela de Configurações.
 */
export function ThemeSegmented({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme();
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="sr-only">Aparência do aplicativo</legend>
      <div className="grid w-full grid-cols-3 gap-1 rounded-[12px] border border-linha bg-areia p-1 sm:inline-grid sm:w-auto sm:grid-flow-col sm:grid-cols-none">
        {OPCOES_DE_TEMA.map(({ value, label }) => {
          const Icon = OPTION_ICON[value];
          return (
            <label key={value} className="relative min-w-0">
              <input
                type="radio"
                name="aceito-tema"
                value={value}
                checked={preference === value}
                onChange={() => setPreference(value)}
                className="peer sr-only"
              />
              <span className="flex min-h-11 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[8px] px-2 py-1 text-center text-sm leading-5 sm:flex-row sm:gap-2 sm:px-4 sm:py-0 font-semibold text-tinta-suave transition-colors hover:text-tinta peer-checked:bg-papel peer-checked:text-ameixa peer-checked:shadow-[var(--shadow-aceito-1)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-ameixa">
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
