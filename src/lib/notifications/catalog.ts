// Catálogo dos avisos do Aceito: quais existem, para quem, em que grupo ficam e o texto de cada um.
// Arquivo puro (sem banco nem Next), usado no servidor e no navegador, e testado isoladamente.

export type NotificationAudience = "couple" | "vendor";

/** Grupos que a pessoa liga e desliga em "Avisos" (Minha conta). */
export const NOTIFICATION_GROUPS = ["money", "requests", "reminders", "guests", "account"] as const;
export type NotificationGroup = (typeof NOTIFICATION_GROUPS)[number];

export const GROUP_LABEL: Record<NotificationGroup, { title: string; hint: string }> = {
  money: { title: "Dinheiro e presentes", hint: "Presentes recebidos e Pix para conferir." },
  requests: { title: "Pedidos e propostas", hint: "Novos pedidos de orçamento, propostas aceitas e avaliações." },
  reminders: { title: "Lembretes", hint: "Despesas perto de vencer ou vencidas." },
  guests: { title: "Convidados", hint: "Quem confirmou ou não poderá ir." },
  account: { title: "Plano e conta", hint: "Plano ativado, perto de vencer ou vencido." },
};

export type NotificationTone = "success" | "info" | "warning" | "alert";
export type NotificationIcon = "gift" | "wallet" | "check" | "x" | "calendar" | "sparkles" | "inbox" | "handshake" | "star" | "clock";

export interface NotificationTypeSpec {
  /** Quem recebe: o casal, o fornecedor ou os dois (plano ativado). */
  audiences: NotificationAudience[];
  group: NotificationGroup;
  tone: NotificationTone;
  icon: NotificationIcon;
  /** WhatsApp só para o fornecedor e só para o que não pode esperar. */
  whatsapp: boolean;
  /** Todo aviso pode ir por e-mail, se a pessoa quiser. */
  email: boolean;
  /** Dinheiro entrando não espera o horário de silêncio. */
  ignoresQuietHours: boolean;
}

export const NOTIFICATION_TYPES = {
  gift_paid: { audiences: ["couple"], group: "money", tone: "success", icon: "gift", whatsapp: false, email: true, ignoresQuietHours: true },
  pix_to_check: { audiences: ["couple"], group: "money", tone: "warning", icon: "wallet", whatsapp: false, email: true, ignoresQuietHours: false },
  rsvp_confirmed: { audiences: ["couple"], group: "guests", tone: "success", icon: "check", whatsapp: false, email: true, ignoresQuietHours: false },
  rsvp_declined: { audiences: ["couple"], group: "guests", tone: "info", icon: "x", whatsapp: false, email: true, ignoresQuietHours: false },
  expense_due: { audiences: ["couple"], group: "reminders", tone: "warning", icon: "calendar", whatsapp: false, email: true, ignoresQuietHours: false },
  plan_activated: { audiences: ["couple", "vendor"], group: "account", tone: "success", icon: "sparkles", whatsapp: true, email: true, ignoresQuietHours: true },
  lead_new: { audiences: ["vendor"], group: "requests", tone: "info", icon: "inbox", whatsapp: true, email: true, ignoresQuietHours: false },
  proposal_accepted: { audiences: ["vendor"], group: "requests", tone: "success", icon: "handshake", whatsapp: false, email: true, ignoresQuietHours: false },
  review_new: { audiences: ["vendor"], group: "requests", tone: "info", icon: "star", whatsapp: false, email: true, ignoresQuietHours: false },
  plan_expiring: { audiences: ["vendor"], group: "account", tone: "warning", icon: "clock", whatsapp: true, email: true, ignoresQuietHours: false },
  plan_expired: { audiences: ["vendor"], group: "account", tone: "alert", icon: "clock", whatsapp: false, email: true, ignoresQuietHours: false },
} as const satisfies Record<string, NotificationTypeSpec>;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(NOTIFICATION_TYPES, value);
}

