"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { salvarPrecoDoCatalogo } from "@/actions/admin-planos-actions";
import { estiloDoBotao } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";


import { formatarReais } from "@/lib/formatacao/dinheiro";
/** "159,00", "1.249,90" ou "159" em centavos; NaN se não for um valor em reais. */
function interpretarReais(text: string): number {
  const clean = text.replace(/\s|R\$/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return Number.NaN;
  return Math.round(Number(clean) * 100);
}

function useSalvarPreco(itemKey: string) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const salvar = (entrada: { name: string; priceCents: number; reason: string }) => {
    setError(null);
    startTransition(async () => {
      const res = await salvarPrecoDoCatalogo({ key: itemKey, ...entrada });
      if (res.success) {
        toast.success(res.message);
        router.replace("/admin/planos/catalogo", { scroll: false });
        router.refresh();
      } else setError(res.error);
    });
  };
  return { pending, error, salvar };
}

function BotoesDoFormulario({ desabilitado, carregando }: { desabilitado: boolean; carregando: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Botao type="submit" disabled={desabilitado} loading={carregando}>
        Salvar preço
      </Botao>
      <Link href="/admin/planos/catalogo" scroll={false} className={cn(estiloDoBotao.quiet)}>
        Descartar
      </Link>
    </div>
  );
}

function AvisoDoPrecoNovo() {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-areia p-3 text-sm text-tinta">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>O novo preço vale só para compras novas. Quem já pagou mantém o valor e os recursos. Quem já gerou um Pix também paga o valor que viu.</span>
    </p>
  );
}

function ConfirmacaoDaMudancaGrande({ marcada, aoMudar, de, para }: { marcada: boolean; aoMudar: (v: boolean) => void; de: number; para: number }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[15px] text-tinta">
      <input type="checkbox" checked={marcada} onChange={(e) => aoMudar(e.target.checked)} className="mt-0.5 size-5 shrink-0 cursor-pointer accent-ameixa" />
      Confirmo a mudança de {formatarReais(de)} para {formatarReais(para)}.
    </label>
  );
}

/** Editar nome e preço de um plano ou módulo. O servidor valida de novo e grava no registro de atividades. */
export function FormularioDeEdicaoDoCatalogo({
  itemKey,
  title,
  currentName,
  currentPriceCents,
  free,
}: {
  itemKey: string;
  title: string;
  currentName: string;
  currentPriceCents: number;
  /** Plano gratuito: o preço fica em zero, só o nome muda. */
  free: boolean;
}) {
  const { pending, error, salvar } = useSalvarPreco(itemKey);
  const [name, setName] = useState(currentName);
  const [price, setPrice] = useState((currentPriceCents / 100).toFixed(2).replace(".", ","));
  const [reason, setReason] = useState("");
  const [confirmBig, setConfirmBig] = useState(false);

  const cents = interpretarReais(price);
  // Mudança grande (mais de 50% para cima ou para baixo) pede um aceite a mais
  const big = !free && Number.isFinite(cents) && currentPriceCents > 0 && Math.abs(cents - currentPriceCents) / currentPriceCents > 0.5;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        salvar({ name, priceCents: cents, reason });
      }}
    >
      <h2 className="text-xl font-semibold leading-7 text-tinta">Editar {title}</h2>
      <Entrada label="Nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
      <Entrada
        label="Preço (R$)"
        inputMode="decimal"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        disabled={free}
        hint={free ? "Este plano é gratuito e continua gratuito." : undefined}
        error={!free && price && !Number.isFinite(cents) ? "Use o formato 159,00." : undefined}
        required
      />
      <AreaDeTexto label="Motivo da mudança" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} hint="Aparece no registro de atividades." required />
      <AvisoDoPrecoNovo />
      {big ? <ConfirmacaoDaMudancaGrande marcada={confirmBig} aoMudar={setConfirmBig} de={currentPriceCents} para={cents} /> : null}
      {error ? (
        <p role="alert" className="rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
          {error}
        </p>
      ) : null}
      <BotoesDoFormulario desabilitado={reason.trim().length < 5 || (!free && !Number.isFinite(cents)) || (big && !confirmBig)} carregando={pending} />
    </form>
  );
}
