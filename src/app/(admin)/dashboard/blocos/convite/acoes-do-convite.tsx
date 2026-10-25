import { Check, ChevronRight, Copy, MessageCircle, Send } from "lucide-react";
import { classeDaDica, estiloDoBotaoPrimario, estiloDoBotaoSecundario } from "../../ui";
import type { EnvioDeConvites } from "./use-envio-de-convites";

interface PropriedadesDasAcoes {
  generalWhatsappUrl: string;
  generalMessage: string;
  canSendEach: boolean;
  firstAccess: boolean;
  listaAberta: boolean;
  aoAlternarLista: () => void;
  envio: EnvioDeConvites;
}

/** Enviar pelo WhatsApp de vocês, copiar o link e abrir a lista de envio um a um. */
export function AcoesDoConvite({ generalWhatsappUrl, generalMessage, canSendEach, firstAccess, listaAberta, aoAlternarLista, envio }: PropriedadesDasAcoes) {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2 max-md:[&>*]:flex-1">
        <a href={generalWhatsappUrl} target="_blank" rel="noopener noreferrer" className={estiloDoBotaoPrimario}>
          <MessageCircle className="size-[17px]" aria-hidden="true" />
          Enviar pelo WhatsApp
          <span className="sr-only">(abre em outra aba)</span>
        </a>
        <button type="button" onClick={envio.copiar} className={estiloDoBotaoSecundario}>
          {envio.copied ? <Check className="size-[17px] text-sucesso" aria-hidden="true" /> : <Copy className="size-[17px]" aria-hidden="true" />}
          <span>{envio.copied ? "Link copiado" : "Copiar link"}</span>
        </button>
        {canSendEach && (
          <button type="button" onClick={aoAlternarLista} disabled={firstAccess} aria-expanded={listaAberta} aria-controls="lista-envio" className={estiloDoBotaoSecundario}>
            <Send className="size-[17px]" aria-hidden="true" />
            Enviar por convidado
          </button>
        )}
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {envio.copied ? "Link copiado" : ""}
      </span>
      <p className={classeDaDica}>
        {firstAccess
          ? "O WhatsApp de vocês abre com a mensagem pronta. Para mandar um convite pessoal para cada pessoa, adicionem os convidados primeiro."
          : "O WhatsApp de vocês abre com a mensagem pronta; vocês escolhem a pessoa ou o grupo."}
      </p>
      <details className="group">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-[8px] text-[13px] font-medium text-tinta-suave [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" aria-hidden="true" />
          Ver a mensagem
        </summary>
        <blockquote className="mb-1 whitespace-pre-line rounded-[8px] border border-linha bg-areia/40 px-3.5 py-3 text-[13.5px] leading-[1.5] text-tinta">{generalMessage}</blockquote>
      </details>
    </div>
  );
}