/** Spec de um tipo qualquer vindo do banco (tipo desconhecido, de uma versão futura, cai no neutro). */
export function specOf(type: string): NotificationTypeSpec {
  return isNotificationType(type)
    ? NOTIFICATION_TYPES[type]
    : { audiences: ["couple", "vendor"], group: "account", tone: "info", icon: "sparkles", whatsapp: false, email: false, ignoresQuietHours: false };
}

/** Grupos que fazem sentido para cada painel (o fornecedor não vê "Convidados"). */
export function groupsFor(audience: NotificationAudience): NotificationGroup[] {
  const present = new Set<NotificationGroup>();
  for (const spec of Object.values(NOTIFICATION_TYPES) as NotificationTypeSpec[]) {
    if (spec.audiences.includes(audience)) present.add(spec.group);
  }
  return NOTIFICATION_GROUPS.filter((g) => present.has(g));
}

// ==========================================
// TEXTOS
// ==========================================

export type NotificationEvent =
  | { type: "gift_paid"; guestName: string | null; giftTitle: string; amountCents: number }
  | { type: "pix_to_check"; guestName: string | null; giftTitle: string; amountCents: number }
  | { type: "rsvp_confirmed"; guestName: string; companions: number }
  | { type: "rsvp_declined"; guestName: string }
  | { type: "expense_due"; description: string; amountCents: number; dueDate: Date; overdue: boolean }
  | { type: "plan_activated"; audience: NotificationAudience; planName: string; periodEnd?: Date | null }
  | { type: "lead_new"; leadId: string; coupleName: string; locked: boolean; weddingDate?: Date | null }
  | { type: "proposal_accepted"; leadId: string; coupleName: string }
  | { type: "review_new"; coupleNames: string; rating: number }
  | { type: "plan_expiring"; planName: string; daysLeft: number }
  | { type: "plan_expired"; planName: string };

