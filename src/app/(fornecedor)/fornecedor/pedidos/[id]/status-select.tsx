"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateLeadStatus } from "@/actions/vendor-panel-actions";
import { cn } from "@/lib/utils";
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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-tinta">
        Status do pedido
        {isPending ? <Loader2 aria-label="Salvando" className="size-4 animate-spin text-tinta-suave" /> : null}
      </label>
      <select
        id={id}
        value={status}
        disabled={isPending}
        onChange={(e) => onChange(e.target.value as LeadStatus)}
        className={cn(
          "min-h-11 w-full cursor-pointer rounded-xl border border-linha-forte bg-papel px-3 text-base text-tinta",
          "disabled:opacity-60",
        )}
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
