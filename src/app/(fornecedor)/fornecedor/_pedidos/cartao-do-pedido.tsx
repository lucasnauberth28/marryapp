import Link from "next/link";
import { ArrowRight, CalendarDays, Lock, MapPin, Users } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { formatarTelefone } from "@/lib/formatacao/telefone";
import { pluralizar } from "@/lib/formatacao/plural";
import { cn } from "@/lib/utils";
import { EtiquetaDaSituacaoDoPedido } from "../../_components/status-chip";
import { LINK_DO_PLANO, LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL, ehSituacaoDoPedido, formatarDataDoCasamento, formatarTempoRelativo, linkDoWhatsapp, type SituacaoDoPedido } from "../../_lib/vendor-panel";
import { AcoesDoPedido } from "../lead-actions";
import type { PedidoVisivel } from "./dados";
import { ESTILO_DO_CARTAO } from "./estilos";

const LINK_COBRE_O_CARTAO = "rounded-sm after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:underline";

/** Pedido além do limite do Plano Start: só primeiro nome, data e cidade, com o convite ao Pro. */
export function PedidoBloqueado({ lead, atraso }: { lead: PedidoVisivel; atraso: number }) {
  const date = formatarDataDoCasamento(lead.weddingDate);
  return (
    <Aparicao as="li" variant="up" delay={atraso}>
      <article aria-labelledby={`lead-${lead.id}`} className={cn(ESTILO_DO_CARTAO, "relative flex flex-col gap-4 border-dashed bg-areia/40 p-4 sm:flex-row sm:items-center sm:p-6")}>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-areia px-2.5 py-1 text-[13px] leading-4 font-semibold text-tinta">
            <Lock aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
            Bloqueado <span className="font-medium">· {formatarTempoRelativo(lead.createdAt)}</span>
          </span>
          <h3 id={`lead-${lead.id}`} className="font-display text-2xl leading-tight font-medium break-words">
            <Link href={`/fornecedor/pedidos/${lead.id}`} className={LINK_COBRE_O_CARTAO}>
              {lead.coupleName}
            </Link>
          </h3>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta-suave sm:text-base">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-4" />
              {date ?? "Data a definir"}
            </span>
            {lead.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-4" />
                {lead.location}
              </span>
            ) : null}
          </p>
          <p className="text-sm text-tinta-suave">Contato e mensagem do casal ficam ocultos: este pedido passou do limite de {LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL} do Plano Start.</p>
        </div>
        <div className="relative z-10 w-full sm:w-auto">
          <Link href={LINK_DO_PLANO} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-ameixa px-4 text-[15px] font-semibold text-on-ameixa transition-colors hover:bg-ameixa-hover sm:w-56">
            <Lock aria-hidden="true" className="size-[18px]" />
            Desbloquear com o Pro
          </Link>
        </div>
      </article>
    </Aparicao>
  );
}

function DetalhesDoPedido({ lead, date }: { lead: PedidoVisivel; date: string | null }) {
  const details = [date ? { icon: CalendarDays, text: date } : null, lead.guestCount ? { icon: Users, text: pluralizar(lead.guestCount, "convidado", "convidados") } : null].filter((d) => d !== null);
  if (details.length === 0 && !lead.meetingType) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta-suave sm:text-base">
      {details.map(({ icon: Icon, text }) => (
        <span key={text} className="inline-flex items-center gap-1.5">
          <Icon aria-hidden="true" className="size-4" />
          {text}
        </span>
      ))}
      {lead.meetingType ? <span>{lead.meetingType === "PRESENTIAL" ? "Prefere reunião presencial" : "Prefere reunião online"}</span> : null}
    </p>
  );
}

export function PedidoLiberado({ lead, atraso, nomeDaEmpresa }: { lead: PedidoVisivel; atraso: number; nomeDaEmpresa: string }) {
  const status: SituacaoDoPedido = ehSituacaoDoPedido(lead.status) ? lead.status : "NEW";
  const date = formatarDataDoCasamento(lead.weddingDate);
  const waText = `Olá, ${lead.coupleName}! Aqui é ${nomeDaEmpresa}, pelo Aceito. Recebi seu pedido de orçamento${date ? ` para ${date}` : ""} e quero conversar com vocês.`;
  return (
    <Aparicao as="li" variant="up" delay={atraso}>
      <article
        aria-labelledby={`lead-${lead.id}`}
        className={cn(ESTILO_DO_CARTAO, "relative flex flex-col gap-4 p-4 transition-colors hover:border-linha-forte sm:flex-row sm:items-start sm:p-6", status === "NEW" && "border-2 border-ameixa dark:border-ameixa/55")}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <EtiquetaDaSituacaoDoPedido status={status} suffix={formatarTempoRelativo(lead.createdAt)} />
          <h3 id={`lead-${lead.id}`} className="font-display text-2xl leading-tight font-medium break-words">
            {/* O link cobre o cartão inteiro; as ações ficam acima dele (z-10). */}
            <Link href={`/fornecedor/pedidos/${lead.id}`} className={LINK_COBRE_O_CARTAO}>
              {lead.coupleName}
            </Link>
          </h3>
          <DetalhesDoPedido lead={lead} date={date} />
          {lead.message ? <p className="mt-1 text-[15px] whitespace-pre-line break-words sm:text-base">“{lead.message}”</p> : null}
          <p className="mt-1 text-sm text-tinta-suave">
            {formatarTelefone(lead.couplePhone)}
            {lead.coupleEmail ? ` · ${lead.coupleEmail}` : ""}
          </p>
          <span aria-hidden="true" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-ameixa">
            Ver pedido completo
            <ArrowRight className="size-4" />
          </span>
        </div>
        <div className="relative z-10 w-full sm:w-auto">
          <AcoesDoPedido leadId={lead.id} status={status} coupleName={lead.coupleName} whatsappUrl={linkDoWhatsapp(lead.couplePhone, waText)} coupleEmail={lead.coupleEmail} />
        </div>
      </article>
    </Aparicao>
  );
}
