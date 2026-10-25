// Pede a confirmação e remove o convidado; a linha fica esmaecida até a lista atualizar.
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { excluirConvidado } from "@/actions/convidados/lista";
import type { ConvidadoLocal } from "@/types/local";

export function useRemocaoDeConvidado() {
  const [, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [paraRemover, setParaRemover] = useState<ConvidadoLocal | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  const pedir = (convidado: ConvidadoLocal) => {
    setParaRemover(convidado);
    setConfirmando(true);
  };

  const remover = (id: string) => {
    const idDoAviso = toast.loading("Removendo convidado...");
    setRemovendoId(id);
    iniciar(async () => {
      const resposta = await excluirConvidado(id);
      if (resposta.success) toast.success("Convidado removido.", { id: idDoAviso });
      else toast.error(resposta.error || "Não deu para remover agora. Tente de novo.", { id: idDoAviso, duration: 6000 });
      setRemovendoId(null);
    });
  };

  const confirmar = () => {
    setConfirmando(false);
    if (paraRemover) remover(paraRemover.id);
  };

  return { confirmando, setConfirmando, paraRemover, removendoId, pedir, confirmar };
}
