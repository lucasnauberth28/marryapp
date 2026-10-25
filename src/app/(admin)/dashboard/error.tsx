"use client"; // Error boundaries precisam ser Client Components

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { BlocoDoPainel, estiloDoBotaoPrimario } from "./ui";

/** Erro ao montar o Resumo: o menu e o cabeçalho continuam; só esta página pede para tentar de novo. */
export default function DashboardError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] text-tinta md:text-[28px]">Resumo</h1>
      <BlocoDoPainel title="Não deu para carregar o Resumo">
        <div role="alert" className="grid max-w-[60ch] gap-3">
          <p className="flex items-start gap-2 text-pretty text-tinta-suave">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-aviso" aria-hidden="true" />
            Pode ser uma instabilidade momentânea. Os dados de vocês continuam guardados. Tentem de novo em alguns segundos.
            {error.digest ? ` Código: ${error.digest}` : ""}
          </p>
          <div>
            <button type="button" onClick={() => unstable_retry()} className={estiloDoBotaoPrimario}>
              Tentar de novo
            </button>
          </div>
        </div>
      </BlocoDoPainel>
    </div>
  );
}
