"use client";

import { useEffect } from "react";
import { previaDoPrecoDaAssinatura } from "@/actions/subscription-actions";
import type { CupomAplicado } from "./tipos";

type Resposta = Awaited<ReturnType<typeof previaDoPrecoDaAssinatura>>;

/** Transforma a prévia do servidor em cupom aplicado (ou no erro a mostrar). */
export function interpretarPrevia(res: Resposta, planId: string): { applied: CupomAplicado } | { error: string } {
  if (res.success && res.couponCode) return { applied: { code: res.couponCode, planId, price: res.price, credit: res.credit, discount: res.discount, total: res.total } };
  return { error: res.success ? "Confira o código do cupom." : res.error };
}

/** Trocou de plano com um cupom aplicado: confere de novo para o plano escolhido. */
export function useReconferirCupomAoTrocarDePlano(
  planId: string,
  modules: string[] | undefined,
  applied: CupomAplicado | null,
  onChange: (applied: CupomAplicado | null) => void,
  setError: (erro: string) => void,
) {
  useEffect(() => {
    if (!applied || applied.planId === planId) return;
    let cancelled = false;
    previaDoPrecoDaAssinatura({ planId, modules, couponCode: applied.code }).then((res) => {
      if (cancelled) return;
      const r = interpretarPrevia(res, planId);
      if ("applied" in r) return onChange(r.applied);
      onChange(null);
      setError(r.error);
    });
    return () => {
      cancelled = true;
    };
  }, [planId, modules, applied, onChange, setError]);
}