export interface NotificationCopy {
  title: string;
  body: string;
  href: string;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
// Datas de vencimento e de casamento ficam gravadas à meia-noite UTC: formatar em UTC evita voltar um dia.
const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" });

/** Nomes digitados por convidados e casais entram no texto: limita o tamanho e tira quebras de linha. */
export function clean(value: string | null | undefined, max = 60, fallback = ""): string {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

const firstName = (name: string) => clean(name.split(/[\s&,]+/)[0], 30, "Um casal");

/** Monta título, texto e destino de cada aviso. Sem travessão, sem jargão. */
export function buildCopy(event: NotificationEvent): NotificationCopy {
  switch (event.type) {
    case "gift_paid": {
      const who = clean(event.guestName, 60, "Um convidado");
      return {
        title: "Presente recebido",
        body: `${who} deu "${clean(event.giftTitle, 60, "um presente")}" para vocês (${brl.format(event.amountCents / 100)}).`,
        href: "/financas",
      };
    }
    case "pix_to_check": {
      const who = clean(event.guestName, 60, "Um convidado");
      return {
        title: "Pix para conferir",
        body: `${who} gerou um Pix de ${brl.format(event.amountCents / 100)} para "${clean(event.giftTitle, 60, "um presente")}". Quando cair na conta de vocês, confirme em Finanças.`,
        href: "/financas",
      };
    }
    case "rsvp_confirmed": {
      const who = clean(event.guestName, 60, "Um convidado");
      const body =
        event.companions > 0
          ? `${who} e mais ${event.companions} ${event.companions === 1 ? "pessoa" : "pessoas"} vão ao casamento.`
          : `${who} vai ao casamento.`;
      return { title: "Presença confirmada", body, href: "/convidados" };
    }
    case "rsvp_declined":
      return {
        title: "Recado de um convidado",
        body: `${clean(event.guestName, 60, "Um convidado")} avisou que não poderá ir.`,
        href: "/convidados",
      };
    case "expense_due": {
      const what = `"${clean(event.description, 60, "Despesa")}" (${brl.format(event.amountCents / 100)})`;
      return event.overdue
        ? { title: "Despesa vencida", body: `${what} venceu em ${shortDate.format(event.dueDate)}.`, href: "/financas" }
        : { title: "Despesa perto de vencer", body: `${what} vence em ${shortDate.format(event.dueDate)}.`, href: "/financas" };
    }
    case "plan_activated": {
      const plan = clean(event.planName, 40, "novo plano");
      if (event.audience === "vendor") {
        const until = event.periodEnd ? ` até ${longDate.format(event.periodEnd)}` : "";
        return {
          title: "Plano ativado",
          body: `Pagamento confirmado. O plano ${plan} já está valendo${until}.`,
          href: "/fornecedor/plano",
        };
      }
      return { title: "Plano ativado", body: `O plano ${plan} já está valendo para o casamento de vocês.`, href: "/plano" };
    }
    case "lead_new": {
      const href = `/fornecedor/pedidos/${event.leadId}`;
      if (event.locked) {
        return {
          title: "Novo pedido de orçamento",
          body: `Chegou um pedido de ${firstName(event.coupleName)}. Assine o Pro para ver os detalhes e responder.`,
          href,
        };
      }
      const when = event.weddingDate ? ` para ${longDate.format(event.weddingDate)}` : "";
      return {
        title: "Novo pedido de orçamento",
        body: `${clean(event.coupleName, 60, "Um casal")} quer um orçamento${when}. Quem responde rápido sai na frente.`,
        href,
      };
    }
    case "proposal_accepted":
      return {
        title: "Proposta aceita",
        body: `${clean(event.coupleName, 60, "O casal")} aceitou a sua proposta. O pedido foi marcado como fechado.`,
        href: `/fornecedor/pedidos/${event.leadId}`,
      };
    case "review_new": {
      const stars = Math.min(5, Math.max(1, Math.round(event.rating)));
      return {
        title: "Nova avaliação",
        body: `${clean(event.coupleNames, 60, "Um casal")} deu ${stars} ${stars === 1 ? "estrela" : "estrelas"} para o seu perfil.`,
        href: "/fornecedor/avaliacoes",
      };
    }
    case "plan_expiring": {
      const plan = clean(event.planName, 40, "plano");
      const title = event.daysLeft <= 1 ? "Seu plano vence amanhã" : `Seu plano vence em ${event.daysLeft} dias`;
      return {
        title,
        body: `O plano ${plan} está perto de vencer. Renove pelo Pix para não voltar ao Start.`,
        href: "/fornecedor/plano",
      };
    }
    case "plan_expired":
      return {
        title: "Seu plano venceu",
        body: `O plano ${clean(event.planName, 40, "pago")} chegou ao fim e o perfil voltou ao Start, com até 3 pedidos por mês. Renove quando quiser.`,
        href: "/fornecedor/plano",
      };
  }
}

// ==========================================
// CHAVES DE DEDUPLICAÇÃO
// ==========================================

/** Uma chave por fato: o mesmo fato nunca avisa duas vezes a mesma pessoa. */
export const dedupe = {
  giftPaid: (transactionId: string) => `gift_paid:${transactionId}`,
  pixToCheck: (transactionId: string) => `pix_to_check:${transactionId}`,
  /** Uma resposta por convidado e dia: quem muda de ideia no mesmo dia não gera outro aviso. */
  rsvp: (status: "confirmed" | "declined", guestId: string, day: string) => `rsvp_${status}:${guestId}:${day}`,
  expense: (expenseId: string, kind: "soon" | "overdue") => `expense_due:${expenseId}:${kind}`,
  planActivated: (subscriptionId: string) => `plan_activated:${subscriptionId}`,
  leadNew: (leadId: string) => `lead_new:${leadId}`,
  proposalAccepted: (leadId: string) => `proposal_accepted:${leadId}`,
  reviewNew: (reviewKey: string) => `review_new:${reviewKey}`,
  planExpiring: (vendorId: string, periodKey: string, day: number) => `plan_expiring:${vendorId}:${periodKey}:${day}`,
  planExpired: (vendorId: string, periodKey: string) => `plan_expired:${vendorId}:${periodKey}`,
} as const;
