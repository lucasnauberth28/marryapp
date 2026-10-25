import Link from "next/link";
import type { ReactNode } from "react";
import { estiloDoCartao, estiloDoTituloDoCartao } from "@/components/casal/ui";
import { cn } from "@/lib/utils";

/**
 * Cartão com título (`ac-card` + `ac-card__title`): a base de quase todo bloco das telas.
 *   <Panel title="Planos de fornecedores vencendo" action={{ label: "Ver todos", href: "/admin/fornecedores" }}>…</Panel>
 *   <Panel title="Interruptor geral" aside={<StatusChip …/>} padded={false}>…tabela até a borda…</Panel>
 * - action: link discreto à direita do título. aside: qualquer nó (chip, botão) no lugar dele.
 * - padded={false}: tira o respiro interno (tabelas e listas que vão até a borda).
 * Sem título, vira só o cartão.
 */
export function Painel({
  title,
  description,
  action,
  aside,
  padded = true,
  className,
  children,
  as: Tag = "section",
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: { label: string; href: string };
  aside?: ReactNode;
  padded?: boolean;
  className?: string;
  children?: ReactNode;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag className={cn(estiloDoCartao, padded && "p-5 md:p-6", "min-w-0", className)}>
      {(title || action || aside) && (
        <div className={cn("flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1", children ? "mb-4" : "", !padded && "px-5 pt-5 md:px-6 md:pt-6")}>
          {title && <h2 className={estiloDoTituloDoCartao}>{title}</h2>}
          {action && (
            <Link href={action.href} className="text-sm font-semibold text-ameixa underline underline-offset-2 hover:text-ameixa-hover">
              {action.label}
            </Link>
          )}
          {aside}
        </div>
      )}
      {description && <p className={cn("-mt-2 mb-4 text-sm leading-5 text-tinta-suave", !padded && "px-5 md:px-6")}>{description}</p>}
      {children}
    </Tag>
  );
}
