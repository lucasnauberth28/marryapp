"use client";
// Enviar uma mensagem: para quem, como vai chegar e um botão só.
import { Send } from "lucide-react";
import type { Guest } from "@prisma/client";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { estiloDaCaixaDeErro, estiloDoBotao, estiloDoSobretitulo } from "@/components/painel/styles";
import { EscolhaDoPublico } from "./escolha-do-publico";
import { PreviaDoWhatsapp } from "./previa-do-whatsapp";
import type { ModeloDeMensagem } from "./tipos";
import { useEnvioDaMensagem, type EnvioDaMensagem } from "./use-envio-da-mensagem";
import { interpretarLinks, linksParaPrevia } from "./utilitarios";

function ResultadoDoEnvio({ resultado }: { resultado: NonNullable<EnvioDaMensagem["resultado"]> }) {
  return (
    <p role={resultado.ok ? "status" : "alert"} className={resultado.ok ? "rounded-xl bg-sucesso-suave px-3 py-2 text-sm font-semibold text-sucesso" : estiloDaCaixaDeErro}>
      {resultado.text}
    </p>
  );
}

interface FluxoDeEnvioProps {
  template: ModeloDeMensagem;
  guests: Guest[];
  slug: string;
  customDomain?: string | null;
  coupleNames: string;
  onDone: () => void;
}

export function FluxoDeEnvio({ template, guests, slug, customDomain, coupleNames, onDone }: FluxoDeEnvioProps) {
  const envio = useEnvioDaMensagem(template, guests);
  const quantos = envio.escolhidos.length;
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-5">
        <EscolhaDoPublico envio={envio} />
        {envio.resultado ? <ResultadoDoEnvio resultado={envio.resultado} /> : null}
        <div className="flex flex-wrap items-center gap-2">
          <BotaoComCarregamento onClick={envio.enviar} loading={envio.enviando} disabled={quantos === 0} className={estiloDoBotao.primary}>
            <Send className="size-4" aria-hidden="true" />
            {quantos === 0 ? "Escolha quem recebe" : `Enviar para ${quantos} ${quantos === 1 ? "pessoa" : "pessoas"}`}
          </BotaoComCarregamento>
          <button type="button" onClick={onDone} className={estiloDoBotao.secondary}>{envio.resultado?.ok ? "Fechar" : "Cancelar"}</button>
        </div>
      </div>
      <section aria-label="Prévia no WhatsApp" className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-0">
        <p className={estiloDoSobretitulo}>Como chega para {envio.primeiroNomeDoExemplo}</p>
        <PreviaDoWhatsapp coupleNames={coupleNames} text={template.content} sampleName={envio.primeiroNomeDoExemplo} links={linksParaPrevia(interpretarLinks(template.buttons), slug, customDomain)} hasMedia={!!template.mediaUrl} mediaType={template.mediaType ?? "image"} />
      </section>
    </div>
  );
}
