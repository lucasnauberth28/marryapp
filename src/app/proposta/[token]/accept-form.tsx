"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2 } from "lucide-react";
import { acceptLeadProposal } from "@/actions/partner-vendor-actions";
import { cn } from "@/lib/utils";
import { TOKEN_CARD } from "@/components/public/token-page-shell";

const INPUT =
  "min-h-11 w-full rounded-xl border border-linha-forte bg-papel px-4 text-base text-tinta placeholder:text-tinta-suave/80 disabled:opacity-60";

export function AcceptProposalForm({ token, companyName }: { token: string; companyName: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await acceptLeadProposal({ token, fullName, agreed });
      if (res.success) {
        setDone(res.name);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (done) {
    return (
      <section role="status" className="flex flex-col gap-2 rounded-2xl bg-sucesso-suave p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-sucesso">
          <BadgeCheck aria-hidden="true" className="size-5" />
          Proposta aceita!
        </h2>
        <p>Obrigado, {done}. O aceite foi registrado.</p>
        <p>{companyName} vai entrar em contato para o contrato.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="aceitar-titulo" className={cn(TOKEN_CARD, "flex flex-col gap-4")}>
      <div className="flex flex-col gap-0.5">
        <h2 id="aceitar-titulo" className="text-lg font-semibold">
          Aceitar proposta
        </h2>
        <p className="text-sm text-tinta-suave">
          Seu nome, a data e a hora do aceite ficam registrados como confirmação. O contrato é combinado depois, direto com o
          fornecedor.
        </p>
      </div>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4" aria-describedby={error ? "aceitar-erro" : undefined}>
        {error ? (
          <p id="aceitar-erro" role="alert" className="rounded-xl bg-perigo-suave px-4 py-3 text-sm font-medium text-perigo">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="aceitar-nome" className="text-sm font-semibold text-tinta">
            Nome completo
          </label>
          <input
            id="aceitar-nome"
            name="fullName"
            required
            autoComplete="name"
            maxLength={120}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={INPUT}
          />
        </div>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[15px]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-ameixa)]"
          />
          <span>Li e aceito esta proposta</span>
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ameixa px-5 text-base font-semibold text-on-ameixa transition-colors hover:bg-ameixa-hover disabled:pointer-events-none disabled:opacity-60"
        >
          {isPending ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : null}
          {isPending ? "Registrando…" : "Aceitar proposta"}
        </button>
      </form>
    </section>
  );
}
