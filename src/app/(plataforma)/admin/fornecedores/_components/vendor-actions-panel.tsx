"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import {
  aprovarFornecedorComoAdmin,
  concederPlanoAoFornecedor,
  recusarFornecedorComoAdmin,
  definirFornecedorEmDestaque,
  suspenderFornecedor,
  reativarFornecedor,
  type ResultadoDaAcaoDoFornecedor,
} from "@/actions/admin-fornecedores-actions";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DIAS_DE_CONCESSAO, MOTIVOS_DE_RECUSA, mensagemDeRecusaPara } from "@/lib/platform/vendor-admin";
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
  const [reasonKey, setReasonKey] = useState<string>(MOTIVOS_DE_RECUSA[0].value);
  const [message, setMessage] = useState<string>(MOTIVOS_DE_RECUSA[0].message);
  const [tier, setTier] = useState<"PRO" | "MASTER">("PRO");
  const [days, setDays] = useState("30");
  const [grantReason, setGrantReason] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Qual ação está rodando: só o botão clicado mostra o spinner, os outros ficam desabilitados
  const [running, setRunning] = useState<string | null>(null);

  const run = (key: string, action: () => Promise<ResultadoDaAcaoDoFornecedor>, after?: () => void) => {
    setError(null);
    setRunning(key);
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
        <Button type="button" disabled={pending} loading={pending && running === "approve"} onClick={() => run("approve", () => aprovarFornecedorComoAdmin({ vendorId }))} className="self-start">
          <Check className="size-4" aria-hidden="true" /> Aprovar
        </Button>
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
              setMessage(mensagemDeRecusaPara(e.target.value));
            }}
          >
            {MOTIVOS_DE_RECUSA.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </NativeSelect>
          <Textarea label="Mensagem para o fornecedor" rows={4} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} hint="Ele lê esta mensagem no painel dele." />
          <Button
            type="button"
            variant="outline"
            disabled={message.trim().length < 10 || pending}
            loading={pending && running === "reject"}
            onClick={() => run("reject", () => recusarFornecedorComoAdmin({ vendorId, message }))}
            className={cn(DANGER, "self-start")}
          >
            Recusar com motivo
          </Button>
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
              onCheckedChange={(checked) => run("feature", () => definirFornecedorEmDestaque({ vendorId, featured: checked }))}
            />
          </div>

          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              run("grant", () => concederPlanoAoFornecedor({ vendorId, tier, days: Number(days), reason: grantReason }), () => setGrantReason(""));
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <NativeSelect label="Conceder plano" alwaysFloat value={tier} onChange={(e) => setTier(e.target.value as "PRO" | "MASTER")}>
                <option value="PRO">Pro</option>
                <option value="MASTER">Master</option>
              </NativeSelect>
              <NativeSelect label="Por quantos dias" alwaysFloat value={days} onChange={(e) => setDays(e.target.value)}>
                {DIAS_DE_CONCESSAO.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Textarea label="Motivo da cortesia" rows={2} maxLength={500} value={grantReason} onChange={(e) => setGrantReason(e.target.value)} hint="Fica no registro de atividades. Não gera cobrança." />
            <Button type="submit" variant="outline" disabled={grantReason.trim().length < 5 || pending} loading={pending && running === "grant"} className="self-start">
              Conceder plano
            </Button>
          </form>
        </section>
      ) : null}

      <section aria-label="Suspender" className="flex flex-col gap-3 border-t border-linha pt-4">
        {suspended ? (
          <>
            <p className="text-sm text-tinta-suave">Este fornecedor está suspenso e fora da vitrine.</p>
            <Button type="button" variant="outline" disabled={pending} loading={pending && running === "unsuspend"} onClick={() => run("unsuspend", () => reativarFornecedor({ vendorId }))} className="self-start">
              Reativar o fornecedor
            </Button>
          </>
        ) : suspendOpen ? (
          <>
            <Textarea label="Motivo da suspensão" rows={2} maxLength={500} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} hint="O fornecedor vê este motivo no painel dele." />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={suspendReason.trim().length < 5 || pending}
                loading={pending && running === "suspend"}
                onClick={() => run("suspend", () => suspenderFornecedor({ vendorId, reason: suspendReason }), () => setSuspendOpen(false))}
                className={DANGER}
              >
                Suspender o fornecedor
              </Button>
              <Button type="button" variant="quiet" onClick={() => setSuspendOpen(false)} disabled={pending}>
                Voltar
              </Button>
            </div>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={() => setSuspendOpen(true)} className={cn(DANGER, "self-start")}>
            Suspender o fornecedor
          </Button>
        )}
        <p className="text-sm text-tinta-suave">Toda ação aqui fica no Registro de atividades.</p>
      </section>
    </div>
  );
}
