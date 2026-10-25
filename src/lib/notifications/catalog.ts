// Catálogo dos avisos do Aceito: quais existem, para quem, em que grupo ficam e o texto de cada um.
// Arquivo puro (sem banco nem Next), usado no servidor e no navegador, e testado isoladamente.

export type PublicoDaNotificacao = "couple" | "vendor";

/** Grupos que a pessoa liga e desliga em "Avisos" (Minha conta). */
export const GRUPOS_DE_NOTIFICACAO = ["money", "requests", "reminders", "guests", "account"] as const;
export type GrupoDeNotificacao = (typeof GRUPOS_DE_NOTIFICACAO)[number];

export const ROTULO_DO_GRUPO: Record<GrupoDeNotificacao, { title: string; hint: string }> = {
  money: { title: "Dinheiro e presentes", hint: "Presentes recebidos e Pix para conferir." },
  requests: { title: "Pedidos e propostas", hint: "Novos pedidos de orçamento, propostas aceitas e avaliações." },
  reminders: { title: "Lembretes", hint: "Despesas perto de vencer ou vencidas." },
  guests: { title: "Convidados", hint: "Quem confirmou ou não poderá ir." },
  account: { title: "Plano e conta", hint: "Plano ativado, perto de vencer ou vencido, e o andamento do endereço personalizado do site." },
};

export type TomDaNotificacao = "success" | "info" | "warning" | "alert";
export type IconeDaNotificacao = "gift" | "wallet" | "check" | "x" | "calendar" | "sparkles" | "inbox" | "handshake" | "star" | "clock";

export interface EspecificacaoDoTipoDeNotificacao {
  /** Quem recebe: o casal, o fornecedor ou os dois (plano ativado). */
  audiences: PublicoDaNotificacao[];
  group: GrupoDeNotificacao;
  tone: TomDaNotificacao;
  icon: IconeDaNotificacao;
  /** WhatsApp só para o fornecedor e só para o que não pode esperar. */
  whatsapp: boolean;
  /** Todo aviso pode ir por e-mail, se a pessoa quiser. */
  email: boolean;
  /** Dinheiro entrando não espera o horário de silêncio. */
  ignoresQuietHours: boolean;
}

export const TIPOS_DE_NOTIFICACAO = {
  gift_paid: { audiences: ["couple"], group: "money", tone: "success", icon: "gift", whatsapp: false, email: true, ignoresQuietHours: true },
  pix_to_check: { audiences: ["couple"], group: "money", tone: "warning", icon: "wallet", whatsapp: false, email: true, ignoresQuietHours: false },
  rsvp_confirmed: { audiences: ["couple"], group: "guests", tone: "success", icon: "check", whatsapp: false, email: true, ignoresQuietHours: false },
  rsvp_declined: { audiences: ["couple"], group: "guests", tone: "info", icon: "x", whatsapp: false, email: true, ignoresQuietHours: false },
  expense_due: { audiences: ["couple"], group: "reminders", tone: "warning", icon: "calendar", whatsapp: false, email: true, ignoresQuietHours: false },
  plan_activated: { audiences: ["couple", "vendor"], group: "account", tone: "success", icon: "sparkles", whatsapp: true, email: true, ignoresQuietHours: true },
  domain_registered: { audiences: ["couple"], group: "account", tone: "success", icon: "check", whatsapp: false, email: true, ignoresQuietHours: false },
  domain_ready: { audiences: ["couple"], group: "account", tone: "success", icon: "sparkles", whatsapp: false, email: true, ignoresQuietHours: false },
  domain_rejected: { audiences: ["couple"], group: "account", tone: "warning", icon: "x", whatsapp: false, email: true, ignoresQuietHours: false },
  lead_new: { audiences: ["vendor"], group: "requests", tone: "info", icon: "inbox", whatsapp: true, email: true, ignoresQuietHours: false },
  proposal_accepted: { audiences: ["vendor"], group: "requests", tone: "success", icon: "handshake", whatsapp: false, email: true, ignoresQuietHours: false },
  review_new: { audiences: ["vendor"], group: "requests", tone: "info", icon: "star", whatsapp: false, email: true, ignoresQuietHours: false },
  plan_expiring: { audiences: ["vendor"], group: "account", tone: "warning", icon: "clock", whatsapp: true, email: true, ignoresQuietHours: false },
  plan_expired: { audiences: ["vendor"], group: "account", tone: "alert", icon: "clock", whatsapp: false, email: true, ignoresQuietHours: false },
} as const satisfies Record<string, EspecificacaoDoTipoDeNotificacao>;

export type TipoDeNotificacao = keyof typeof TIPOS_DE_NOTIFICACAO;

export function ehTipoDeNotificacao(value: unknown): value is TipoDeNotificacao {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(TIPOS_DE_NOTIFICACAO, value);
}

/** Spec de um tipo qualquer vindo do banco (tipo desconhecido, de uma versão futura, cai no neutro). */
export function especificacaoDe(type: string): EspecificacaoDoTipoDeNotificacao {
  return ehTipoDeNotificacao(type)
    ? TIPOS_DE_NOTIFICACAO[type]
    : { audiences: ["couple", "vendor"], group: "account", tone: "info", icon: "sparkles", whatsapp: false, email: false, ignoresQuietHours: false };
}

/** Grupos que fazem sentido para cada painel (o fornecedor não vê "Convidados"). */
export function gruposPara(audience: PublicoDaNotificacao): GrupoDeNotificacao[] {
  const present = new Set<GrupoDeNotificacao>();
  for (const spec of Object.values(TIPOS_DE_NOTIFICACAO) as EspecificacaoDoTipoDeNotificacao[]) {
    if (spec.audiences.includes(audience)) present.add(spec.group);
  }
  return GRUPOS_DE_NOTIFICACAO.filter((g) => present.has(g));
}
