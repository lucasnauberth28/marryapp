import { Check, Copy, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CaixaDoLink } from "./caixa-do-link";
import { BOTAO_PRINCIPAL, BOTAO_SECUNDARIO, copiarTexto, type PropostaSalva } from "./tipos";

/** A proposta já gravada: abrir no WhatsApp, copiar o texto e o link para o casal aceitar. */
export function PropostaRegistrada({ saved, recemSalva }: { saved: PropostaSalva; recemSalva: boolean }) {
  return (
    <div role="status" className={cn("flex flex-col gap-3 rounded-xl p-4", recemSalva ? "bg-sucesso-suave" : "border border-linha bg-linho")}>
      <p className="flex items-start gap-2 text-[15px]">
        <Check aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-sucesso" />
        <span>
          <strong className="font-semibold">{recemSalva ? "Proposta registrada neste pedido." : `Proposta registrada ${saved.sentAtLabel}.`}</strong>{" "}
          <span className="text-tinta-suave">
            {saved.whatsappUrl ? "Abra no seu WhatsApp para enviar ao casal: a mensagem já vai pronta." : "Copie o texto e envie ao casal pelo canal que vocês combinaram."}
          </span>
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {saved.whatsappUrl ? (
          <a href={saved.whatsappUrl} target="_blank" rel="noopener noreferrer" className={BOTAO_PRINCIPAL}>
            <MessageCircle aria-hidden="true" className="size-[18px]" />
            Enviar no WhatsApp
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        ) : null}
        <button type="button" onClick={() => void copiarTexto(saved.text)} className={BOTAO_SECUNDARIO}>
          <Copy aria-hidden="true" className="size-[18px]" />
          Copiar texto
        </button>
      </div>
      {saved.publicUrl ? <CaixaDoLink url={saved.publicUrl} /> : null}
    </div>
  );
}
