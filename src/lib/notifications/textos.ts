// Textos dos avisos do Aceito: o que cada aviso diz (título, corpo e destino) e a chave que impede avisar duas vezes.
// Puro (sem banco nem Next): usado no servidor e no navegador, e testado isoladamente.
import { formatarReais } from "../formatacao/dinheiro.ts";
import { formatarDataCivilSemAno } from "../formatacao/data.ts";
import type { PublicoDaNotificacao } from "./catalog.ts";

export type EventoDeNotificacao =
  | { type: "gift_paid"; guestName: string | null; giftTitle: string; amountCents: number }
  | { type: "pix_to_check"; guestName: string | null; giftTitle: string; amountCents: number }
  | { type: "rsvp_confirmed"; guestName: string; companions: number }
  | { type: "rsvp_declined"; guestName: string }
  | { type: "expense_due"; description: string; amountCents: number; dueDate: Date; overdue: boolean }
  | { type: "plan_activated"; audience: PublicoDaNotificacao; planName: string; periodEnd?: Date | null }
  | { type: "domain_registered"; domain: string }
  | { type: "domain_ready"; domain: string }
  | { type: "domain_rejected"; domain: string; reason: string }
  | { type: "lead_new"; leadId: string; coupleName: string; locked: boolean; weddingDate?: Date | null }
  | { type: "proposal_accepted"; leadId: string; coupleName: string }
  | { type: "review_new"; coupleNames: string; rating: number }
  | { type: "plan_expiring"; planName: string; daysLeft: number }
  | { type: "plan_expired"; planName: string };

export interface TextoDaNotificacao {
  title: string;
  body: string;
  href: string;
}

// Datas de vencimento e de casamento ficam gravadas à meia-noite UTC: formatar em UTC evita voltar um dia.
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

