"use client";

import { useTransition } from "react";
import { Loader2, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { updateLeadStatus } from "@/actions/vendor-panel-actions";
import { cn } from "@/lib/utils";
import { LEAD_NEXT_STEP, LEAD_STATUS_LABEL, LEAD_STATUSES, type LeadStatus } from "../_lib/vendor-panel";

const btnBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";
const btnPrimary = `${btnBase} bg-ameixa text-on-ameixa hover:bg-ameixa-hover`;
const btnSecondary = `${btnBase} border border-linha-forte bg-papel text-tinta hover:bg-areia`;

export function LeadActions({
  leadId,
  status,
  coupleName,
  whatsappUrl,
  coupleEmail,
}: {
  leadId: string;
  status: LeadStatus;
  coupleName: string;
  whatsappUrl: string | null;
  coupleEmail: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const next = LEAD_NEXT_STEP[status];

  function changeStatus(target: LeadStatus) {
    if (target === status) return;
    startTransition(async () => {
      const res = await updateLeadStatus(leadId, target);
      if (res.success) {
        toast.success(`Pedido de ${coupleName} marcado como “${LEAD_STATUS_LABEL[target]}”.`);
      } else {
        toast.error(res.error ?? "Não foi possível atualizar o pedido.");
      }
    });
  }

  return (
    <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:w-56 sm:flex-col">
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={status === "NEW" ? btnPrimary : btnSecondary}
        >
          <MessageCircle aria-hidden="true" className="size-[18px]" />
          {status === "NEW" ? "Responder no WhatsApp" : "WhatsApp"}
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      ) : coupleEmail ? (
        <a href={`mailto:${coupleEmail}`} className={status === "NEW" ? btnPrimary : btnSecondary}>
          <Mail aria-hidden="true" className="size-[18px]" />
          Responder por e-mail
        </a>
      ) : null}

      {next ? (
        <button type="button" className={btnSecondary} disabled={isPending} onClick={() => changeStatus(next.status)}>
          {isPending ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : null}
          {next.label}
        </button>
      ) : null}

      <label className="flex flex-col gap-1 min-[420px]:col-span-2 sm:col-span-1">
        <span className="sr-only">Alterar status do pedido de {coupleName}</span>
        <select
          value={status}
          disabled={isPending}
          onChange={(e) => changeStatus(e.target.value as LeadStatus)}
          className={cn(
            "min-h-11 w-full cursor-pointer rounded-xl border border-linha-forte bg-papel px-3 text-sm text-tinta",
            "disabled:opacity-60",
          )}
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              Status: {LEAD_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
