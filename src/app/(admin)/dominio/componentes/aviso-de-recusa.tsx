import { AlertCircle } from "lucide-react";
import type { VisaoDoPedidoDeDominio } from "@/lib/dominio/domain-orders";

export function AvisoDeRecusa({ order }: { order: VisaoDoPedidoDeDominio }) {
  return (
    <section aria-labelledby="dominio-recusado" className="flex items-start gap-3 rounded-2xl border border-aviso/30 bg-aviso-suave p-4 text-[15px] text-tinta">
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-aviso" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <h2 id="dominio-recusado" className="font-semibold">
          O pedido de {order.domain} não foi aceito
        </h2>
        {order.rejectionReason ? <p>{order.rejectionReason}</p> : null}
        <p>Vocês podem fazer um novo pedido logo abaixo.</p>
      </div>
    </section>
  );
}
