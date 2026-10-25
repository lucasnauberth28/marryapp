"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { aceitarPropostaDoPedido } from "@/actions/partner-vendor-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CARTAO_DA_PAGINA_COM_TOKEN } from "@/components/public/token-page-shell";


export function FormularioDeAceiteDaProposta({ token, companyName }: { token: string; companyName: string }) {
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
      const res = await aceitarPropostaDoPedido({ token, fullName, agreed });
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
    <section aria-labelledby="aceitar-titulo" className={cn(CARTAO_DA_PAGINA_COM_TOKEN, "flex flex-col gap-4")}>
      <div className="flex flex-col gap-0.5">
        <h2 id="aceitar-titulo" className="text-lg font-semibold">
          Aceitar proposta
        </h2>
        <p className="text-sm text-tinta-suave">
          Seu nome, a data e a hora do aceite ficam registrados como confirmação. O contrato é combinado depois, direto com o
          fornecedor.
        </p>
      </div>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5" aria-describedby={error ? "aceitar-erro" : undefined}>
        {error ? (
          <p id="aceitar-erro" role="alert" className="rounded-xl bg-perigo-suave px-4 py-3 text-sm font-medium text-perigo">
            {error}
          </p>
        ) : null}
        <Input
          id="aceitar-nome"
          label="Nome completo"
          name="fullName"
          required
          autoComplete="name"
          maxLength={120}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[15px]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-ameixa)]"
          />
          <span>Li e aceito esta proposta</span>
        </label>
        <Button type="submit" loading={isPending} className="h-12">
          Aceitar proposta
        </Button>
      </form>
    </section>
  );
}
