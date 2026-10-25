"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { iniciarProgressoDaNavegacao } from "@/components/feedback/navigation-progress";
import { marcarNavegacaoDaLista } from "@/components/plataforma/pending";
import { cn } from "@/lib/utils";

interface FiltroDeAssinaturas {
  href: string;
  label: string;
  active: boolean;
}

/** Filtros de status: botões alternáveis (aria-pressed) que mudam o ?status= da página. */
export function EtiquetasDeFiltro({ filters }: { filters: FiltroDeAssinaturas[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div role="group" aria-label="Filtrar por status" aria-busy={isPending} className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f.href}
          type="button"
          aria-pressed={f.active}
          onClick={() => {
            if (f.active) return;
            iniciarProgressoDaNavegacao();
            marcarNavegacaoDaLista(f.href); // a lista (PendingRegion) fica mais clara até chegar
            startTransition(() => router.push(f.href, { scroll: false }));
          }}
          className={cn(
            "inline-flex min-h-11 cursor-pointer items-center rounded-xl border px-4 text-sm font-semibold tabular-nums transition-colors",
            f.active ? "border-ameixa bg-ameixa-suave text-ameixa" : "border-linha bg-papel text-tinta hover:border-linha-forte",
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
