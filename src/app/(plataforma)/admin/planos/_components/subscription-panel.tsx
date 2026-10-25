"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConferirPix } from "../_assinatura/conferir-pix";
import { DadosDaAssinatura } from "../_assinatura/dados";
import { ESTILO_DO_BOTAO, type AssinaturaDoPainel } from "../_assinatura/tipos";

export type { AssinaturaDoPainel };

const CLASSE_DO_TOM = {
  aviso: "bg-aviso-suave text-aviso",
  sucesso: "bg-sucesso-suave text-sucesso",
  perigo: "bg-perigo-suave text-perigo",
  neutro: "bg-areia text-tinta",
} as const;

export function PainelDaAssinatura({ subscription: s, closeHref }: { subscription: AssinaturaDoPainel; closeHref: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Ao abrir (inclusive no celular, onde o painel fica abaixo da tabela), leva o foco e a tela até ele.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const account = s.companyName && s.accountType === "Fornecedor" ? s.companyName : s.accountName;

  return (
    <aside
      id="painel"
      aria-labelledby="painel-titulo"
      className="flex w-full min-w-0 scroll-mt-24 flex-col gap-4 rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6 lg:sticky lg:top-24 lg:w-[340px] lg:shrink-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <span className={cn("inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[13px] font-semibold leading-4", CLASSE_DO_TOM[s.status.tone])}>{s.status.label}</span>
          <h2 id="painel-titulo" ref={headingRef} tabIndex={-1} className="font-display text-[26px] leading-8 text-tinta outline-none">
            {account} · {s.planName}
          </h2>
          <p className="text-sm text-tinta-suave">
            {s.accountType}
            {s.companyName && s.accountType === "Fornecedor" ? ` · ${s.accountName}` : ""}
          </p>
        </div>
        <Link href={closeHref} scroll={false} className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-tinta-suave hover:bg-areia hover:text-tinta">
          <X className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Fechar painel</span>
        </Link>
      </div>

      <DadosDaAssinatura s={s} />

      {s.receiptHref ? (
        <Link href={s.receiptHref} className={cn(ESTILO_DO_BOTAO, "self-start border border-linha-forte bg-papel text-tinta hover:border-ameixa hover:bg-ameixa-suave")}>
          Ver recibo
        </Link>
      ) : null}

      {s.checkable ? <ConferirPix s={s} /> : null}
    </aside>
  );
}
