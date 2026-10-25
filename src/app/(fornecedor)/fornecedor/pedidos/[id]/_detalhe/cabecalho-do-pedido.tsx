import { Aparicao } from "@/components/motion/reveal";
import { EtiquetaDaSituacaoDoPedido } from "../../../../_components/status-chip";
import type { SituacaoDoPedido } from "../../../../_lib/vendor-panel";
import { formatarHoras, rotuloDeChegada } from "./mensagens-e-andamento";
import { VoltarAosPedidos } from "./pedido-bloqueado";

interface PropriedadesDoCabecalho {
  status: SituacaoDoPedido;
  createdAt: Date;
  coupleName: string;
  categoria: string;
  avgResponseHours: number | null;
}

export function CabecalhoDoPedido({ status, createdAt, coupleName, categoria, avgResponseHours }: PropriedadesDoCabecalho) {
  return (
    <Aparicao variant="fade" className="flex flex-col gap-4">
      <VoltarAosPedidos />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <EtiquetaDaSituacaoDoPedido status={status} suffix={rotuloDeChegada(createdAt)} />
          <h1 className="font-display text-[34px] leading-10 font-medium break-words md:text-[44px] md:leading-[50px]">{coupleName}</h1>
          <p className="text-tinta-suave">Pedido de orçamento · {categoria}</p>
        </div>
        {status === "NEW" ? (
          <p className="max-w-sm text-sm text-tinta-suave">
            Quem responde em até 24 h fecha mais
            {avgResponseHours !== null ? `: sua média é ${formatarHoras(avgResponseHours)}.` : "."}
          </p>
        ) : null}
      </div>
    </Aparicao>
  );
}
