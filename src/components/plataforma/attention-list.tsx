import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { btn } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

/**
 * "Precisa da sua atenção": lista de pendências, cada uma com ícone, título, detalhe e um botão.
 *   <AttentionList items={[{ id: "pix", tone: "aviso", icon: Clock, title: "Conferir 2 Pix de plano", detail: "R$ 398,00 no total", actionLabel: "Conferir", href: "/assinaturas?status=a-conferir" }]} />
 * Lista vazia: use <EmptyState> ("Tudo em dia"); este componente devolve null sem itens.
 * tone: aviso (padrão, círculo champanhe) | perigo (rosa) | neutro. No celular o botão desce para baixo do texto.
 */
export interface AttentionItem {
  id: string;
  title: ReactNode;
  detail?: ReactNode;
  icon: ComponentType<{ className?: string; strokeWidth?: number | string; "aria-hidden"?: boolean | "true" | "false" }>;
  tone?: "aviso" | "perigo" | "neutro";
  actionLabel: string;
  href: string;
}

const ICON_TONE = { aviso: "bg-aviso-suave text-aviso", perigo: "bg-perigo-suave text-perigo", neutro: "bg-areia text-tinta-suave" } as const;

export function AttentionList({ items, className }: { items: AttentionItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className={cn("flex flex-col", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-linha py-4 first:pt-0 last:border-b-0 last:pb-0">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", ICON_TONE[item.tone ?? "aviso"])}>
              <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 basis-56">
              <p className="font-semibold leading-6 text-tinta">{item.title}</p>
              {item.detail && <p className="text-sm leading-5 text-tinta-suave">{item.detail}</p>}
            </div>
            <Link href={item.href} className={cn(btn.secondary, btn.sm, "shrink-0 max-sm:w-full")}>
              {item.actionLabel}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
