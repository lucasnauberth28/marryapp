// Funções puras da página de mensagens: tipo, links, telefone e a escolha de quem recebe.
import type { Guest } from "@prisma/client";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import { ehSoPresentePendente } from "@/lib/convidados/guest-origin";
import { urlDoSiteDoCasamento } from "@/lib/casamento/wedding-links";
import type { ItemDeLink, Publico } from "./tipos";

const ROTULO_DO_TIPO: Record<string, string> = {
  INITIAL_INVITE: "Convite inicial",
  RSVP_REMINDER: "Lembrete de confirmação",
  CUSTOM: "Personalizada",
};

export const rotuloDoTipo = (t?: string | null) => ROTULO_DO_TIPO[t ?? "CUSTOM"] ?? "Personalizada";

export function interpretarLinks(raw?: string | null): ItemDeLink[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const temTelefone = (g: Guest) => !!g.phone && somenteDigitos(g.phone).length >= 8;

/** Quem recebe em cada grupo. Quem só presenteou não foi convidado pelo casal: fica fora dos grupos (só escolhendo à mão). */
export function idsPara(publico: Publico, convidados: Guest[]): string[] {
  const comTelefone = convidados.filter(temTelefone);
  const convidadosDoCasal = comTelefone.filter((g) => !ehSoPresentePendente(g));
  switch (publico) {
    case "pending":
      return convidadosDoCasal.filter((g) => g.rsvpStatus === "PENDING").map((g) => g.id);
    case "unsent":
      return convidadosDoCasal.filter((g) => !g.hasReceivedMessage).map((g) => g.id);
    case "confirmed":
      return comTelefone.filter((g) => g.rsvpStatus === "CONFIRMED").map((g) => g.id);
    case "all":
      return comTelefone.map((g) => g.id);
    default:
      return [];
  }
}

export function linksParaPrevia(links: ItemDeLink[], slug: string, customDomain?: string | null) {
  return links
    .filter((l) => l.text.trim())
    .map((l) => {
      const dePresente = l.text.toLowerCase().includes("presente") || l.id === "gifts";
      return { text: l.text, url: urlDoSiteDoCasamento(slug, dePresente ? "presentes" : "rsvp", customDomain) };
    });
}
