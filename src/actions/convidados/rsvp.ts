"use server";

// RSVP público: achar o convite pelo telefone e confirmar ou recusar presença (só no casamento do endereço).
import { obterCasamentoPeloEndereco } from "@/lib/security/wedding-context";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { RsvpStatus } from "@prisma/client";
import { limitarUsoPorIp } from "@/lib/security/rate-limiter";
import { avisarDepois } from "@/lib/notifications/service";
import { avisarConfirmacao } from "@/lib/notifications/events";
import { MENSAGEM_DE_MUITAS_TENTATIVAS } from "@/lib/rate-limit-message";
import type { BuscaDeConvidado } from "@/lib/convidados/rsvp-lookup";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import { ERROS } from "@/lib/mensagens-de-erro";

/**
 * Pública: localiza o convite pelo telefone, só dentro do casamento do endereço (slug).
 * Retorna apenas o necessário para o RSVP.
 */
export async function acharConvidadoPeloTelefone(slug: string, phone: string): Promise<BuscaDeConvidado> {
  if (typeof slug !== "string" || typeof phone !== "string") return { status: "not_found" };
  const cleanPhone = somenteDigitos(phone);
  if (cleanPhone.length < 10 || cleanPhone.length > 13) return { status: "invalid_phone" };

  // Limite de tentativas: resposta própria (não pode parecer "convite não encontrado")
  const rateLimit = await limitarUsoPorIp("RSVP");
  if (!rateLimit.success) return { status: "rate_limited" };

  const wedding = await obterCasamentoPeloEndereco(slug);
  if (!wedding || wedding.suspendedAt) return { status: "not_found" };

  const guest = await prisma.guest.findFirst({
    where: { weddingId: wedding.id, phone: { endsWith: cleanPhone } },
    select: {
      id: true,
      name: true,
      allowedCompanions: true,
      rsvpStatus: true,
      dietaryRestrictions: true,
    },
  });

  return guest ? { status: "found", guest } : { status: "not_found" };
}

const EsquemaDaConfirmacaoPublica = z.object({
  slug: z.string().min(1).max(100),
  id: z.string().uuid(),
  status: z.enum(["CONFIRMED", "DECLINED"]),
  confirmedCompanions: z.coerce.number().int().min(0).max(50),
  companionsNames: z.string().max(1000).optional().default(""),
  dietaryRestrictions: z.string().max(500).optional(),
});

type Confirmacao = z.output<typeof EsquemaDaConfirmacaoPublica>;

/** Avisa o casal só quando a resposta mudou (reenviar o mesmo formulário não vira outro aviso). */
function avisarSeMudou(weddingId: string, guest: { id: string; name: string; rsvpStatus: RsvpStatus }, data: Confirmacao) {
  if (guest.rsvpStatus === data.status) return;
  avisarDepois(() =>
    avisarConfirmacao({
      weddingId,
      guestId: guest.id,
      guestName: guest.name,
      status: data.status,
      companions: data.status === "CONFIRMED" ? data.confirmedCompanions : 0,
    }),
  );
}

/** Pública: confirma ou recusa o convite de um convidado do casamento do endereço (slug). */
export async function confirmarPresencaPublica(
  slug: string,
  id: string,
  status: RsvpStatus,
  confirmedCompanions: number,
  companionsNames: string,
  dietaryRestrictions?: string
) {
  const parsed = EsquemaDaConfirmacaoPublica.safeParse({ slug, id, status, confirmedCompanions, companionsNames, dietaryRestrictions });
  if (!parsed.success) return { success: false, error: "Dados de confirmação inválidos." };
  const data = parsed.data;

  try {
    const rateLimit = await limitarUsoPorIp("RSVP");
    if (!rateLimit.success) return { success: false, error: MENSAGEM_DE_MUITAS_TENTATIVAS };

    const wedding = await obterCasamentoPeloEndereco(data.slug);
    if (!wedding) return { success: false, error: ERROS.convidadoNaoEncontrado };
    if (wedding.suspendedAt) return { success: false, error: "Este site está indisponível no momento." };

    const guest = await prisma.guest.findFirst({ where: { id: data.id, weddingId: wedding.id } });
    if (!guest) return { success: false, error: ERROS.convidadoNaoEncontrado };

    if (data.status === "CONFIRMED" && data.confirmedCompanions > guest.allowedCompanions) {
      return { success: false, error: `Você só pode levar até ${guest.allowedCompanions} acompanhante(s).` };
    }

    const result = await prisma.guest.updateMany({
      where: { id: guest.id, weddingId: wedding.id },
      data: {
        rsvpStatus: data.status,
        confirmedCompanions: data.status === "CONFIRMED" ? data.confirmedCompanions : 0,
        companionsNames: data.status === "CONFIRMED" ? (data.companionsNames.trim() || null) : null,
        dietaryRestrictions: data.dietaryRestrictions?.trim() || null,
      },
    });
    if (result.count === 0) return { success: false, error: ERROS.convidadoNaoEncontrado };

    avisarSeMudou(wedding.id, guest, data);
    revalidatePath("/convidados");
    return { success: true };
  } catch (error) {
    console.error("[publicConfirmRsvp]", error);
    return { success: false, error: "Erro ao confirmar presença." };
  }
}
