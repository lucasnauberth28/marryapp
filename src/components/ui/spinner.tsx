import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Spinner pequeno, na cor do texto (currentColor). Só para DENTRO de botões em ação (veja Button `loading`).
 * Nunca como carregamento de tela ou de seção: para isso use os esqueletos de `@/components/skeletons`.
 * Com "reduzir movimento" ligado o ícone fica parado (a regra global zera as animações).
 */
export function IndicadorDeCarregamento({ className }: { className?: string }) {
  return <LoaderCircle aria-hidden="true" className={cn("size-4 animate-spin", className)} />;
}
