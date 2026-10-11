"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { markDomainRenewedAction } from "@/actions/domain-admin-actions";
import { btn } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

/** "Marcar como renovado": a renovação é manual no Registro.br; o Aceito só registra o novo vencimento. */
export function RenewalButton({ orderId, domain }: { orderId: string; domain: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={cn(btn.secondary, btn.sm)}
      onClick={() =>
        startTransition(async () => {
          const res = await markDomainRenewedAction(orderId);
          if (res.success) {
            toast.success(res.message);
            router.refresh();
          } else toast.error(res.error);
        })
      }
    >
      Marcar como renovado
      <span className="sr-only"> o domínio {domain}</span>
    </button>
  );
}
