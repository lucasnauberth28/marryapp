"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { generateSubscriptionPix, verifySubscriptionPaymentStatus } from "@/actions/subscription-actions";
import { btn } from "@/components/landing/styles";
import { LoadingRegion } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QrFrame } from "@/components/ui/qr-frame";
import { QR_COLORS } from "@/lib/qr-colors";
import { cn } from "@/lib/utils";


import { formatarReais } from "@/lib/formatacao/dinheiro";
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
        <Button type="button" variant="outline" size="sm" loading={isPending} onClick={() => startTransition(create)} className="self-start rounded-[12px]">
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!charge) {
    return (
      // Esqueleto do cartão do Pix (preço, QR, validade, botão de copiar e "Já paguei"): nada pula quando o código chega.
      <LoadingRegion label="o código do Pix" className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-5 rounded-[16px] border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)]">
          <div className="flex w-full items-center justify-between gap-3">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <Skeleton className="size-[218px] rounded-[12px]" />
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-11 w-full rounded-[12px]" />
          <div className="flex w-full flex-col items-center gap-1">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-[12px]" />
      </LoadingRegion>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-5 rounded-[16px] border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)]">
        <div className="flex w-full items-baseline justify-between gap-3">
          <p className="font-semibold text-tinta">{planName}</p>
          <p className="font-num text-3xl text-tinta">{formatarReais(charge.amount)}</p>
        </div>
        <QrFrame className={cn("transition-opacity", expired && "opacity-30")}>
          <QRCodeSVG value={charge.payload} size={184} {...QR_COLORS} marginSize={2} aria-label="QR Code do Pix" role="img" />
        </QrFrame>
        <p aria-live="polite" className={cn("text-sm font-semibold tabular-nums", expired ? "text-perigo" : "text-tinta-suave")}>
          {expired
            ? "O código expirou."
            : `Válido por ${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`}
        </p>
        {expired ? (
          <Button type="button" variant="outline" loading={isPending} onClick={() => startTransition(create)} className="w-full rounded-[12px]">
            <RefreshCw aria-hidden="true" className="size-4" /> Gerar novo código
          </Button>
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
        <Button type="button" loading={isPending} onClick={checkNow} className="h-12 w-full rounded-[12px]">
          Já paguei
        </Button>
      ) : null}
      {message ? (
        <p role="status" className="text-center text-sm text-tinta-suave">
          {message}
        </p>
      ) : null}
    </div>
  );
}
