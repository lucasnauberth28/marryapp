"use client";

import { useRouter } from "next/navigation";
import { decidirPixDePresente } from "@/actions/casais-admin/presentes";
import { Botao } from "@/components/ui/button";
import { useAcaoDoCasal } from "../../_components/use-casal-action";

/** Confirmar ou recusar um Pix de presente depois de olhar o extrato da conta do Aceito. */
export function AcoesDoPixDePresente({ weddingId, transactionId, quem }: { weddingId: string; transactionId: string; quem: string }) {
  const router = useRouter();
  const { pending, error, run } = useAcaoDoCasal();
  const decidir = (decisao: "confirmar" | "recusar") => run(() => decidirPixDePresente({ weddingId, transactionId, decisao }), () => router.refresh());
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Botao type="button" size="sm" variant="outline" disabled={pending} onClick={() => decidir("recusar")} aria-label={`Recusar o Pix de ${quem}`}>
          Não caiu
        </Botao>
        <Botao type="button" size="sm" loading={pending} onClick={() => decidir("confirmar")} aria-label={`Confirmar o Pix de ${quem}`}>
          Confirmar
        </Botao>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      ) : null}
    </div>
  );
}
