import { formatarDataDoCasamento, formatarDataEHoraEmBrasilia, formatarTempoRelativo } from "../../../../_lib/datas-do-painel";
import { linkDoWhatsapp, urlPublicaDaProposta } from "../../../../_lib/links-publicos";
import { type SituacaoDoPedido } from "../../../../_lib/pedidos";
import { formatarReaisDoPainel } from "../../../../_lib/perfil-do-fornecedor";
import type { PropostaSalva } from "../formulario-de-proposta";
import type { PedidoCompleto } from "./dados";

const ORDEM_DAS_SITUACOES: Record<SituacaoDoPedido, number> = { NEW: 0, CONTACTED: 1, PROPOSAL_SENT: 2, CLOSED: 3, DECLINED: -1 };

export function colocarEmMaiuscula(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "chegou há 2 h", "chegou ontem", "chegou em 3 out". */
export function rotuloDeChegada(date: Date) {
  const rel = formatarTempoRelativo(date);
  return /^(há|ontem|agora)/.test(rel) ? `chegou ${rel}` : `chegou em ${rel}`;
}

export function formatarHoras(hours: number) {
  if (hours < 1) return "menos de 1 h";
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} dias`;
}

/** Mensagem pronta para o WhatsApp do fornecedor responder ao pedido. */
export function mensagemDeContato(lead: PedidoCompleto, empresa: string, dateShort: string | null) {
  return `Olá, ${lead.coupleName}! Aqui é ${empresa}, pelo Aceito. Recebi seu pedido de orçamento${dateShort ? ` para ${dateShort}` : ""} e quero conversar com vocês.`;
}

export function mensagemDeRecusa(lead: PedidoCompleto, empresa: string, dateShort: string | null) {
  return `Olá, ${lead.coupleName}! Obrigado por pensar em ${empresa} para o casamento de vocês. Infelizmente não vamos conseguir atender ${dateShort ? `no dia ${dateShort}` : "desta vez"}. Desejamos um dia lindo e cheio de amor!`;
}

/** A proposta já enviada, com o texto do WhatsApp e o aceite do casal, se houve. */
export function propostaSalva(lead: PedidoCompleto, empresa: string, dateShort: string | null): PropostaSalva | null {
  if (!lead.proposalSentAt || lead.proposalAmount == null) return null;
  const validUntil = formatarDataDoCasamento(lead.proposalValidUntil);
  const publicUrl = lead.proposalToken ? urlPublicaDaProposta(lead.proposalToken) : null;
  const text = [
    `Olá, ${lead.coupleName}! Aqui é ${empresa}, pelo Aceito. Segue a nossa proposta${dateShort ? ` para o casamento em ${dateShort}` : ""}:`,
    "",
    `Valor: ${formatarReaisDoPainel(lead.proposalAmount)}`,
    ...(validUntil ? [`Válida até: ${validUntil}`] : []),
    ...(lead.proposalDetails ? ["", "O que está incluído:", lead.proposalDetails] : []),
    ...(publicUrl ? ["", "Para ver os detalhes e aceitar a proposta:", publicUrl] : []),
    "",
    "Qualquer dúvida, é só responder por aqui.",
  ].join("\n");
  return {
    sentAtLabel: formatarDataEHoraEmBrasilia(lead.proposalSentAt),
    text,
    whatsappUrl: linkDoWhatsapp(lead.couplePhone, text),
    publicUrl,
    accepted: lead.proposalAcceptedAt && lead.proposalAcceptedName ? { name: lead.proposalAcceptedName, atLabel: formatarDataEHoraEmBrasilia(lead.proposalAcceptedAt) } : null,
  };
}

export interface PassoDoAndamento {
  label: string;
  done: boolean;
  detail?: string;
}

/** Andamento: um passo conta como feito pela data gravada ou pelo status atual (pedidos antigos não têm as datas). */
export function andamentoDoPedido(lead: PedidoCompleto, status: SituacaoDoPedido): PassoDoAndamento[] {
  const rank = ORDEM_DAS_SITUACOES[status];
  const quando = (d: Date) => colocarEmMaiuscula(formatarDataEHoraEmBrasilia(d));
  const steps: PassoDoAndamento[] = [
    { label: "Pedido recebido", done: true, detail: `${quando(lead.createdAt)} · pelo seu perfil` },
    { label: "Respondido", done: !!lead.respondedAt || rank >= 1, detail: lead.respondedAt ? quando(lead.respondedAt) : "Fale com o casal e marque como respondido" },
    {
      label: "Proposta enviada",
      done: !!lead.proposalSentAt || rank >= 2,
      detail: lead.proposalSentAt ? `${quando(lead.proposalSentAt)}${lead.proposalAmount != null ? ` · ${formatarReaisDoPainel(lead.proposalAmount)}` : ""}` : "Registre a proposta neste pedido",
    },
    status === "DECLINED"
      ? { label: "Recusado", done: true, detail: lead.declinedAt ? quando(lead.declinedAt) : undefined }
      : { label: "Fechado", done: status === "CLOSED", detail: lead.closedAt ? `${quando(lead.closedAt)}${lead.proposalAcceptedAt ? " · aceite digital do casal" : ""}` : undefined },
  ];
  // Recusado sem ter passado por uma etapa: a etapa some em vez de ficar pendente.
  return status === "DECLINED" ? steps.filter((s) => s.done) : steps;
}
