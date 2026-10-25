"use server";

// Administração da Liz: ajustes por casamento (buscar, aplicar ajuste, desbloquear e ligar/desligar).
import { z } from "zod";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { interpretarCampoInteiro } from "@/lib/platform/madrinha";
import { buscarCasamentosParaAMadrinha, type ResultadoDeCasamento } from "@/lib/platform/queries/madrinha";
import { ERROS } from "@/lib/mensagens-de-erro";
import { type Falha, type Sucesso, atualizarPaginas, falhaDeCampo } from "@/actions/madrinha/comum";

const idDoCasamentoValido = z.string().uuid();

async function garantirCasamento(id: string) {
  return prisma.wedding.findUnique({ where: { id }, select: { id: true, coupleNames: true } });
}

/** Busca de casais para o seletor (consulta limitada). */
export async function buscarCasamentosDaMadrinha(input: unknown): Promise<{ success: true; hits: ResultadoDeCasamento[] } | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const { q } = z.object({ q: z.string().max(100) }).parse(input);
    return { success: true, hits: await buscarCasamentosParaAMadrinha(q) };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "searchMadrinhaWeddings");
  }
}

/** "Aplicar ajuste": mensagens a mais neste mês e uma nota (o motivo). Não mexe em ligado/bloqueado. */
export async function aplicarAjusteAoCasamento(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const data = z.object({ weddingId: idDoCasamentoValido, extraMessages: z.string().max(8), reason: z.string().trim().max(300) }).parse(input);
    const extra = interpretarCampoInteiro(data.extraMessages);
    if (extra === null || extra > 10_000) return falhaDeCampo({ extraMessages: "Use um número inteiro, até 10.000." });
    if (data.reason.length < 3) return falhaDeCampo({ reason: "Conte o motivo do ajuste (fica no registro)." });
    const wedding = await garantirCasamento(data.weddingId);
    if (!wedding) return { success: false, error: ERROS.casalNaoEncontrado };
    await prisma.madrinhaWeddingOverride.upsert({
      where: { weddingId: wedding.id },
      create: { weddingId: wedding.id, extraMessages: extra, note: data.reason },
      update: { extraMessages: extra, note: data.reason },
    });
    await registrarAuditoria({
      action: "madrinha.override_adjust",
      targetType: "wedding",
      targetId: wedding.id,
      details: { extraMessages: extra, reason: data.reason },
    });
    atualizarPaginas();
    return { success: true, message: `Ajuste aplicado para ${wedding.coupleNames}.` };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "applyWeddingAdjustment");
  }
}
export async function desbloquearMadrinhaDoCasamento(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const data = z.object({ weddingId: idDoCasamentoValido }).parse(input);
    const wedding = await garantirCasamento(data.weddingId);
    if (!wedding) return { success: false, error: ERROS.casalNaoEncontrado };
    await prisma.madrinhaWeddingOverride.updateMany({ where: { weddingId: wedding.id }, data: { blockedAt: null, blockedReason: null } });
    await registrarAuditoria({ action: "madrinha.override_unblock", targetType: "wedding", targetId: wedding.id });
    atualizarPaginas();
    return { success: true, message: `${wedding.coupleNames} foi desbloqueado.` };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "unblockWeddingMadrinha");
  }
}

/** Ligar ou desligar a Liz de um casal (null = segue o padrão do plano). */
export async function definirMadrinhaDoCasamentoAtiva(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const data = z.object({ weddingId: idDoCasamentoValido, enabled: z.boolean().nullable() }).parse(input);
    const wedding = await garantirCasamento(data.weddingId);
    if (!wedding) return { success: false, error: ERROS.casalNaoEncontrado };
    await prisma.madrinhaWeddingOverride.upsert({
      where: { weddingId: wedding.id },
      create: { weddingId: wedding.id, enabled: data.enabled },
      update: { enabled: data.enabled },
    });
    await registrarAuditoria({ action: "madrinha.override_enabled", targetType: "wedding", targetId: wedding.id, details: { enabled: data.enabled } });
    atualizarPaginas();
    return { success: true, message: data.enabled === null ? "Voltou ao padrão." : data.enabled ? "Ligada para este casal." : "Desligada para este casal." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "setWeddingMadrinhaEnabled");
  }
}
