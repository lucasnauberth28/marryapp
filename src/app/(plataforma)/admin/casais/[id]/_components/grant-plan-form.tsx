"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { History } from "lucide-react";
import { grantWeddingPlan } from "@/actions/admin-casais-actions";
import { btn } from "@/components/landing/styles";
import { StatusChip } from "@/components/plataforma/status-chip";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCasalAction } from "../../_components/use-casal-action";

/** "Conceder um plano à mão": cortesia de valor zero, com motivo obrigatório. Não cobra nada do casal. */
export function GrantPlanForm({ weddingId, currentPlanId }: { weddingId: string; currentPlanId: string | null }) {
  const router = useRouter();
  const [planId, setPlanId] = useState<"classic" | "vip">(currentPlanId === "classic" ? "vip" : "classic");
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const { pending, error, run } = useCasalAction();
  const name = planId === "vip" ? "VIP" : "Classic";

  return (
    <form
      id="conceder"
      className="flex scroll-mt-24 flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => grantWeddingPlan({ weddingId, planId, reason, notify }), () => {
          setReason("");
          router.refresh();
        });
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold leading-7 text-tinta">Conceder um plano à mão</h2>
        <StatusChip tone="neutro" icon={History}>
          Fica no registro
        </StatusChip>
      </div>
      <p className="-mt-2 text-sm leading-5 text-tinta-suave">É uma cortesia: o plano é liberado sem cobrança e vale para sempre (plano de casal é pago uma vez).</p>
      <NativeSelect label="Plano" value={planId} onChange={(e) => setPlanId(e.target.value as "classic" | "vip")}>
        <option value="classic">Classic</option>
        <option value="vip">VIP</option>
      </NativeSelect>
      <Textarea label="Motivo (obrigatório)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={3} />
      <label className="flex items-center gap-3 text-base text-tinta">
        <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} />
        Avisar o casal por e-mail que o plano foi liberado
      </label>
      {error && (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      )}
      <div>
        <button type="submit" disabled={pending || reason.trim().length < 5} className={btn.primary}>
          {pending ? "Liberando..." : `Conceder o ${name}`}
        </button>
      </div>
    </form>
  );
}
