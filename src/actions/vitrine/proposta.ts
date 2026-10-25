"use server";

// Aceite da proposta pelo casal (link /proposta/<token>).
import { createHmac, createHash } from "node:crypto";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { conferirLimiteDeUso, obterIpDoCliente } from "@/lib/security/rate-limiter";
import { normalizarTexto } from "@/lib/security/sanitize";
import { avisarDepois } from "@/lib/notifications/service";
import { avisarPropostaAceita } from "@/lib/notifications/events";
import { hojeEmBrasilia } from "@/app/(fornecedor)/_lib/datas-do-painel";
import { PADRAO_DO_TOKEN_PUBLICO } from "@/app/(fornecedor)/_lib/links-publicos";

const LIMITE_DE_ACEITE_DE_PROPOSTA = { limit: 10, windowMs: 1000 * 60 * 10 }; // 10 tentativas / 10 min por IP

/** Hash do IP (prova do aceite sem guardar o IP em claro). */
function calcularHashDoIp(ip: string): string {
  const secret = process.env.JWT_SECRET;
  return secret
    ? createHmac("sha256", secret).update(`proposta:${ip}`).digest("hex")
    : createHash("sha256").update(`proposta:${ip}`).digest("hex");
}

const EsquemaDoAceiteDaProposta = z.object({
  token: z.string().regex(PADRAO_DO_TOKEN_PUBLICO, "Link inválido."),
  fullName: z
    .string({ message: "Informe seu nome completo." })
    .trim()
    .min(5, "Informe seu nome completo.")
    .max(120, "Use até 120 caracteres no nome.")
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, "Informe nome e sobrenome."),
  agreed: z.literal(true, { message: "Marque “Li e aceito esta proposta” para continuar." }),
});

export type EntradaDoAceiteDaProposta = { token: string; fullName: string; agreed: boolean };
export type ResultadoDoAceiteDaProposta = { success: true; acceptedAt: string; name: string } | { success: false; error: string };

type PedidoDaProposta = NonNullable<Awaited<ReturnType<typeof buscarPropostaDoToken>>>;

function buscarPropostaDoToken(token: string) {
  return prisma.vendorLead.findUnique({
    where: { proposalToken: token },
    select: {
      id: true,
      vendorId: true,
      status: true,
      locked: true,
      proposalSentAt: true,
      proposalAmount: true,
      proposalValidUntil: true,
      proposalAcceptedAt: true,
      respondedAt: true,
    },
  });
}

/** Por que a proposta não pode ser aceita agora (null = pode). */
function motivoDeIndisponibilidade(lead: PedidoDaProposta | null): string | null {
  if (!lead || lead.locked || !lead.proposalSentAt || lead.proposalAmount == null) return "Proposta não encontrada.";
  if (lead.proposalAcceptedAt) return "Esta proposta já foi aceita.";
  if (lead.status === "DECLINED") return "Esta proposta não está mais disponível.";
  if (lead.proposalValidUntil && lead.proposalValidUntil < hojeEmBrasilia()) return "O prazo desta proposta já passou. Fale com o fornecedor para renová-la.";
  return null;
}

/** Pública: o casal aceita a proposta registrada pelo fornecedor. */
export async function aceitarPropostaDoPedido(input: EntradaDoAceiteDaProposta): Promise<ResultadoDoAceiteDaProposta> {
  const parsed = EsquemaDoAceiteDaProposta.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const { token, fullName } = parsed.data;

  try {
    const ip = await obterIpDoCliente();
    const rateLimit = await conferirLimiteDeUso({ key: `PROPOSAL_ACCEPT:${ip}`, ...LIMITE_DE_ACEITE_DE_PROPOSTA });
    if (!rateLimit.success) {
      return { success: false, error: "Muitas tentativas em pouco tempo. Tente novamente daqui a alguns minutos." };
    }

    const lead = await buscarPropostaDoToken(token);
    const indisponivel = motivoDeIndisponibilidade(lead);
    if (indisponivel || !lead) return { success: false, error: indisponivel ?? "Proposta não encontrada." };

    const now = new Date();
    const name = normalizarTexto(fullName);
    // Condições repetidas no update: duas abas aceitando ao mesmo tempo gravam só uma vez.
    const result = await prisma.vendorLead.updateMany({
      where: { id: lead.id, proposalToken: token, proposalAcceptedAt: null, locked: false, status: { not: "DECLINED" } },
      data: {
        proposalAcceptedAt: now,
        proposalAcceptedName: name,
        proposalAcceptedIp: calcularHashDoIp(ip),
        status: "CLOSED",
        closedAt: now,
        declinedAt: null,
        ...(!lead.respondedAt ? { respondedAt: now } : {}),
      },
    });
    if (result.count === 0) return { success: false, error: "Esta proposta já foi aceita." };

    avisarDepois(() => avisarPropostaAceita(lead.id));

    return { success: true, acceptedAt: now.toISOString(), name };
  } catch (error) {
    console.error("[acceptLeadProposal Error]:", error);
    return { success: false, error: "Não foi possível registrar o aceite. Tente novamente." };
  }
}
