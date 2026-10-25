import { AlertCircle } from "lucide-react";
import { CaixaDeSelecao } from "@/components/ui/checkbox";
import { TEXTO_DO_ACEITE_DOS_TERMOS_DE_DOMINIO } from "@/lib/dominio/domain-terms";
import type { PedidoDeDominio } from "./use-pedido-de-dominio";

export function AceiteDosTermos({ pedido }: { pedido: PedidoDeDominio }) {
  const erro = pedido.errors.accepted;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <CaixaDeSelecao
          id="dominio-aceite"
          checked={pedido.dados.accepted}
          onCheckedChange={(v) => {
            pedido.mudar("accepted", v === true);
            pedido.limparErro("accepted");
          }}
          aria-invalid={!!erro}
          aria-describedby={erro ? "dominio-aceite-erro" : undefined}
          className="mt-0.5"
        />
        <label htmlFor="dominio-aceite" className="min-h-6 cursor-pointer text-[15px] leading-6 text-tinta">
          {TEXTO_DO_ACEITE_DOS_TERMOS_DE_DOMINIO}
        </label>
      </div>
      {erro ? (
        <p id="dominio-aceite-erro" role="alert" className="flex items-center gap-1 text-sm font-semibold text-perigo">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" /> {erro}
        </p>
      ) : null}
    </div>
  );
}
