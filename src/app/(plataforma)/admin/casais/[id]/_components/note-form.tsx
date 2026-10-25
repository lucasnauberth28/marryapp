"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adicionarNotaAoCasamento } from "@/actions/admin-casais-actions";
import { Botao } from "@/components/ui/button";
import { AreaDeTexto } from "@/components/ui/textarea";
import { useAcaoDoCasal } from "../../_components/use-casal-action";

/** "Nova nota" interna: só a equipe vê. */
export function FormularioDeNota({ weddingId }: { weddingId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const { pending, error, run } = useAcaoDoCasal();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => adicionarNotaAoCasamento({ weddingId, body }), () => {
          setBody("");
          router.refresh();
        });
      }}
    >
      <AreaDeTexto label="Nova nota" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={3} />
      {error && (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      )}
      <div>
        <Botao type="submit" variant="outline" size="sm" disabled={body.trim().length < 2} loading={pending}>
          Salvar nota
        </Botao>
      </div>
    </form>
  );
}
