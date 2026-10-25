"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { confirmarAssinaturaManualmente } from "@/actions/subscription-admin-actions";
import { Button } from "@/components/ui/button";

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
        const result = await confirmarAssinaturaManualmente(subscriptionId);
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
      <Button type="button" size="sm" onClick={() => setAsking(true)}>
        Conferir o Pix
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-linha-forte bg-papel p-3">
      <p className="text-sm leading-5 text-tinta">O dinheiro já apareceu no extrato? Ao confirmar, o plano é liberado na hora.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={confirm} loading={pending}>
          Sim, o Pix chegou
        </Button>
        <Button type="button" size="sm" variant="quiet" onClick={() => setAsking(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      )}
    </div>
  );
}
