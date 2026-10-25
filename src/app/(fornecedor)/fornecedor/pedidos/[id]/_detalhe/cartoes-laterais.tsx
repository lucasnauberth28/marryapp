import { Mail, MessageCircle } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { somenteDigitos, formatarTelefone } from "@/lib/formatacao/telefone";
import { cn } from "@/lib/utils";
import type { PedidoCompleto } from "./dados";
import { ESTILO_DO_BOTAO_PRIMARIO, ESTILO_DO_CARTAO } from "./estilos";
import type { PassoDoAndamento } from "./mensagens-e-andamento";
import { SelecaoDeSituacao } from "../status-select";
import type { SituacaoDoPedido } from "../../../../_lib/pedidos";

export function CartaoDeContato({ lead, contactWa, temData }: { lead: PedidoCompleto; contactWa: string | null; temData: boolean }) {
  return (
    <Aparicao variant="up" delay={120}>
      <section aria-labelledby="contato-titulo" className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-3")}>
        <h2 id="contato-titulo" className="text-lg font-semibold">
          Falar com o casal
        </h2>
        {contactWa ? (
          <>
            <a href={contactWa} target="_blank" rel="noopener noreferrer" className={cn(ESTILO_DO_BOTAO_PRIMARIO, "w-full")}>
              <MessageCircle aria-hidden="true" className="size-[18px]" />
              Responder no WhatsApp
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
            <p className="text-sm text-tinta-suave">A mensagem já abre com o nome do casal{temData ? " e a data" : ""}.</p>
          </>
        ) : null}
        <ul className="flex flex-col gap-1 text-[15px]">
          <li>
            <a href={`tel:${somenteDigitos(lead.couplePhone)}`} className="inline-flex min-h-11 items-center underline-offset-2 hover:underline">
              {formatarTelefone(lead.couplePhone)}
            </a>
          </li>
          {lead.coupleEmail ? (
            <li>
              <a href={`mailto:${lead.coupleEmail}`} className="inline-flex min-h-11 items-center gap-2 break-all text-ameixa underline-offset-2 hover:underline">
                <Mail aria-hidden="true" className="size-4 shrink-0" />
                {lead.coupleEmail}
              </a>
            </li>
          ) : null}
        </ul>
      </section>
    </Aparicao>
  );
}

export function CartaoDeAndamento({ leadId, status, passos }: { leadId: string; status: SituacaoDoPedido; passos: PassoDoAndamento[] }) {
  return (
    <Aparicao variant="up" delay={200}>
      <section aria-labelledby="andamento-titulo" className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-4")}>
        <h2 id="andamento-titulo" className="text-lg font-semibold">
          Andamento
        </h2>
        <SelecaoDeSituacao leadId={leadId} status={status} />
        <ol className="flex flex-col gap-3.5">
          {passos.map((step) => (
            <li key={step.label} className="flex gap-3">
              <span aria-hidden="true" className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", step.done ? (step.label === "Recusado" ? "bg-perigo" : "bg-ameixa") : "border-2 border-linha-forte")} />
              <span className="flex min-w-0 flex-col">
                <strong className={cn("text-[15px] font-semibold", !step.done && "text-tinta-suave")}>
                  {step.label}
                  <span className="sr-only">{step.done ? " (concluído)" : " (pendente)"}</span>
                </strong>
                {step.detail ? <span className="text-sm text-tinta-suave">{step.detail}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </Aparicao>
  );
}
