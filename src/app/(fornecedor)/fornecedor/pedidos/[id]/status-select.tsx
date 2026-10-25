"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { atualizarSituacaoDoPedido } from "@/actions/vendor-panel-actions";
import { SelecaoNativa } from "@/components/ui/select";
import { ROTULO_DA_SITUACAO_DO_PEDIDO, SITUACOES_DO_PEDIDO, type SituacaoDoPedido } from "../../../_lib/pedidos";

/** Troca o status do pedido (mesma ação da lista de pedidos). */
export function SelecaoDeSituacao({ leadId, status, id = "status-pedido" }: { leadId: string; status: SituacaoDoPedido; id?: string }) {
  const [isPending, startTransition] = useTransition();

  function onChange(target: SituacaoDoPedido) {
    if (target === status) return;
    startTransition(async () => {
      const res = await atualizarSituacaoDoPedido(leadId, target);
      if (res.success) toast.success(`Pedido marcado como “${ROTULO_DA_SITUACAO_DO_PEDIDO[target]}”.`);
      else toast.error(res.error ?? "Não foi possível atualizar o pedido.");
    });
  }

  return (
    <SelecaoNativa
      id={id}
      label="Status do pedido"
      hint={isPending ? "Salvando…" : undefined}
      value={status}
      disabled={isPending}
      onChange={(e) => onChange(e.target.value as SituacaoDoPedido)}
    >
      {SITUACOES_DO_PEDIDO.map((s) => (
        <option key={s} value={s}>
          {ROTULO_DA_SITUACAO_DO_PEDIDO[s]}
        </option>
      ))}
    </SelecaoNativa>
  );
}
