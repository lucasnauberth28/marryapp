"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { generateSubscriptionPix, verifySubscriptionPaymentStatus } from "@/actions/subscription-actions";
import { btn } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface SubscriptionPixProps {
  planId: string;
  modules?: string[];
  planName: string;
  /** Cupom já conferido na prévia; o servidor confere de novo ao gerar o Pix. */
  couponCode?: string | null;
  /** Chamado uma vez, quando o pagamento é confirmado (o plano já foi ativado no servidor). */
  onPaid: () => void;
}

type Charge = { subscriptionId: string; payload: string; expiresAt: number; amount: number; isDynamic: boolean };

/**
 * Cobrança Pix de um plano: gera o código para a conta logada, mostra QR e copia e cola,
 * conta os 10 minutos e confere o pagamento sozinha a cada 5 segundos.
 */
export function SubscriptionPix({ planId, modules, planName, couponCode, onPaid }: SubscriptionPixProps) {
  const [charge, setCharge] = useState<Charge | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const paidRef = useRef(false);

  const markPaid = useCallback(() => {
    if (paidRef.current) return;
    paidRef.current = true;
    onPaid();
  }, [onPaid]);

  const create = useCallback(async () => {
    setError("");
    setMessage("");
    const res = await generateSubscriptionPix({ planId, modules, couponCode });
    if (res.success && res.pixPayload && res.subscriptionId) {
      setCharge({
        subscriptionId: res.subscriptionId,
        payload: res.pixPayload,
        expiresAt: res.expiresAt ?? Date.now(),
        amount: res.amount ?? 0,
        isDynamic: Boolean(res.isDynamic),
      });
      setNow(Date.now());
    } else {
      setError(res.error || "Não conseguimos gerar o Pix agora.");
    }
  }, [planId, modules, couponCode]);

  // Gera a cobrança ao abrir. O ref evita duas cobranças no modo estrito do React em desenvolvimento.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startTransition(create);
  }, [create]);

  const secondsLeft = charge ? Math.max(0, Math.floor((charge.expiresAt - now) / 1000)) : 0;
  const expired = !!charge && secondsLeft === 0;

  useEffect(() => {
    if (!charge || expired) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    // O Pix estático não tem confirmação automática: não adianta consultar.
    const poll = charge.isDynamic
      ? setInterval(async () => {
          const res = await verifySubscriptionPaymentStatus(charge.subscriptionId);
          if (res.paid) markPaid();
        }, 5000)
      : null;
    return () => {
      clearInterval(tick);
      if (poll) clearInterval(poll);
    };
  }, [charge, expired, markPaid]);

  const copy = async () => {
    if (!charge) return;
    try {
      await navigator.clipboard.writeText(charge.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setMessage("Não deu para copiar automaticamente. Selecione o código abaixo e copie.");
    }
  };

  const checkNow = () =>
    startTransition(async () => {
      if (!charge) return;
      const res = await verifySubscriptionPaymentStatus(charge.subscriptionId);
      if (res.paid) markPaid();
      else
        setMessage(
          charge.isDynamic
            ? res.message || "Ainda não recebemos a confirmação. Ela costuma chegar em alguns segundos."
            : "Recebemos seu aviso. Este Pix é conferido pela nossa equipe e o plano é liberado em até 1 dia útil.",
        );
    });

  if (error && !charge) {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-[16px] border border-perigo/25 bg-perigo-suave p-5 text-sm font-semibold text-perigo">
        {error}
        <button type="button" onClick={() => startTransition(create)} className={cn(btn.secondary, btn.sm, "self-start")}>
          Tentar de novo
        </button>
      </div>
    );
  }

  if (!charge) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 rounded-[16px] border border-linha bg-papel text-tinta-suave">
        <Loader2 aria-hidden="true" className="size-5 animate-spin" /> Gerando o Pix…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-5 rounded-[16px] border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)]">
        <div className="flex w-full items-baseline justify-between gap-3">
          <p className="font-semibold text-tinta">{planName}</p>
          <p className="font-display text-3xl text-tinta">{brl.format(charge.amount / 100)}</p>
        </div>
        <div className={cn("rounded-[12px] border border-linha bg-white p-4 transition-opacity", expired && "opacity-30")}>
          <QRCodeSVG value={charge.payload} size={184} fgColor="#231C24" aria-label="QR Code do Pix" role="img" />
        </div>
        <p aria-live="polite" className={cn("text-sm font-semibold tabular-nums", expired ? "text-perigo" : "text-tinta-suave")}>
          {expired
            ? "O código expirou."
            : `Válido por ${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`}
        </p>
        {expired ? (
          <button type="button" onClick={() => startTransition(create)} disabled={isPending} className={cn(btn.secondary, btn.block)}>
            <RefreshCw aria-hidden="true" className={cn("size-4", isPending && "animate-spin")} /> Gerar novo código
          </button>
        ) : (
          <button type="button" onClick={copy} className={cn(btn.secondary, btn.block)}>
            {copied ? <Check aria-hidden="true" className="size-4 text-sucesso" /> : <Copy aria-hidden="true" className="size-4" />}
            {copied ? "Código copiado" : "Copiar código Pix"}
          </button>
        )}
        <p className="text-center text-sm leading-5 text-tinta-suave">
          Abra o app do banco, escolha Pix copia e cola e cole o código.
          {charge.isDynamic ? " Conferimos o pagamento sozinhos." : null}
        </p>
      </div>
      {!expired ? (
        <button type="button" onClick={checkNow} disabled={isPending} className={cn(btn.primary, btn.block, "min-h-12")}>
          {isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
          Já paguei
        </button>
      ) : null}
      {message ? (
        <p role="status" className="text-center text-sm text-tinta-suave">
          {message}
        </p>
      ) : null}
    </div>
  );
}
