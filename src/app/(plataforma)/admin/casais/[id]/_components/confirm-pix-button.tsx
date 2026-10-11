"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { confirmSubscriptionManually } from "@/actions/subscription-admin-actions";
import { btn } from "@/components/landing/styles";

/** "Conferir o Pix": confirma o Pix estático visto no extrato (a mesma ação de Assinaturas) e libera o plano. */
export function ConfirmPixButton({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  function confirm() {
    startTransition(async () => {
      setError(null);
      try {
        const result = await confirmSubscriptionManually(subscriptionId);
        if (result.success) {
          toast.success("Pix conferido. O plano do casal foi liberado.");
          setAsking(false);
          router.refresh();
        } else setError(result.error);
      } catch {
        setError("Não foi possível concluir agora. Tente de novo.");
      }
    });
  }

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={`${btn.primary} ${btn.sm}`}>
        Conferir o Pix
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-linha-forte bg-papel p-3">
      <p className="text-sm leading-5 text-tinta">O dinheiro já apareceu no extrato? Ao confirmar, o plano é liberado na hora.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={confirm} disabled={pending} className={`${btn.primary} ${btn.sm}`}>
          {pending ? "Conferindo..." : "Sim, o Pix chegou"}
        </button>
        <button type="button" onClick={() => setAsking(false)} disabled={pending} className={`${btn.quiet} ${btn.sm}`}>
          Cancelar
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      )}
    </div>
  );
}
