import type { ComponentProps } from "react";
import { IndicadorDeCarregamento } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * Botão do painel (classes `btn.*` de ./styles) com o estado de ação em andamento do `Button loading`:
 * spinner no centro, desabilitado, `aria-busy`, e o rótulo fica invisível no lugar (a largura não muda).
 *   <LoadingButton type="submit" className={btn.primary} loading={pendente}>Salvar</LoadingButton>
 * Use no lugar de trocar o rótulo por "Salvando..." ou de pôr um ícone girando dentro do botão.
 */
export function BotaoComCarregamento({
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: Omit<ComponentProps<"button">, "type"> & { loading?: boolean; type?: "button" | "submit" | "reset" }) {
  return (
    <button
      type={type}
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(className, loading && "relative disabled:opacity-100")}
      {...props}
    >
      {loading ? (
        <>
          <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
            <IndicadorDeCarregamento />
          </span>
          {/* Mesmo conteúdo, transparente: mantém a largura e o nome acessível. */}
          <span className="inline-flex items-center justify-center gap-[inherit] opacity-0">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
