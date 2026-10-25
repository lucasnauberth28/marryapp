import { chaveDoDiaDe, convidadosParaConvidar, convidadosParaLembrar, conviteChegou, lugaresDe, rotuloCurtoDoDia, type LinhaDeConvidado } from "@/lib/dashboard-summary";
import { linkDoWhatsapp, textoDoConviteGeral, textoDoConvitePessoal, textoDoLembrete } from "@/lib/invite-share";
import { urlDoSiteDoCasamento } from "@/lib/wedding-links";
import type { LinhaDeConvite } from "../blocos/convite/tipos";
import type { DadosDoResumo } from "./carregar-dados";
import type { ContasDoResumo } from "./contas";
import { EXIBIDOS_NAS_LISTAS, MESES, textoDosLugares, type ContextoDaPagina, type IdentidadeDoCasamento } from "./tipos";

interface EntradaDoConvite {
  identity: IdentidadeDoCasamento;
  wedding: ContextoDaPagina["wedding"];
  rsvpDeadline: Date | null;
}

/** Uma pessoa da lista de envio, com o link do WhatsApp e a mensagem pessoal prontos. */
function linhaDeConvite(g: LinhaDeConvidado, kind: LinhaDeConvite["kind"], { identity, rsvpDeadline, rsvpUrl }: Pick<EntradaDoConvite, "identity" | "rsvpDeadline"> & { rsvpUrl: string }): LinhaDeConvite {
  const text =
    kind === "reminder"
      ? textoDoLembrete({ guestName: g.name, coupleNames: identity.coupleNames, deadline: rsvpDeadline, url: rsvpUrl })
      : textoDoConvitePessoal({ guestName: g.name, coupleNames: identity.coupleNames, weddingDate: identity.weddingDate, url: rsvpUrl });
  const status = !conviteChegou(g) ? "convite ainda não enviado" : g.inviteSharedAt ? `convite enviado em ${rotuloCurtoDoDia(chaveDoDiaDe(g.inviteSharedAt))}` : "convite enviado";
  return { id: g.id, name: g.name, detail: `${textoDosLugares(lugaresDe(g))} · ${g.phone ? status : "sem telefone cadastrado"}`, whatsappUrl: linkDoWhatsapp(g.phone, text), kind };
}

/** O que o bloco do convite precisa: endereços, mensagem geral e as listas de quem convidar e de quem lembrar. */
export function montarConviteDoResumo(contas: ContasDoResumo, dados: DadosDoResumo, entrada: Omit<EntradaDoConvite, "rsvpDeadline">) {
  const { identity, wedding } = entrada;
  const rsvpDeadline = dados.settings?.rsvpDeadline ?? null;
  const slug = identity.slug ?? wedding.slug;
  const siteUrl = urlDoSiteDoCasamento(slug, undefined, wedding.customDomain);
  const rsvpUrl = urlDoSiteDoCasamento(slug, "rsvp", wedding.customDomain);
  const generalMessage = textoDoConviteGeral({ coupleNames: identity.coupleNames, weddingDate: identity.weddingDate, city: wedding.city, url: siteUrl });
  const linha = (g: LinhaDeConvidado, kind: LinhaDeConvite["kind"]) => linhaDeConvite(g, kind, { identity, rsvpDeadline, rsvpUrl });
  const toInvite = convidadosParaConvidar(contas.guests);
  const toRemind = convidadosParaLembrar(contas.guests);
  const { deadline } = contas;
  const reminding = (deadline.state === "soon" || deadline.state === "today" || deadline.state === "passed") && toRemind.length > 0;
  const data = identity.weddingDate;
  return {
    siteUrl, generalMessage, reminding,
    generalWhatsappUrl: linkDoWhatsapp(null, generalMessage),
    dateShort: data ? `${data.getUTCDate()} · ${MESES[data.getUTCMonth()]} · ${data.getUTCFullYear()}` : null,
    toInvite: { rows: toInvite.slice(0, EXIBIDOS_NAS_LISTAS).map((g) => linha(g, "invite")), total: toInvite.length },
    reminders: reminding ? { rows: toRemind.slice(0, EXIBIDOS_NAS_LISTAS).map((g) => linha(g, conviteChegou(g) ? "reminder" : "invite")), total: toRemind.length, peopleTotal: contas.counts.people.pending } : null,
    deadlineChip: deadline.state === "soon" ? `Prazo em ${deadline.days} ${deadline.days === 1 ? "dia" : "dias"}` : deadline.state === "today" ? "O prazo termina hoje" : deadline.state === "passed" ? "Prazo vencido" : null,
  };
}

export type ConviteDoResumo = ReturnType<typeof montarConviteDoResumo>;
