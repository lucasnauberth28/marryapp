"use client";
// Enviar uma mensagem: para quem, como vai chegar e a fila de envio pelo WhatsApp do casal.
import { useState } from "react";
import { ListChecks } from "lucide-react";
import type { Guest } from "@prisma/client";
import { estiloDoBotao, estiloDoSobretitulo } from "@/components/painel/styles";
import { EscolhaDoPublico } from "./escolha-do-publico";
import { FilaDeEnvio } from "./fila-de-envio";
import { PreviaDoWhatsapp } from "./previa-do-whatsapp";
import type { ModeloDeMensagem } from "./tipos";
import { useEnvioDaMensagem } from "./use-envio-da-mensagem";
import { interpretarLinks, linksParaPrevia } from "./utilitarios";

interface FluxoDeEnvioProps {
  template: ModeloDeMensagem;
  guests: Guest[];
  slug: string;
  customDomain?: string | null;
  coupleNames: string;
  onDone: () => void;
}

export function FluxoDeEnvio({ template, guests, slug, customDomain, coupleNames, onDone }: FluxoDeEnvioProps) {
  const envio = useEnvioDaMensagem(guests);
  const [fila, setFila] = useState<string[] | null>(null);
  const quantos = envio.escolhidos.length;
  if (fila) return <FilaDeEnvio templateId={template.id} ehConvite={template.type === "INITIAL_INVITE"} guestIds={fila} aoFechar={onDone} />;
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-5">
        <EscolhaDoPublico envio={envio} />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setFila(envio.escolhidos)} disabled={quantos === 0} className={estiloDoBotao.primary}>
            <ListChecks className="size-4" aria-hidden="true" />
            {quantos === 0 ? "Escolha quem recebe" : `Montar a fila para ${quantos} ${quantos === 1 ? "pessoa" : "pessoas"}`}
          </button>
          <button type="button" onClick={onDone} className={estiloDoBotao.secondary}>Cancelar</button>
        </div>
      </div>
      <section aria-label="Prévia no WhatsApp" className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-0">
        <p className={estiloDoSobretitulo}>Como chega para {envio.primeiroNomeDoExemplo}</p>
        <PreviaDoWhatsapp coupleNames={coupleNames} text={template.content} sampleName={envio.primeiroNomeDoExemplo} links={linksParaPrevia(interpretarLinks(template.buttons), slug, customDomain)} hasMedia={!!template.mediaUrl} mediaType={template.mediaType ?? "image"} />
      </section>
    </div>
  );
}
