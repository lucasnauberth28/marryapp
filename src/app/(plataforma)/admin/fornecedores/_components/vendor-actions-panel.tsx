"use client";

import { useAcaoDoPainel } from "../../_sistema/use-acao-do-painel";
import { BotaoDeAprovar, RecusaComMotivo } from "../_acoes/curadoria";
import { SecaoDepoisDeAprovado } from "../_acoes/depois-de-aprovado";
import { SecaoDeSuspensao } from "../_acoes/suspensao";

interface Propriedades {
  vendorId: string;
  curation: "approved" | "pending" | "adjust" | "suspended";
  suspended: boolean;
  featured: boolean;
  /** Aprovado e ativo. */
  canFeature: boolean;
  isApproved: boolean;
}

/** Ações da administração sobre um fornecedor: curadoria, destaque, plano de cortesia e suspensão. */
export function PainelDeAcoesDoFornecedor({ vendorId, curation, suspended, featured, canFeature, isApproved }: Propriedades) {
  const acao = useAcaoDoPainel();
  const pendenteDeDecisao = curation !== "approved" && !suspended;

  return (
    <div className="flex flex-col gap-5">
      {acao.error ? (
        <p role="alert" className="rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
          {acao.error}
        </p>
      ) : null}
      {pendenteDeDecisao ? <BotaoDeAprovar vendorId={vendorId} acao={acao} /> : null}
      {pendenteDeDecisao ? <RecusaComMotivo vendorId={vendorId} acao={acao} /> : null}
      {isApproved ? <SecaoDepoisDeAprovado vendorId={vendorId} featured={featured} canFeature={canFeature} acao={acao} /> : null}
      <SecaoDeSuspensao vendorId={vendorId} suspended={suspended} acao={acao} />
    </div>
  );
}
