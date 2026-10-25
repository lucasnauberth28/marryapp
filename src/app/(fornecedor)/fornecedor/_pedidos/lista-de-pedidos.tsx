import Link from "next/link";
import { Inbox } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { SituacaoDoPedido } from "../../_lib/pedidos";
import { PedidoBloqueado, PedidoLiberado } from "./cartao-do-pedido";
import { FILTROS, type PedidoVisivel } from "./dados";
import { ESTILO_DO_CARTAO } from "./estilos";
import { FiltrosDosPedidos } from "./filtros";

function SemPedidos({ filtrando }: { filtrando: boolean }) {
  return (
    <Aparicao variant="fade" className={cn(ESTILO_DO_CARTAO, "flex flex-col items-center gap-3 px-6 py-12 text-center")}>
      <span className="grid size-12 place-items-center rounded-full bg-salvia-suave text-salvia">
        <Inbox aria-hidden="true" className="size-6" />
      </span>
      <p className="text-lg font-semibold">{filtrando ? "Nenhum pedido com este status" : "Nenhum pedido por aqui ainda"}</p>
      <p className="max-w-md text-tinta-suave">Quando um casal pedir orçamento pelo seu perfil, o pedido aparece aqui com os dados do casamento e o contato do casal.</p>
      <Link href="/fornecedor/perfil" className="inline-flex min-h-11 items-center rounded-xl border border-linha-forte bg-papel px-4 text-[15px] font-semibold text-tinta transition-colors hover:bg-areia">
        Caprichar no meu perfil
      </Link>
    </Aparicao>
  );
}

interface PropriedadesDaLista {
  pedidos: PedidoVisivel[];
  filter: SituacaoDoPedido | null;
  newCount: number;
  nomeDaEmpresa: string;
  mostrandoOsMaisRecentes: boolean;
}

export function ListaDePedidos({ pedidos, filter, newCount, nomeDaEmpresa, mostrandoOsMaisRecentes }: PropriedadesDaLista) {
  return (
    <section aria-labelledby="lista-pedidos" className="group/lista flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="lista-pedidos" className="text-lg font-semibold">
          {filter ? `Pedidos: ${FILTROS.find((f) => f.value === filter)?.label.toLowerCase()}` : "Todos os pedidos"}
        </h2>
        <FiltrosDosPedidos filter={filter} newCount={newCount} />
      </div>
      {pedidos.length === 0 ? (
        <SemPedidos filtrando={filter !== null} />
      ) : (
        <ul className="flex flex-col gap-3 transition-opacity group-has-[[data-link-pending]]/lista:opacity-60">
          {pedidos.map((lead, i) => (lead.locked ? <PedidoBloqueado key={lead.id} lead={lead} atraso={Math.min(i, 5) * 80} /> : <PedidoLiberado key={lead.id} lead={lead} atraso={Math.min(i, 5) * 80} nomeDaEmpresa={nomeDaEmpresa} />))}
        </ul>
      )}
      {mostrandoOsMaisRecentes ? <p className="text-center text-sm text-tinta-suave">Mostrando os 100 pedidos mais recentes.</p> : null}
    </section>
  );
}
