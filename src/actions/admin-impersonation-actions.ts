"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { exigirSessaoAutenticada } from "@/lib/security/auth-guard";
import { ehAcessoDeAdminDaPlataforma } from "@/lib/permissions";
import { nomeDeExibicaoDoAdmin, opcoesDoCookieDePersonificacao } from "@/lib/security/impersonation";
import {
  COOKIE_DE_PERSONIFICACAO,
  validadeDaPersonificacao,
  ehMotivoDePersonificacao,
  assinarCookieDePersonificacao,
  verificarCookieDePersonificacao,
} from "@/lib/security/impersonation-rules";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";

import { ERROS } from "@/lib/mensagens-de-erro";
// "Entrar como este casal": início e fim da sessão. A pessoa vem sempre da sessão de login (nunca do navegador);
// o cookie é assinado e guarda só o id da ImpersonationSession; tudo confere de novo no banco (impersonation.ts).

export type ResultadoDaPersonificacao = { success: true; redirectTo: string } | { success: false; error: string };

const EsquemaDoInicio = z.object({
  weddingId: z.string().uuid("Casamento inválido."),
  reason: z.string().refine(ehMotivoDePersonificacao, "Escolha o motivo da entrada."),
  ticketNumber: z.number().int().positive().max(2_000_000_000).nullable(),
  canEdit: z.boolean(),
  /** Segunda confirmação de "Permitir editar": obrigatória quando canEdit é verdadeiro. */
  confirmEdit: z.boolean(),
});

export async function iniciarPersonificacao(input: unknown): Promise<ResultadoDaPersonificacao> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const parsed = EsquemaDoInicio.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
    const data = parsed.data;
    if (data.canEdit && !data.confirmEdit) return { success: false, error: "Para permitir edição, confirme que entendeu que as mudanças valem de verdade." };

    const wedding = await prisma.wedding.findUnique({ where: { id: data.weddingId }, select: { id: true, coupleNames: true } });
    if (!wedding) return { success: false, error: ERROS.casamentoNaoEncontrado };

    if (data.ticketNumber !== null) {
      const ticket = await prisma.supportTicket.findUnique({ where: { number: data.ticketNumber }, select: { id: true } });
      if (!ticket) return { success: false, error: `Não existe o chamado #${data.ticketNumber}. Deixe o campo vazio se não houver.` };
    }

    const adminName = nomeDeExibicaoDoAdmin(admin.userId, admin.name);
    const now = new Date();
    // Uma entrada por vez: as anteriores desta pessoa são encerradas
    await prisma.impersonationSession.updateMany({ where: { adminUserId: admin.userId, endedAt: null }, data: { endedAt: now, endedReason: "replaced" } });
    const row = await prisma.impersonationSession.create({
      data: {
        adminUserId: admin.userId,
        adminName,
        weddingId: wedding.id,
        weddingNames: wedding.coupleNames,
        reason: data.reason,
        ticketNumber: data.ticketNumber,
        canEdit: data.canEdit,
        startedAt: now,
        expiresAt: validadeDaPersonificacao(now),
      },
    });

    const store = await cookies();
    store.set(COOKIE_DE_PERSONIFICACAO, await assinarCookieDePersonificacao({ sessionId: row.id, adminUserId: admin.userId, expiresAt: row.expiresAt }), opcoesDoCookieDePersonificacao(row.expiresAt));

    await registrarAuditoria({
      action: "impersonation.start",
      targetType: "wedding",
      targetId: wedding.id,
      details: { sessionId: row.id, reason: data.reason, ticketNumber: data.ticketNumber, canEdit: data.canEdit, weddingNames: wedding.coupleNames, expiresAt: row.expiresAt.toISOString() },
    });
    return { success: true, redirectTo: "/dashboard" };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "startImpersonation");
  }
}

/** Sair do casal (botão da faixa ou fim dos 30 minutos). Só mexe na sessão da própria pessoa logada. */
export async function encerrarPersonificacao(): Promise<ResultadoDaPersonificacao> {
  try {
    const session = await exigirSessaoAutenticada();
    const store = await cookies();
    const signed = await verificarCookieDePersonificacao(store.get(COOKIE_DE_PERSONIFICACAO)?.value);
    store.delete(COOKIE_DE_PERSONIFICACAO);

    let weddingId: string | null = null;
    if (signed && signed.adminUserId === session.userId && ehAcessoDeAdminDaPlataforma(session.allowedPaths)) {
      const row = await prisma.impersonationSession.findUnique({ where: { id: signed.sessionId } });
      if (row && row.adminUserId === session.userId) {
        weddingId = row.weddingId;
        if (!row.endedAt) {
          const now = new Date();
          await prisma.impersonationSession.update({ where: { id: row.id }, data: { endedAt: now, endedReason: row.expiresAt <= now ? "expired" : "manual" } });
          await registrarAuditoria({
            action: "impersonation.end",
            targetType: "wedding",
            targetId: row.weddingId ?? undefined,
            details: { sessionId: row.id, endedReason: row.expiresAt <= now ? "expired" : "manual", weddingNames: row.weddingNames },
          });
        }
      }
    }
    revalidatePath("/", "layout");
    return { success: true, redirectTo: weddingId ? `/admin/casais/${weddingId}` : "/admin/casais" };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "endImpersonation");
  }
}
