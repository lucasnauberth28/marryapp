"use client";

import { useCallback, useEffect, useState } from "react";
import { obterDadosDoPainelDaLiz } from "@/actions/liz-actions";
import type { SituacaoDoCarregamento } from "./tipos";

/** Carrega a sugestão e o plano da conta ao abrir a conversa; `retry` tenta de novo depois de uma falha. */
export function useDadosDoPainelDaLiz() {
  const [load, setLoad] = useState<SituacaoDoCarregamento>({ status: "loading" });

  const fetchData = useCallback(() => {
    obterDadosDoPainelDaLiz()
      .then((res) => setLoad(res.success ? { status: "ready", data: res.data } : { status: "error", message: res.error }))
      .catch(() => setLoad({ status: "error", message: "Não deu para carregar a sugestão agora. Tente de novo." }));
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const retry = () => {
    setLoad({ status: "loading" });
    fetchData();
  };
  return { load, retry };
}
