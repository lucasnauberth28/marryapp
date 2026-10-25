/** Uma pessoa da lista de envio: o link do WhatsApp dela já vem pronto do servidor, com a mensagem pessoal. */
export interface LinhaDeConvite {
  id: string;
  name: string;
  /** "2 lugares · ainda não enviado", "2 lugares · convite enviado em 22 set"... */
  detail: string;
  whatsappUrl: string;
  /** "invite" anota o envio no convidado; "reminder" só abre o WhatsApp (lembrete não conta como convite enviado). */
  kind: "invite" | "reminder";
}

export interface PropriedadesDoBlocoDeConvites {
  /** Endereço do convite para copiar e mostrar (sem "https://"). */
  displayUrl: string;
  siteUrl: string;
  /** Link do WhatsApp com a mensagem do convite em geral. */
  generalWhatsappUrl: string;
  generalMessage: string;
  coupleNames: string;
  /** Iniciais do casal ("A&R"), para a prévia sem foto. */
  initials: string;
  /** "17 · abril · 2027" ou null sem data. */
  dateShort: string | null;
  coverUrl: string | null;
  /** Convites no total e quantos já chegaram (enviados pelo painel, pelo WhatsApp do casal, ou já respondidos). */
  invitesTotal: number;
  sentCount: number;
  /** O perfil pode abrir a lista de convidados (envio um a um e lembretes). */
  canSendEach: boolean;
  /** Quem ainda não recebeu o convite (a lista aberta por "Enviar por convidado") e o total real. */
  toInvite: { rows: LinhaDeConvite[]; total: number };
  /** Prazo chegando: mostra quem não respondeu, com "Enviar lembrete". */
  reminders: { rows: LinhaDeConvite[]; total: number; peopleTotal: number } | null;
  /** "Primeiro acesso": ainda não há convidados. */
  firstAccess: boolean;
}
