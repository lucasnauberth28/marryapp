"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  approveVendorAdminAction,
  grantVendorPlanAction,
  rejectVendorAdminAction,
  setVendorFeaturedAction,
  suspendVendorAction,
  unsuspendVendorAction,
  type AdminVendorResult,
} from "@/actions/admin-fornecedores-actions";
import { btn } from "@/components/landing/styles";
import { NativeSelect } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { GRANT_DAYS, REJECTION_REASONS, rejectionMessageFor } from "@/lib/platform/vendor-admin";
import { cn } from "@/lib/utils";

const DANGER = "border-perigo text-perigo hover:border-perigo hover:bg-perigo-suave";

/** Ações da administração sobre um fornecedor: curadoria, destaque, plano de cortesia e suspensão. */
export function VendorActionsPanel({
  vendorId,
  curation,
  suspended,
  featured,
  canFeature,
  isApproved,
}: {
  vendorId: string;
  curation: "approved" | "pending" | "adjust" | "suspended";
  suspended: boolean;
  featured: boolean;
  /** Aprovado e ativo. */
  canFeature: boolean;
  isApproved: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reasonKey, setReasonKey] = useState<string>(REJECTION_REASONS[0].value);
  const [message, setMessage] = useState<string>(REJECTION_REASONS[0].message);
  const [tier, setTier] = useState<"PRO" | "MASTER">("PRO");
  const [days, setDays] = useState("30");
  const [grantReason, setGrantReason] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<AdminVendorResult>, after?: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        if (res.message) toast.success(res.message);
        after?.();
        router.refresh();
      } else {
        setError(res.error);
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <p role="alert" className="rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
          {error}
        </p>
      ) : null}

      {curation !== "approved" && !suspended ? (
        <button type="button" disabled={pending} onClick={() => run(() => approveVendorAdminAction({ vendorId }))} className={cn(btn.primary, "self-start")}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />} Aprovar
        </button>
      ) : null}

      {curation !== "approved" && !suspended ? (
        <section aria-label="Recusar com motivo" className="flex flex-col gap-3 border-t border-linha pt-4">
          <h3 className="text-[15px] font-semibold text-tinta">Recusar com motivo</h3>
          <NativeSelect
            label="Motivo"
            alwaysFloat
            value={reasonKey}
            onChange={(e) => {
              setReasonKey(e.target.value);
              setMessage(rejectionMessageFor(e.target.value));
            }}
          >
            {REJECTION_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </NativeSelect>
          <Textarea label="Mensagem para o fornecedor" rows={4} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} hint="Ele lê esta mensagem no painel dele." />
          <button
            type="button"
            disabled={pending || message.trim().length < 10}
            onClick={() => run(() => rejectVendorAdminAction({ vendorId, message }))}
            className={cn(btn.secondary, DANGER, "self-start")}
          >
            Recusar com motivo
          </button>
        </section>
      ) : null}

      {isApproved ? (
        <section aria-label="Depois de aprovado" className="flex flex-col gap-4 border-t border-linha pt-4">
          <h3 className="text-[15px] font-semibold text-tinta">Depois de aprovado</h3>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <label htmlFor={`destaque-${vendorId}`} className="block text-[15px] font-semibold text-tinta">
                Destacar na vitrine
              </label>
              <p className="text-sm text-tinta-suave">
                {canFeature ? "Aparece no topo da lista de fornecedores." : "Só quem está aprovado e ativo pode ser destacado."}
              </p>
            </div>
            <Switch
              id={`destaque-${vendorId}`}
              checked={featured}
              disabled={pending || (!canFeature && !featured)}
              onCheckedChange={(checked) => run(() => setVendorFeaturedAction({ vendorId, featured: checked }))}
            />
          </div>

          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => grantVendorPlanAction({ vendorId, tier, days: Number(days), reason: grantReason }), () => setGrantReason(""));
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <NativeSelect label="Conceder plano" alwaysFloat value={tier} onChange={(e) => setTier(e.target.value as "PRO" | "MASTER")}>
                <option value="PRO">Pro</option>
                <option value="MASTER">Master</option>
              </NativeSelect>
              <NativeSelect label="Por quantos dias" alwaysFloat value={days} onChange={(e) => setDays(e.target.value)}>
                {GRANT_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Textarea label="Motivo da cortesia" rows={2} maxLength={500} value={grantReason} onChange={(e) => setGrantReason(e.target.value)} hint="Fica no registro de atividades. Não gera cobrança." />
            <button type="submit" disabled={pending || grantReason.trim().length < 5} className={cn(btn.secondary, "self-start")}>
              Conceder plano
            </button>
          </form>
        </section>
      ) : null}

      <section aria-label="Suspender" className="flex flex-col gap-3 border-t border-linha pt-4">
        {suspended ? (
          <>
            <p className="text-sm text-tinta-suave">Este fornecedor está suspenso e fora da vitrine.</p>
            <button type="button" disabled={pending} onClick={() => run(() => unsuspendVendorAction({ vendorId }))} className={cn(btn.secondary, "self-start")}>
              Reativar o fornecedor
            </button>
          </>
        ) : suspendOpen ? (
          <>
            <Textarea label="Motivo da suspensão" rows={2} maxLength={500} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} hint="O fornecedor vê este motivo no painel dele." />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending || suspendReason.trim().length < 5}
                onClick={() => run(() => suspendVendorAction({ vendorId, reason: suspendReason }), () => setSuspendOpen(false))}
                className={cn(btn.secondary, DANGER)}
              >
                Suspender o fornecedor
              </button>
              <button type="button" onClick={() => setSuspendOpen(false)} className={cn(btn.quiet)}>
                Voltar
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => setSuspendOpen(true)} className={cn(btn.secondary, DANGER, "self-start")}>
            Suspender o fornecedor
          </button>
        )}
        <p className="text-sm text-tinta-suave">Toda ação aqui fica no Registro de atividades.</p>
      </section>
    </div>
  );
}
