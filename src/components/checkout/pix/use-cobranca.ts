"use client";

// A cobrança Pix da assinatura: gera ao abrir, conta o tempo, confere o pagamento e copia o código.
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { gerarPixDaAssinatura, verificarSituacaoDoPagamentoDaAssinatura } from "@/actions/subscription-actions";

export type CobrancaDoPix = { subscriptionId: string; payload: string; expiresAt: number; amount: number; isDynamic: boolean };

interface Entrada {
  planId: string;
  modules?: string[];
  couponCode?: string | null;
  onPaid: () => void;
}

/** Gera a cobrança ao abrir. O ref evita duas cobranças no modo estrito do React em desenvolvimento. */
function useGerarCobranca({ planId, modules, couponCode }: Omit<Entrada, "onPaid">, startTransition: (fn: () => Promise<void>) => void) {
  const [charge, setCharge] = useState<CobrancaDoPix | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const create = useCallback(async () => {
    setError("");
    setMessage("");
    const res = await gerarPixDaAssinatura({ planId, modules, couponCode });
    if (res.success && res.pixPayload && res.subscriptionId) {
      setCharge({ subscriptionId: res.subscriptionId, payload: res.pixPayload, expiresAt: res.expiresAt ?? Date.now(), amount: res.amount ?? 0, isDynamic: Boolean(res.isDynamic) });
      setNow(Date.now());
    } else {
      setError(res.error || "Não conseguimos gerar o Pix agora.");
    }
  }, [planId, modules, couponCode]);

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startTransition(create);
  }, [create, startTransition]);

  return { charge, error, message, setMessage, now, setNow, create };
}

/** Enquanto vale: relógio de 1 s e, no Pix dinâmico, confere o pagamento a cada 5 s (o estático não tem confirmação automática). */
function useConferirAteConfirmar(charge: CobrancaDoPix | null, expired: boolean, markPaid: () => void, setNow: (n: number) => void) {
  useEffect(() => {
    if (!charge || expired) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = charge.isDynamic
      ? setInterval(async () => {
          const res = await verificarSituacaoDoPagamentoDaAssinatura(charge.subscriptionId);
          if (res.paid) markPaid();
        }, 5000)
      : null;
    return () => {
      clearInterval(tick);
      if (poll) clearInterval(poll);
    };
  }, [charge, expired, markPaid, setNow]);
}

export function useCobrancaDoPix({ planId, modules, couponCode, onPaid }: Entrada) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const paidRef = useRef(false);
  const { charge, error, message, setMessage, now, setNow, create } = useGerarCobranca({ planId, modules, couponCode }, startTransition);

  const markPaid = useCallback(() => {
    if (paidRef.current) return;
    paidRef.current = true;
    onPaid();
  }, [onPaid]);

  const secondsLeft = charge ? Math.max(0, Math.floor((charge.expiresAt - now) / 1000)) : 0;
  const expired = !!charge && secondsLeft === 0;

  useConferirAteConfirmar(charge, expired, markPaid, setNow);

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
      const res = await verificarSituacaoDoPagamentoDaAssinatura(charge.subscriptionId);
      if (res.paid) return markPaid();
      setMessage(
        charge.isDynamic
          ? res.message || "Ainda não recebemos a confirmação. Ela costuma chegar em alguns segundos."
          : "Recebemos seu aviso. Este Pix é conferido pela nossa equipe e o plano é liberado em até 1 dia útil.",
      );
    });

  return { charge, error, message, copied, isPending, secondsLeft, expired, copy, checkNow, regenerate: () => startTransition(create) };
}