/** Nomes digitados por convidados e casais entram no texto: limita o tamanho e tira quebras de linha. */
export function limparTextoDaNotificacao(value: string | null | undefined, max = 60, fallback = ""): string {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

const primeiroNome = (name: string) => limparTextoDaNotificacao(name.split(/[\s&,]+/)[0], 30, "Um casal");

type Evento<T extends EventoDeNotificacao["type"]> = Extract<EventoDeNotificacao, { type: T }>;

/** Presentes, Pix e despesas (o dinheiro do casal). */
function textoDoDinheiro(event: Evento<"gift_paid" | "pix_to_check" | "expense_due">): TextoDaNotificacao {
  if (event.type === "expense_due") {
    const what = `"${limparTextoDaNotificacao(event.description, 60, "Despesa")}" (${formatarReais(event.amountCents)})`;
    return event.overdue
      ? { title: "Despesa vencida", body: `${what} venceu em ${dataCurta.format(event.dueDate)}.`, href: "/financas" }
      : { title: "Despesa perto de vencer", body: `${what} vence em ${dataCurta.format(event.dueDate)}.`, href: "/financas" };
  }
  const who = limparTextoDaNotificacao(event.guestName, 60, "Um convidado");
  const gift = limparTextoDaNotificacao(event.giftTitle, 60, "um presente");
  if (event.type === "gift_paid") return { title: "Presente recebido", body: `${who} deu "${gift}" para vocês (${formatarReais(event.amountCents)}).`, href: "/financas" };
  return {
    title: "Pix para conferir",
    body: `${who} gerou um Pix de ${formatarReais(event.amountCents)} para "${gift}". Quando o valor aparecer no extrato de vocês, confirmem em Finanças.`,
    href: "/financas",
  };
}

function textoDaResposta(event: Evento<"rsvp_confirmed" | "rsvp_declined">): TextoDaNotificacao {
  const who = limparTextoDaNotificacao(event.guestName, 60, "Um convidado");
  if (event.type === "rsvp_declined") return { title: "Resposta de um convidado", body: `${who} avisou que não poderá ir.`, href: "/convidados" };
  const body =
    event.companions > 0 ? `${who} e mais ${event.companions} ${event.companions === 1 ? "pessoa" : "pessoas"} vão ao casamento.` : `${who} vai ao casamento.`;
  return { title: "Presença confirmada", body, href: "/convidados" };
}

function textoDoEndereco(event: Evento<"domain_registered" | "domain_ready" | "domain_rejected">): TextoDaNotificacao {
  const domain = limparTextoDaNotificacao(event.domain, 70);
  if (event.type === "domain_registered") {
    return { title: "Endereço do site registrado", body: `${domain} já está registrado no nome do titular. Falta ligar ao site de vocês; avisamos quando estiver no ar.`, href: "/dominio" };
  }
  if (event.type === "domain_ready") {
    return { title: "Endereço do site no ar", body: `O site de vocês já abre em ${domain}. Os links enviados aos convidados passam a usar este endereço.`, href: "/dominio" };
  }
  return {
    title: "Pedido de endereço recusado",
    body: `Não foi possível registrar o endereço ${domain}. Motivo: ${limparTextoDaNotificacao(event.reason, 110, "sem detalhes")}. Vocês podem fazer um novo pedido.`,
    href: "/dominio",
  };
}

function textoDoPlanoAtivado(event: Evento<"plan_activated">): TextoDaNotificacao {
  const plan = limparTextoDaNotificacao(event.planName, 40, "novo plano");
  if (event.audience !== "vendor") return { title: "Plano ativado", body: `O plano ${plan} já está valendo para o casamento de vocês.`, href: "/plano" };
  const until = event.periodEnd ? ` até ${formatarDataCivilSemAno(event.periodEnd)}` : "";
  return { title: "Plano ativado", body: `Pagamento confirmado. O plano ${plan} já está valendo${until}.`, href: "/fornecedor/plano" };
}

function textoDoPedido(event: Evento<"lead_new" | "proposal_accepted">): TextoDaNotificacao {
  const href = `/fornecedor/pedidos/${event.leadId}`;
  if (event.type === "proposal_accepted") {
    return { title: "Proposta aceita", body: `${limparTextoDaNotificacao(event.coupleName, 60, "O casal")} aceitou a sua proposta. O pedido foi marcado como fechado.`, href };
  }
  if (event.locked) {
    return { title: "Novo pedido de orçamento", body: `Chegou um pedido de ${primeiroNome(event.coupleName)}. Assine o Pro para ver os detalhes e responder.`, href };
  }
  const when = event.weddingDate ? ` para ${formatarDataCivilSemAno(event.weddingDate)}` : "";
  return {
    title: "Novo pedido de orçamento",
    body: `${limparTextoDaNotificacao(event.coupleName, 60, "Um casal")} quer um orçamento${when}. Quem responde rápido sai na frente.`,
    href,
  };
}

function textoDaAvaliacao(event: Evento<"review_new">): TextoDaNotificacao {
  const stars = Math.min(5, Math.max(1, Math.round(event.rating)));
  return {
    title: "Nova avaliação",
    body: `${limparTextoDaNotificacao(event.coupleNames, 60, "Um casal")} deu ${stars} ${stars === 1 ? "estrela" : "estrelas"} para o seu perfil.`,
    href: "/fornecedor/avaliacoes",
  };
}

function textoDoVencimentoDoPlano(event: Evento<"plan_expiring" | "plan_expired">): TextoDaNotificacao {
  if (event.type === "plan_expired") {
    return {
      title: "Seu plano venceu",
      body: `O plano ${limparTextoDaNotificacao(event.planName, 40, "pago")} chegou ao fim e o perfil voltou ao Start, com até 3 pedidos por mês. Renove quando quiser.`,
      href: "/fornecedor/plano",
    };
  }
  const plan = limparTextoDaNotificacao(event.planName, 40, "plano");
  const title = event.daysLeft <= 1 ? "Seu plano vence amanhã" : `Seu plano vence em ${event.daysLeft} dias`;
  return { title, body: `O plano ${plan} está perto de vencer. Renove pelo Pix para não voltar ao Start.`, href: "/fornecedor/plano" };
}

/** Monta título, texto e destino de cada aviso. Sem travessão, sem jargão. */
export function montarTexto(event: EventoDeNotificacao): TextoDaNotificacao {
  switch (event.type) {
    case "gift_paid":
    case "pix_to_check":
    case "expense_due":
      return textoDoDinheiro(event);
    case "rsvp_confirmed":
    case "rsvp_declined":
      return textoDaResposta(event);
    case "domain_registered":
    case "domain_ready":
    case "domain_rejected":
      return textoDoEndereco(event);
    case "plan_activated":
      return textoDoPlanoAtivado(event);
    case "lead_new":
    case "proposal_accepted":
      return textoDoPedido(event);
    case "review_new":
      return textoDaAvaliacao(event);
    case "plan_expiring":
    case "plan_expired":
      return textoDoVencimentoDoPlano(event);
  }
}

/** Uma chave por fato: o mesmo fato nunca avisa duas vezes a mesma pessoa. */
export const removerRepetidos = {
  giftPaid: (transactionId: string) => `gift_paid:${transactionId}`,
  pixToCheck: (transactionId: string) => `pix_to_check:${transactionId}`,
  /** Uma resposta por convidado e dia: quem muda de ideia no mesmo dia não gera outro aviso. */
  rsvp: (status: "confirmed" | "declined", guestId: string, day: string) => `rsvp_${status}:${guestId}:${day}`,
  expense: (expenseId: string, kind: "soon" | "overdue") => `expense_due:${expenseId}:${kind}`,
  planActivated: (subscriptionId: string) => `plan_activated:${subscriptionId}`,
  domainRegistered: (orderId: string) => `domain_registered:${orderId}`,
  domainReady: (orderId: string) => `domain_ready:${orderId}`,
  domainRejected: (orderId: string) => `domain_rejected:${orderId}`,
  leadNew: (leadId: string) => `lead_new:${leadId}`,
  proposalAccepted: (leadId: string) => `proposal_accepted:${leadId}`,
  reviewNew: (reviewKey: string) => `review_new:${reviewKey}`,
  planExpiring: (vendorId: string, periodKey: string, day: number) => `plan_expiring:${vendorId}:${periodKey}:${day}`,
  planExpired: (vendorId: string, periodKey: string) => `plan_expired:${vendorId}:${periodKey}`,
} as const;
