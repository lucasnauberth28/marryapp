"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { saveCatalogPriceAction } from "@/actions/admin-planos-actions";
import { btn } from "@/components/landing/styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** "159,00", "1.249,90" ou "159" em centavos; NaN se não for um valor em reais. */
function parseReais(text: string): number {
  const clean = text.replace(/\s|R\$/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return Number.NaN;
  return Math.round(Number(clean) * 100);
}

/** Editar nome e preço de um plano ou módulo. O servidor valida de novo e grava no registro de atividades. */
export function CatalogEditForm({
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(currentName);
  const [price, setPrice] = useState((currentPriceCents / 100).toFixed(2).replace(".", ","));
  const [reason, setReason] = useState("");
  const [confirmBig, setConfirmBig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cents = parseReais(price);
  // Mudança grande (mais de 50% para cima ou para baixo) pede um aceite a mais
  const big = !free && Number.isFinite(cents) && currentPriceCents > 0 && Math.abs(cents - currentPriceCents) / currentPriceCents > 0.5;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await saveCatalogPriceAction({ key: itemKey, name, priceCents: cents, reason });
          if (res.success) {
            toast.success(res.message);
            router.replace("/admin/planos/catalogo", { scroll: false });
            router.refresh();
          } else setError(res.error);
        });
      }}
    >
      <h2 className="text-xl font-semibold leading-7 text-tinta">Editar {title}</h2>
      <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
      <Input
        label="Preço (R$)"
        inputMode="decimal"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        disabled={free}
        hint={free ? "Este plano é gratuito e continua gratuito." : undefined}
        error={!free && price && !Number.isFinite(cents) ? "Use o formato 159,00." : undefined}
        required
      />
      <Textarea label="Motivo da mudança" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} hint="Aparece no registro de atividades." required />
      <p className="flex items-start gap-2 rounded-xl bg-areia p-3 text-sm text-tinta">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>O novo preço vale só para compras novas. Quem já pagou mantém o valor e os recursos. Quem já gerou um Pix também paga o valor que viu.</span>
      </p>
      {big ? (
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[15px] text-tinta">
          <input type="checkbox" checked={confirmBig} onChange={(e) => setConfirmBig(e.target.checked)} className="mt-0.5 size-5 shrink-0 cursor-pointer accent-ameixa" />
          Confirmo a mudança de {brl.format(currentPriceCents / 100)} para {brl.format(cents / 100)}.
        </label>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={reason.trim().length < 5 || (!free && !Number.isFinite(cents)) || (big && !confirmBig)} loading={pending}>
          Salvar preço
        </Button>
        <Link href="/admin/planos/catalogo" scroll={false} className={cn(btn.quiet)}>
          Descartar
        </Link>
      </div>
    </form>
  );
}
