import Link from "next/link";
import { LinkPendente } from "@/components/feedback/link-pending";
import { cn } from "@/lib/utils";
import type { SituacaoDoPedido } from "../../_lib/pedidos";
import { FILTROS } from "./dados";

export function FiltrosDosPedidos({ filter, newCount }: { filter: SituacaoDoPedido | null; newCount: number }) {
  return (
    <nav aria-label="Filtrar pedidos" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex gap-2">
        {FILTROS.map((f) => {
          const active = f.value === filter;
          return (
            <li key={f.label}>
              <Link
                href={f.value ? `/fornecedor?status=${f.value}` : "/fornecedor"}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                  active ? "border-salvia bg-salvia-suave text-salvia" : "border-linha bg-papel text-tinta-suave hover:border-linha-forte hover:text-tinta",
                )}
              >
                {f.label}
                {f.value === "NEW" && newCount > 0 ? ` (${newCount})` : ""}
                <LinkPendente label="Carregando os pedidos" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
