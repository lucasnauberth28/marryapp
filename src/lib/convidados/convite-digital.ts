import "server-only";
import prisma from "@/lib/prisma";
import { urlDoSiteDoCasamento } from "@/lib/casamento/wedding-links";
import { casamentoTemModulo } from "@/lib/casamento/wedding-plan";
import { gerarCodigoDoConvite, lerCodigoDoConvite } from "./codigo-do-convite";

// Convite digital animado: links personalizados por convidado e leitura do código na página pública.

/** O mesmo segredo da sessão (em produção ele é obrigatório; em desenvolvimento há um padrão). */
function segredoDoConvite(): string {
  return process.env.JWT_SECRET || "dev_only_insecure_secret_do_not_use_in_production";
}

export interface EscolhasDoConvite {
  /** O nome de cada convidado aparece no convite? */
  guestName: boolean;
  /** Frase do casal no convite (nula: a frase padrão). */
  message: string | null;
}

export async function escolhasDoConvite(weddingId: string): Promise<EscolhasDoConvite> {
  const site = await prisma.siteCustomization.findUnique({ where: { weddingId }, select: { inviteGuestName: true, inviteMessage: true } });
  return { guestName: site?.inviteGuestName ?? true, message: site?.inviteMessage?.trim() || null };
}

/**
 * Link do convite digital. Com `incluirNome`, leva o código do convidado (a página mostra o nome dele);
 * sem, é o mesmo link para todos.
 */
export function linkDoConviteDigital(wedding: { slug: string; customDomain?: string | null }, guestId: string, incluirNome: boolean): string {
  const base = urlDoSiteDoCasamento(wedding.slug, "convite", wedding.customDomain);
  const codigo = incluirNome ? gerarCodigoDoConvite(guestId, segredoDoConvite()) : null;
  return codigo ? `${base}?c=${codigo}` : base;
}

/** Nome do convidado de um código válido deste casamento; null para código ausente, inválido ou de outro casamento. */
export async function nomeDoConvidadoPeloCodigo(weddingId: string, codigo: unknown): Promise<string | null> {
  const guestId = lerCodigoDoConvite(codigo, segredoDoConvite());
  if (!guestId) return null;
  const guest = await prisma.guest.findFirst({ where: { id: guestId, weddingId }, select: { name: true } });
  return guest?.name.trim() || null;
}

/**
 * Para os envios de WhatsApp: a função que dá o link do convite de cada convidado, ou null quando o plano
 * do casal não tem o convite digital (Básico e plano adaptado).
 */
export async function geradorDeLinksDoConvite(
  ctx: { weddingId: string; session: Parameters<typeof casamentoTemModulo>[0]["session"] },
  wedding: { slug: string; customDomain?: string | null },
): Promise<((guestId: string) => string) | null> {
  if (!(await casamentoTemModulo(ctx, "convite"))) return null;
  const { guestName } = await escolhasDoConvite(ctx.weddingId);
  return (guestId) => linkDoConviteDigital(wedding, guestId, guestName);
}

/** A linha que leva o convite na mensagem. */
export const linhaDoConviteNaMensagem = (link: string) => `💌 *Abra o seu convite:*\n${link}`;
