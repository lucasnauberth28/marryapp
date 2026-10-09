"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { confirmSubscriptionManually, rejectSubscription } from "@/actions/subscription-admin-actions";
import { cn } from "@/lib/utils";

export interface PanelSubscription {
  id: string;
  accountName: string;
  companyName: string | null;
  accountType: "Casal" | "Fornecedor";
  planName: string;
  /** Já formatado em reais. */
  amount: string;
  gatewayId: string | null;
  createdAt: string;
  paidAt: string | null;
  periodEnd: string | null;
  email: string;
  method: string;
  status: { tone: "aviso" | "sucesso" | "perigo" | "neutro"; label: string };
  /** Pix estático pendente: pode ser confirmado ou recusado à mão. */
  checkable: boolean;
}

const TONE_CLASS = {
  aviso: "bg-aviso-suave text-aviso",
  sucesso: "bg-sucesso-suave text-sucesso",
  perigo: "bg-perigo-suave text-perigo",
  neutro: "bg-areia text-tinta",
} as const;

const BUTTON =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export function SubscriptionPanel({ subscription: s, closeHref }: { subscription: PanelSubscription; closeHref: string }) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [seen, setSeen] = useState(false);
  const [confirmingReject, setConfirmingReject] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"confirm" | "reject" | null>(null);

  // Ao abrir (inclusive no celular, onde o painel fica abaixo da tabela), leva o foco e a tela até ele.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const run = (kind: "confirm" | "reject") => {
    setError("");
    setPendingAction(kind);
    startTransition(async () => {
      const res = kind === "confirm" ? await confirmSubscriptionManually(s.id) : await rejectSubscription(s.id);
      if (res.success) {
        toast.success(kind === "confirm" ? `Plano ${s.planName} liberado para ${s.accountName}.` : "Cobrança marcada como não recebida.");
        setConfirmingReject(false);
        router.refresh();
      } else {
        setError(res.error);
      }
      setPendingAction(null);
    });
  };

  const account = s.companyName && s.accountType === "Fornecedor" ? s.companyName : s.accountName;

  return (
    <aside
      id="painel"
      aria-labelledby="painel-titulo"
      className="flex w-full min-w-0 scroll-mt-24 flex-col gap-4 rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6 lg:sticky lg:top-24 lg:w-[340px] lg:shrink-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <span className={cn("inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[13px] font-semibold leading-4", TONE_CLASS[s.status.tone])}>
            {s.status.label}
          </span>
          <h2 id="painel-titulo" ref={headingRef} tabIndex={-1} className="font-display text-[26px] leading-8 text-tinta outline-none">
            {account} · {s.planName}
          </h2>
          <p className="text-sm text-tinta-suave">
            {s.accountType}
            {s.companyName && s.accountType === "Fornecedor" ? ` · ${s.accountName}` : ""}
          </p>
        </div>
        <Link
          href={closeHref}
          scroll={false}
          className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-tinta-suave hover:bg-areia hover:text-tinta"
        >
          <X className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Fechar painel</span>
        </Link>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
        <dt className="text-tinta-suave">Valor</dt>
        <dd className="font-semibold tabular-nums text-tinta">{s.amount}</dd>
        <dt className="text-tinta-suave">Identificador</dt>
        <dd className="break-all font-mono text-sm text-tinta">{s.gatewayId ?? "—"}</dd>
        <dt className="text-tinta-suave">Gerado em</dt>
        <dd className="text-tinta">{s.createdAt}</dd>
        {s.paidAt ? (
          <>
            <dt className="text-tinta-suave">Pago em</dt>
            <dd className="text-tinta">{s.paidAt}</dd>
          </>
        ) : null}
        {s.periodEnd ? (
          <>
            <dt className="text-tinta-suave">Vale até</dt>
            <dd className="text-tinta">{s.periodEnd}</dd>
          </>
        ) : null}
        <dt className="text-tinta-suave">Forma</dt>
        <dd className="text-tinta">{s.method}</dd>
        <dt className="text-tinta-suave">E-mail</dt>
        <dd className="break-all text-tinta">{s.email}</dd>
      </dl>

      {s.checkable ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run("confirm");
          }}
        >
          <p className="text-sm text-tinta-suave">
            Procure no extrato da conta um Pix de {s.amount} com este identificador na descrição. Só confirme depois de ver o crédito.
          </p>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[15px] text-tinta">
            <input
              type="checkbox"
              required
              checked={seen}
              onChange={(e) => setSeen(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-ameixa"
            />
            Vi o crédito de {s.amount} no extrato
          </label>

          {error ? (
            <p role="alert" className="rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
              {error}
            </p>
          ) : null}

          {confirmingReject ? (
            <div role="group" aria-label="Confirmar que o Pix não foi encontrado" className="flex flex-col gap-3 rounded-xl border border-linha bg-linho p-4">
              <p className="text-sm text-tinta">
                Marcar como não recebido? A cobrança deixa de valer e {s.accountName} precisa gerar um novo Pix.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => run("reject")}
                  disabled={isPending}
                  className={cn(BUTTON, "bg-perigo text-papel hover:bg-perigo/90")}
                >
                  {pendingAction === "reject" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  Sim, não recebi
                </button>
                <button type="button" onClick={() => setConfirmingReject(false)} disabled={isPending} className={cn(BUTTON, "text-ameixa hover:bg-ameixa-suave")}>
                  Voltar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={isPending} className={cn(BUTTON, "bg-ameixa text-on-ameixa hover:bg-ameixa-hover")}>
                {pendingAction === "confirm" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Confirmar e liberar o plano
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReject(true)}
                disabled={isPending}
                className={cn(BUTTON, "text-ameixa hover:bg-ameixa-suave")}
              >
                Não encontrei
              </button>
            </div>
          )}
        </form>
      ) : null}
    </aside>
  );
}
