"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { startNavigationProgress } from "@/components/feedback/navigation-progress";
import { markListNavigation } from "@/components/plataforma/pending";
import { NativeSelect } from "@/components/ui/select";
import { PERIODOS, type Periodo } from "@/lib/platform/overview-period";

const LABEL: Record<Periodo, string> = { "30d": "Últimos 30 dias", mes: "Este mês", "90d": "Últimos 90 dias" };

/** Seletor "Período" da Visão geral: escreve ?periodo= na URL (o servidor recalcula os cartões). */
export function PeriodSelect({ value }: { value: Periodo }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <div aria-busy={pending} className="w-full sm:w-[240px]">
      <NativeSelect
        label="Período"
        alwaysFloat
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value === "30d") next.delete("periodo");
          else next.set("periodo", e.target.value);
          const qs = next.toString();
          const href = qs ? `${pathname}?${qs}` : pathname;
          startNavigationProgress();
          markListNavigation(href); // os blocos que dependem do período (PendingRegion) ficam mais claros até chegar
          startTransition(() => router.replace(href, { scroll: false }));
        }}
      >
        {PERIODOS.map((p) => (
          <option key={p} value={p}>
            {LABEL[p]}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
