"use client";
// Os presentes em dinheiro: resumo do que entrou, pagamentos recebidos e a vitrine do site.
import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { estiloDoBotao } from "@/components/landing/styles";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { useEstadoSincronizado } from "@/hooks/use-synced-state";
import type { PresenteLocal } from "@/types/local";
import { ModalDoPresente } from "./componentes/modal-do-presente";
import { Recebidos } from "./componentes/recebidos";
import { ResumoDosPresentesNaTela } from "./componentes/resumo-dos-presentes";
import type { PagamentoDoPresente, ResumoDosPresentes } from "./componentes/tipos";
import { useExclusaoDePresente } from "./componentes/use-exclusao-de-presente";
import { Vitrine } from "./componentes/vitrine";

export type { PagamentoDoPresente } from "./componentes/tipos";

interface PropriedadesDosPresentesCliente {
  initialGifts: PresenteLocal[];
  payments: PagamentoDoPresente[];
  summary: ResumoDosPresentes;
  siteGiftsHref: string;
}

export function PresentesCliente({ initialGifts, payments, summary, siteGiftsHref }: PropriedadesDosPresentesCliente) {
  const [gifts, setGifts] = useEstadoSincronizado<PresenteLocal[]>(initialGifts);
  const [modalAberto, setModalAberto] = useState(false);
  const exclusao = useExclusaoDePresente((id) => setGifts((prev) => prev.filter((g) => g.id !== id)));
  const cadastrar = () => setModalAberto(true);

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDaPagina
        eyebrow="Site e presentes"
        title="Presentes em dinheiro"
        description="Cada presente tem um valor em reais. O convidado escolhe um da lista e paga por Pix ou cartão. Nenhum produto é entregue: o presente é o valor."
        actions={
          <>
            <Link href={siteGiftsHref} target="_blank" rel="noopener" className={estiloDoBotao.secondary}>
              Ver como o convidado vê
            </Link>
            <button type="button" onClick={cadastrar} className={estiloDoBotao.primary}>
              <Plus className="size-4" aria-hidden="true" /> Novo presente
            </button>
          </>
        }
      />
      <ResumoDosPresentesNaTela summary={summary} pagos={gifts.filter((g) => g.isPurchased).length} cadastrados={gifts.length} />
      <Recebidos payments={payments} temPresentes={gifts.length > 0} siteGiftsHref={siteGiftsHref} aoCadastrar={cadastrar} />
      <Vitrine gifts={gifts} deletingId={exclusao.deletingId} isPending={exclusao.isPending} aoCadastrar={cadastrar} aoExcluir={exclusao.pedir} />
      <ModalDoPresente isOpen={modalAberto} onClose={() => setModalAberto(false)} />
      <ModalDeConfirmacao isOpen={exclusao.aberto} onClose={exclusao.fechar} onConfirm={exclusao.confirmar} title="Excluir presente" description="Excluir este presente da lista do site? Não dá para desfazer." />
    </div>
  );
}
