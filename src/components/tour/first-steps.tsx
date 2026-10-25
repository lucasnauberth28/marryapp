"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { dismissFirstSteps } from "@/actions/tour-actions";
import { Button } from "@/components/ui/button";
import type { ItemDosPrimeirosPassos } from "@/lib/tour/first-steps";

/**
 * "Primeiros passos" do Resumo. Os itens vêm de dados reais do casamento (calculados no servidor);
 * a lista some sozinha quando tudo está feito, ou quando esta pessoa a dispensa.
 */
export function FirstSteps({ items, doneCount }: { items: ItemDosPrimeirosPassos[]; doneCount: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function dismiss() {
    setError(null);
    startTransition(async () => {
      const res = await dismissFirstSteps().catch(() => null);
      if (!res || !res.success) setError(res && !res.success ? res.error : "Não deu para dispensar a lista. Tente de novo.");
    });
  }

  return (
    <section aria-labelledby="primeiros-passos" data-testid="primeiros-passos" className="flex flex-col gap-3 rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)] md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id="primeiros-passos" className="text-lg font-semibold leading-7 text-tinta md:text-xl">
            Primeiros passos
          </h2>
          <p className="text-sm leading-5 text-tinta-suave">
            {doneCount} de {items.length} {items.length === 1 ? "feito" : "feitos"}
          </p>
        </div>
        <Button variant="quiet" size="sm" onClick={dismiss} loading={pending} className="-mr-2 shrink-0">
          Dispensar
        </Button>
      </div>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id} className="flex min-h-14 items-center gap-3 border-b border-linha py-2 last:border-b-0">
            {item.done ? (
              <Check className="size-5 shrink-0 text-sucesso" aria-hidden="true" />
            ) : (
              <Circle className="size-5 shrink-0 text-linha-forte" aria-hidden="true" />
            )}
            <span className={`min-w-0 flex-1 text-base leading-6 ${item.done ? "text-tinta-suave line-through" : "text-tinta"}`}>
              {item.label}
              <span className="sr-only">{item.done ? ", feito" : ", ainda não feito"}</span>
            </span>
            {!item.done && (
              <Link href={item.href} className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-ameixa hover:bg-ameixa-suave">
                {item.action}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      )}
    </section>
  );
}
