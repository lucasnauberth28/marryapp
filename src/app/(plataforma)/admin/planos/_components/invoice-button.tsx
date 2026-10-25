"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { marcarNotaComoEmitida } from "@/actions/admin-planos-actions";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";

/** "Já emiti": marca a nota fiscal do pagamento, com o número se quiser. */
export function BotaoDeNota({ subscriptionId, payer }: { subscriptionId: string; payer: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Botao type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Já emiti
        <span className="sr-only"> a nota de {payer}</span>
      </Botao>
    );
  }
  return (
    <form
      className="flex flex-wrap items-start gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await marcarNotaComoEmitida({ subscriptionId, number });
          if (res.success) {
            toast.success(res.message);
            router.refresh();
          } else setError(res.error);
        });
      }}
    >
      <Entrada label="Número da nota (opcional)" value={number} onChange={(e) => setNumber(e.target.value)} maxLength={40} error={error ?? undefined} fieldClassName="min-w-[200px]" />
      <Botao type="submit" size="sm" loading={pending} className="mt-1">
        Confirmar
      </Botao>
      <Botao type="button" variant="quiet" size="sm" onClick={() => setOpen(false)} disabled={pending} className="mt-1">
        Voltar
      </Botao>
    </form>
  );
}
