"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateLeadStatus } from "@/actions/vendor-panel-actions";
import { NativeSelect } from "@/components/ui/select";
import { LEAD_STATUS_LABEL, LEAD_STATUSES, type LeadStatus } from "../../../_lib/vendor-panel";

/** Troca o status do pedido (mesma ação da lista de pedidos). */
export function StatusSelect({ leadId, status, id = "status-pedido" }: { leadId: string; status: LeadStatus; id?: string }) {
  const [isPending, startTransition] = useTransition();

  function onChange(target: LeadStatus) {
    if (target === status) return;
    startTransition(async () => {
      const res = await updateLeadStatus(leadId, target);
      if (res.success) toast.success(`Pedido marcado como “${LEAD_STATUS_LABEL[target]}”.`);
      else toast.error(res.error ?? "Não foi possível atualizar o pedido.");
    });
  }

  return (
    <NativeSelect
      id={id}
      label="Status do pedido"
      hint={isPending ? "Salvando…" : undefined}
      value={status}
      disabled={isPending}
      onChange={(e) => onChange(e.target.value as LeadStatus)}
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s} value={s}>
          {LEAD_STATUS_LABEL[s]}
        </option>
      ))}
    </NativeSelect>
  );
}
