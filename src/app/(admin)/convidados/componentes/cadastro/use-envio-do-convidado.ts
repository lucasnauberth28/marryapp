// Envia o convidado (novo ou editado) e decide se fecha o modal ou deixa o formulário limpo para o próximo.
import { useTransition } from "react";
import { toast } from "sonner";
import { atualizarConvidado, criarConvidado } from "@/actions/guest-actions";
import type { ConvidadoLocal } from "@/types/local";
import type { CamposDoConvidado } from "./use-campos-do-convidado";

const MENSAGEM_PADRAO_DE_ERRO = "Não deu para salvar. Tente de novo.";

export function useEnvioDoConvidado(guest: ConvidadoLocal | null | undefined, campos: CamposDoConvidado, onClose: () => void) {
  const [isPending, startTransition] = useTransition();
  const { isEditing } = campos;

  function enviar(formData: FormData) {
    if (isEditing) formData.set("rsvpStatus", campos.rsvpStatus);
    formData.set("category", campos.category);
    formData.set("parentGuestId", campos.parentGuestId === "none" ? "" : campos.parentGuestId);
    formData.set("allowedCompanions", String(Math.max(0, campos.seats - 1)));
    campos.setError(null);
    const toastId = toast.loading(isEditing ? "Salvando as alterações..." : "Adicionando à lista...");
    startTransition(async () => {
      const result = guest ? await atualizarConvidado(guest.id, formData) : await criarConvidado(formData);
      if (!result.success) {
        toast.error(result.error ?? MENSAGEM_PADRAO_DE_ERRO, { id: toastId });
        return campos.setError(result.error ?? MENSAGEM_PADRAO_DE_ERRO);
      }
      toast.success(isEditing ? "Informações salvas." : "Convidado adicionado à lista.", { id: toastId });
      // Fica no formulário, limpo, para o próximo convidado
      if (!isEditing && campos.addAnother) campos.limpar();
      else onClose();
    });
  }

  return { isPending, enviar };
}
