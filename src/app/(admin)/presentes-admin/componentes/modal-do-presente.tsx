import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { criarPresente } from "@/actions/gift-actions";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { ModalPersonalizado } from "@/components/ui/custom-modal";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { CampoDeFotoDoPresente } from "./campo-de-foto-do-presente";

const MENSAGEM_DE_ERRO = "Não deu para cadastrar o presente. Tente de novo.";

function CampoDoValor({ id }: { id: string }) {
  return (
    <Entrada
      id={id}
      name="amount"
      type="number"
      inputMode="decimal"
      step="0.01"
      min="0.01"
      label="Valor em reais"
      prefix="R$"
      placeholder="Ex.: 150,00"
      hint="Quanto o convidado paga pelo presente. Ele escolhe Pix ou cartão."
      required
    />
  );
}

export function ModalDoPresente({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const uid = useId();

  function handleSubmit(formData: FormData) {
    setError(null);
    const toastId = toast.loading("Cadastrando o presente...");
    startTransition(async () => {
      const result = await criarPresente(formData);
      if (!result.success) {
        toast.error(result.error ?? MENSAGEM_DE_ERRO, { id: toastId });
        return setError(result.error ?? MENSAGEM_DE_ERRO);
      }
      toast.success("Presente cadastrado.", { id: toastId });
      onClose();
    });
  }

  return (
    <ModalPersonalizado isOpen={isOpen} onClose={onClose} title="Novo presente" description="Ele entra na lista de presentes do site de vocês. O convidado paga o valor por Pix ou cartão." size="md">
      <form action={handleSubmit} className="flex flex-col gap-5 pt-2">
        <CampoDeFotoDoPresente />
        <Entrada id={`${uid}-title`} name="title" label="Nome do presente" placeholder="Ex.: Jogo de panelas" required />
        <CampoDoValor id={`${uid}-amount`} />
        <AreaDeTexto id={`${uid}-desc`} name="description" label="Recado para os convidados" optional placeholder="Uma mensagem carinhosa ou detalhes sobre o presente" rows={4} />
        {error && <p className="text-sm text-perigo bg-perigo-suave border border-perigo/40 rounded-lg px-3 py-2">{error}</p>}
        <div className="pt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isPending} className={estiloDoBotao.secondary}>
            Cancelar
          </button>
          <BotaoComCarregamento type="submit" loading={isPending} className={estiloDoBotao.primary}>
            Adicionar presente
          </BotaoComCarregamento>
        </div>
      </form>
    </ModalPersonalizado>
  );
}
