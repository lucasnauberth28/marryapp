import { Send, Mail, MessageCircle } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { centavosParaCampoDeReais, hojeEmBrasilia, paraDataIso } from "../../../../_lib/vendor-panel";
import { FormularioDeProposta, type PropostaSalva } from "../formulario-de-proposta";
import type { PedidoCompleto } from "./dados";
import { ESTILO_DO_BOTAO_PRIMARIO, ESTILO_DO_BOTAO_SECUNDARIO, ESTILO_DO_CARTAO } from "./estilos";

export function CartaoDaProposta({ lead, salva }: { lead: PedidoCompleto; salva: PropostaSalva | null }) {
  return (
    <Aparicao variant="up" delay={160}>
      <section id="proposta" aria-labelledby="proposta-titulo" className={cn(ESTILO_DO_CARTAO, "flex scroll-mt-20 flex-col gap-4")}>
        <div className="flex flex-col gap-0.5">
          <h2 id="proposta-titulo" className="text-lg font-semibold">
            {salva?.accepted ? "Proposta aceita" : "Enviar proposta"}
          </h2>
          <p className="text-sm text-tinta-suave">
            {salva?.accepted ? "O casal aceitou a proposta pelo link. O aceite fica registrado neste pedido." : "A proposta fica registrada neste pedido e abre pronta no seu WhatsApp, com o link para o casal aceitar."}
          </p>
        </div>
        <FormularioDeProposta
          leadId={lead.id}
          todayIso={paraDataIso(hojeEmBrasilia())}
          saved={salva}
          initial={{ amount: centavosParaCampoDeReais(lead.proposalAmount), validUntil: lead.proposalValidUntil ? paraDataIso(lead.proposalValidUntil) : "", details: lead.proposalDetails ?? "" }}
        />
      </section>
    </Aparicao>
  );
}

/** Celular: ações fixas acima da barra de abas (fora do Reveal, que usa transform). */
export function BarraFixaDoCelular({ contactWa, coupleEmail, temProposta }: { contactWa: string | null; coupleEmail: string | null; temProposta: boolean }) {
  return (
    <>
      <div aria-hidden="true" className="h-[68px] md:hidden" />
      <div className="fixed inset-x-0 bottom-20 z-30 grid grid-cols-2 gap-2 border-t border-linha bg-papel px-4 py-3 md:hidden">
        {contactWa ? (
          <a href={contactWa} target="_blank" rel="noopener noreferrer" className={ESTILO_DO_BOTAO_SECUNDARIO}>
            <MessageCircle aria-hidden="true" className="size-[18px]" />
            WhatsApp
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        ) : coupleEmail ? (
          <a href={`mailto:${coupleEmail}`} className={ESTILO_DO_BOTAO_SECUNDARIO}>
            <Mail aria-hidden="true" className="size-[18px]" />
            E-mail
          </a>
        ) : (
          <span />
        )}
        <a href="#proposta" className={ESTILO_DO_BOTAO_PRIMARIO}>
          <Send aria-hidden="true" className="size-[18px]" />
          {temProposta ? "Ver proposta" : "Enviar proposta"}
        </a>
      </div>
    </>
  );
}
