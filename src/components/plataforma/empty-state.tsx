import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Estado vazio honesto (as versões "Vazia" do desenho): ícone em círculo, título em fonte display, texto e uma ação.
 *   <EmptyState icon={Heart} title="Ainda não tem ninguém aqui" action={<Link className={btn.secondary}>…</Link>}>
 *     Quando um casal criar o casamento, ele aparece nesta lista.
 *   </EmptyState>
 * `compact` reduz o respiro (para dentro de colunas estreitas e tabelas).
 */
export function EstadoVazio({
  icon: Icon,
  title,
  children,
  action,
  compact,
  className,
}: {
  icon?: ComponentType<{ className?: string; strokeWidth?: number | string; "aria-hidden"?: boolean | "true" | "false" }>;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-12 md:py-16", className)}>
      {Icon && (
        <span className="mb-1 grid size-14 place-items-center rounded-full bg-areia text-tinta-suave">
          <Icon className="size-6" strokeWidth={1.6} aria-hidden="true" />
        </span>
      )}
      <h3 className="font-display text-2xl font-medium leading-8 text-tinta text-balance">{title}</h3>
      {children && <p className="max-w-md text-base leading-6 text-tinta-suave text-pretty">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
