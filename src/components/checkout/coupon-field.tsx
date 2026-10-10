"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Loader2, TicketPercent, X } from "lucide-react";
import { previewSubscriptionPrice } from "@/actions/subscription-actions";
import { btn } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (cents: number) => brl.format(cents / 100);

export interface AppliedCoupon {
  code: string;
  /** Plano para o qual o cupom foi conferido. */
  planId: string;
  price: number;
  credit: number;
  discount: number;
  total: number;
}

interface CouponFieldProps {
  planId: string;
  modules?: string[];
  applied: AppliedCoupon | null;
  onChange: (applied: AppliedCoupon | null) => void;
  /** Texto do crédito do plano anterior, quando houver ("Crédito do Pro atual"). */
  creditLabel?: string;
}

/**
 * Campo de cupom do checkout: "Aplicar" confere o código no servidor e mostra o novo total.
 * O servidor confere de novo ao gerar o Pix; aqui é só a prévia.
 */
export function CouponField({ planId, modules, applied, onChange, creditLabel = "Crédito do plano atual" }: CouponFieldProps) {
  const inputId = useId();
  const errorId = useId();
  const [open, setOpen] = useState(Boolean(applied));
  const [code, setCode] = useState(applied?.code ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const check = (couponCode: string) =>
    previewSubscriptionPrice({ planId, modules, couponCode }).then((res) => {
      if (res.success && res.couponCode) {
        setError("");
        onChange({ code: res.couponCode, planId, price: res.price, credit: res.credit, discount: res.discount, total: res.total });
      } else {
        onChange(null);
        setError(res.success ? "Confira o código do cupom." : res.error);
      }
    });

  // Trocou de plano com um cupom aplicado: confere de novo para o plano escolhido.
  useEffect(() => {
    if (!applied || applied.planId === planId) return;
    let cancelled = false;
    previewSubscriptionPrice({ planId, modules, couponCode: applied.code }).then((res) => {
      if (cancelled) return;
      if (res.success && res.couponCode) {
        onChange({ code: res.couponCode, planId, price: res.price, credit: res.credit, discount: res.discount, total: res.total });
      } else {
        onChange(null);
        setError(res.success ? "Confira o código do cupom." : res.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [planId, modules, applied, onChange]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(btn.quiet, "-ml-3 min-h-11 self-start")}>
        <TicketPercent aria-hidden="true" className="size-4" />
        Tenho um cupom de desconto
      </button>
    );
  }

  if (applied && applied.planId === planId) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-sucesso/30 bg-sucesso-suave p-4" role="status">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[15px] text-tinta">
            Cupom <strong className="font-mono font-semibold">{applied.code}</strong> aplicado.
          </p>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setCode("");
            }}
            className="-mr-2 -mt-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-ameixa hover:bg-ameixa-suave"
          >
            <X aria-hidden="true" className="size-4" />
            Remover
          </button>
        </div>
        <dl className="flex flex-col gap-1 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt className="text-tinta-suave">Valor do plano</dt>
            <dd className="tabular-nums">{money(applied.price)}</dd>
          </div>
          {applied.credit > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-tinta-suave">{creditLabel}</dt>
              <dd className="tabular-nums">- {money(applied.credit)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-tinta-suave">Cupom {applied.code}</dt>
            <dd className="tabular-nums">- {money(applied.discount)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-sucesso/20 pt-1.5 font-semibold">
            <dt>Total no Pix</dt>
            <dd className="tabular-nums">{money(applied.total)}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const value = code.trim();
        if (!value) {
          setError("Digite o código do cupom.");
          return;
        }
        startTransition(() => check(value));
      }}
    >
      <label htmlFor={inputId} className="text-sm font-semibold text-tinta">
        Cupom de desconto
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (error) setError("");
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={30}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder="Ex.: NOIVOS10"
          className="min-h-11 w-full min-w-0 rounded-xl border border-linha-forte bg-papel px-3 font-mono text-[15px] uppercase text-tinta outline-none focus-visible:border-ameixa focus-visible:ring-2 focus-visible:ring-ameixa/25"
        />
        <button type="submit" disabled={isPending} className={cn(btn.secondary, "min-h-11 shrink-0")}>
          {isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
          Aplicar
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      ) : null}
    </form>
  );
}
