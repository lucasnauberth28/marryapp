"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { markInvoiceIssuedAction } from "@/actions/admin-planos-actions";
import { btn } from "@/components/landing/styles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** "Já emiti": marca a nota fiscal do pagamento, com o número se quiser. */
export function InvoiceButton({ subscriptionId, payer }: { subscriptionId: string; payer: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(btn.secondary, btn.sm)}>
        Já emiti
        <span className="sr-only"> a nota de {payer}</span>
      </button>
    );
  }
  return (
    <form
      className="flex flex-wrap items-start gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await markInvoiceIssuedAction({ subscriptionId, number });
          if (res.success) {
            toast.success(res.message);
            router.refresh();
          } else setError(res.error);
        });
      }}
    >
      <Input label="Número da nota (opcional)" value={number} onChange={(e) => setNumber(e.target.value)} maxLength={40} error={error ?? undefined} fieldClassName="min-w-[200px]" />
      <button type="submit" disabled={pending} className={cn(btn.primary, btn.sm, "mt-1")}>
        Confirmar
      </button>
      <button type="button" onClick={() => setOpen(false)} className={cn(btn.quiet, btn.sm, "mt-1")}>
        Voltar
      </button>
    </form>
  );
}
