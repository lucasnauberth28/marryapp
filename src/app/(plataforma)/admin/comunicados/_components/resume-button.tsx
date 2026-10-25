"use client";

import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/button";
import { retomarComunicado } from "@/actions/admin-comunicados-actions";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";

/** Retomar um envio que ficou "Enviando" (o servidor foi interrompido): quem já recebeu não recebe de novo. */
export function BotaoDeRetomar({ id }: { id: string }) {
  const router = useRouter();
  const { pending, run } = useAcaoDoAdmin();
  return (
    <Botao type="button" variant="quiet" size="sm" loading={pending} onClick={() => run(() => retomarComunicado({ id }), () => router.refresh())}>
      Retomar envio
    </Botao>
  );
}
