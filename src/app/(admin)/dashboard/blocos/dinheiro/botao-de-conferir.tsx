"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { aprovarTransacaoPix } from "@/actions/financas/transacoes";
import { estiloDaLinhaDeBotoes } from "../../ui";

/** Selo "A" do Pix conferido (o mesmo círculo ameixa do logotipo), 22px. */
export function SeloDoPix({ stamp = false }: { stamp?: boolean }) {
  return (
    <span role="img" aria-label="Conferido" className={`inline-grid size-[22px] shrink-0 place-items-center ${stamp ? "motion-safe:animate-[carimbo_340ms_cubic-bezier(0.16,1,0.3,1)_both]" : ""}`}>
      <svg viewBox="4 26 56 56" className="size-[22px]" aria-hidden="true">
        <circle cx="32" cy="54" r="27" fill="var(--color-ameixa)" />
        <circle cx="32" cy="54" r="23.5" fill="none" stroke="var(--color-papel)" strokeOpacity=".55" strokeWidth="1.2" />
        <path
          fill="var(--color-papel)"
          transform="translate(32 54) scale(.62) translate(-32 -54)"
          d="M16.87 74 39.81 34.25H42.39L47.32 74H40L36.69 41.56L18.04 74ZM13.01 74V72.99H24.45V74ZM34.02 74V72.99H50.99V74ZM24.91 61.78V60.77H42.11V61.78Z"
        />
      </svg>
    </span>
  );
}

/**
 * "Conferir" um Pix de presente, na própria linha do extrato. Usa a mesma ação de Finanças (approvePixTransaction):
 * a regra de conferência é uma só (o Pix pendente vira aprovado e o presente fica pago).
 */
export function BotaoDeConferir({ transactionId, giftId, who }: { transactionId: string; giftId: string; who: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <span className="inline-flex items-center gap-2 text-[13px] text-tinta-suave">
        <SeloDoPix stamp />
        Conferido
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending || undefined}
      aria-label={`Conferir o Pix de ${who}`}
      className={estiloDaLinhaDeBotoes}
      onClick={() =>
        startTransition(async () => {
          const result = await aprovarTransacaoPix(transactionId, giftId);
          if (result.success) {
            setDone(true);
            toast.success("Pix conferido. O presente foi marcado como pago.");
            router.refresh();
          } else {
            toast.error(result.error || "Não deu para conferir o Pix. Tente de novo.");
          }
        })
      }
    >
      {pending ? "Conferindo" : "Conferir"}
    </button>
  );
}
