// "Primeiros passos" do Resumo: itens derivados de DADOS REAIS do casamento (nada de estado inventado).
import { temAcessoAoCaminho } from "../permissions.ts";

export interface DadosDosPrimeirosPassos {
  allowedPaths: readonly string[];
  /** Linha do site (SiteCustomization), ou null. */
  site: {
    locationName: string | null;
    locationAddress: string | null;
    ceremonyTime: string | null;
    receptionTime: string | null;
    welcomeMessage: string | null;
    heroImageUrl: string | null;
    couplePhotoUrl: string | null;
  } | null;
  /** Convidados que são convite de verdade (quem só presenteou e não respondeu não conta). */
  guestCount: number;
  /** Convidados que já receberam mensagem enviada pelo painel. */
  invitedByPanel: number;
  giftCount: number;
  /** O plano inclui os convites pelo WhatsApp. */
  canWhatsApp: boolean;
  /** Esta pessoa já dispensou a lista. */
  dismissed: boolean;
}

export interface ItemDosPrimeirosPassos {
  id: "site" | "guest" | "gift" | "invite";
  label: string;
  href: string;
  action: string;
  done: boolean;
}

const estaPreenchido = (v: string | null | undefined) => Boolean(v && v.trim());

/** O casal já preencheu alguma informação do site além dos nomes? (local, horário, mensagem ou foto) */
export function dadosDoSitePreenchidos(site: DadosDosPrimeirosPassos["site"]): boolean {
  if (!site) return false;
  return [site.locationName, site.locationAddress, site.ceremonyTime, site.receptionTime, site.welcomeMessage, site.heroImageUrl, site.couplePhotoUrl].some(estaPreenchido);
}

/** Todos os itens que esta pessoa pode abrir, na ordem em que fazem sentido. */
export function itensDosPrimeirosPassos(d: DadosDosPrimeirosPassos): ItemDosPrimeirosPassos[] {
  const opens = (href: string) => temAcessoAoCaminho([...d.allowedPaths], href);
  const items: ItemDosPrimeirosPassos[] = [];
  if (opens("/site-builder")) items.push({ id: "site", label: "Preencher as informações do site", href: "/site-builder", action: "Editar o site", done: dadosDoSitePreenchidos(d.site) });
  if (opens("/convidados")) items.push({ id: "guest", label: "Adicionar o primeiro convidado", href: "/convidados", action: "Adicionar convidado", done: d.guestCount > 0 });
  if (opens("/presentes-admin")) items.push({ id: "gift", label: "Criar o primeiro presente em dinheiro", href: "/presentes-admin", action: "Criar presente", done: d.giftCount > 0 });
  if (d.canWhatsApp && opens("/mensagens")) items.push({ id: "invite", label: "Enviar o primeiro convite pelo WhatsApp", href: "/mensagens", action: "Abrir Mensagens", done: d.invitedByPanel > 0 });
  return items;
}

export interface VisaoDosPrimeirosPassos {
  items: ItemDosPrimeirosPassos[];
  doneCount: number;
}

/** O que mostrar no Resumo, ou null quando a lista não deve aparecer (dispensada, vazia ou tudo feito). */
export function visaoDosPrimeirosPassos(d: DadosDosPrimeirosPassos): VisaoDosPrimeirosPassos | null {
  if (d.dismissed) return null;
  const items = itensDosPrimeirosPassos(d);
  const doneCount = items.filter((i) => i.done).length;
  if (items.length === 0 || doneCount === items.length) return null;
  return { items, doneCount };
}
