"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { marcarDominioComoRenovado } from "@/actions/dominio-admin/conexao";
import { Botao } from "@/components/ui/button";

/** "Marcar como renovado": a renovação é manual no Registro.br; o Aceito só registra o novo vencimento. */
export function BotaoDeRenovacao({ orderId, domain }: { orderId: string; domain: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Botao
      type="button"
      variant="outline"
      size="sm"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await marcarDominioComoRenovado(orderId);
          if (res.success) {
            toast.success(res.message);
            router.refresh();
          } else toast.error(res.error);
        })
      }
    >
      Marcar como renovado
      <span className="sr-only"> o domínio {domain}</span>
    </Botao>
  );
}
