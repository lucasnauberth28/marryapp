import { useState, useTransition } from "react";
import { toast } from "sonner";
import { atualizarConfiguracoes } from "@/actions/settings-actions";
import { Botao } from "@/components/ui/button";
import { Cartao, CabecalhoDoCartao, ConteudoDoCartao, TituloDoCartao } from "@/components/ui/card";
import { SeletorDeData } from "@/components/ui/date-picker";

export function CartaoDoPrazo({ prazoInicial }: { prazoInicial: Date | string | null }) {
  const [isPending, startTransition] = useTransition();
  const [rsvpDeadline, setRsvpDeadline] = useState(prazoInicial ? new Date(prazoInicial).toISOString().split("T")[0] : "");

  function handleSave() {
    const toastId = toast.loading("Salvando o prazo…");
    startTransition(async () => {
      const res = await atualizarConfiguracoes({ rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null });
      if (res.success) toast.success("Prazo de confirmação salvo.", { id: toastId });
      else toast.error(res.error ?? "Não deu para salvar o prazo. Tente de novo.", { id: toastId });
    });
  }

  return (
    <Cartao className="gap-4">
      <CabecalhoDoCartao>
        <TituloDoCartao>Confirmação de presença</TituloDoCartao>
      </CabecalhoDoCartao>
      <ConteudoDoCartao className="flex flex-col gap-4">
        <SeletorDeData
          id="rsvpDeadline"
          label="Prazo de confirmação"
          hint="Opcional. Depois desta data, a página de confirmação do site deixa de aceitar respostas. A Liz também usa este prazo nas sugestões."
          className="sm:max-w-[320px]"
          value={rsvpDeadline}
          onChange={(e) => setRsvpDeadline(e.target.value)}
        />
        <div>
          <Botao onClick={handleSave} loading={isPending}>
            Salvar prazo
          </Botao>
        </div>
      </ConteudoDoCartao>
    </Cartao>
  );
}
