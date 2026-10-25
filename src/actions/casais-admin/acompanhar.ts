"use server";

// Administração do casal: marcar para acompanhar, suspender, reativar e notas internas.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { nomeDeExibicaoDoAdmin } from "@/lib/security/impersonation";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { ERROS } from "@/lib/mensagens-de-erro";
import { type ResultadoDaAcaoDoCasal, atualizarPaginas, falhar, idDoCasamentoValido, motivoValido } from "@/actions/casais-admin/comum";

export async function definirMarcaDosCasamentos(input: unknown): Promise<ResultadoDaAcaoDoCasal> {
  try {
    await exigirAdminDaPlataforma();
    const data = z.object({ weddingIds: z.array(idDoCasamentoValido).min(1).max(100), flagged: z.boolean() }).parse(input);
    const found = await prisma.wedding.findMany({ where: { id: { in: data.weddingIds } }, select: { id: true } });
    const ids = found.map((w) => w.id);
    await prisma.wedding.updateMany({ where: { id: { in: ids } }, data: { flaggedAt: data.flagged ? new Date() : null } });
    for (const weddingId of ids) {
      await registrarAuditoria({ action: data.flagged ? "wedding.flag" : "wedding.unflag", targetType: "wedding", targetId: weddingId });
    }
    atualizarPaginas();
    return { success: true, message: data.flagged ? "Marcado para acompanhar." : "Deixou de ser acompanhado." };
  } catch (error) {
    return falhar(error, "setWeddingsFlag");
  }
}

// ---------- Suspender e reativar ----------

export async function suspenderCasamento(input: unknown): Promise<ResultadoDaAcaoDoCasal> {
  try {
    await exigirAdminDaPlataforma();
    const data = z.object({ weddingId: idDoCasamentoValido, reason: motivoValido }).parse(input);
    const { count } = await prisma.wedding.updateMany({ where: { id: data.weddingId, suspendedAt: null }, data: { suspendedAt: new Date(), suspendedReason: data.reason } });
    if (count === 0) return { success: false, error: "Este casamento já está suspenso ou não existe mais." };
    await registrarAuditoria({ action: "wedding.suspend", targetType: "wedding", targetId: data.weddingId, details: { reason: data.reason } });
    revalidatePath("/casamento", "layout");
    atualizarPaginas(data.weddingId);
    return { success: true, message: "Casamento suspenso. O site público saiu do ar e o painel do casal ficou só para leitura." };
  } catch (error) {
    return falhar(error, "suspendWedding");
  }
}

export async function reativarCasamento(input: unknown): Promise<ResultadoDaAcaoDoCasal> {
  try {
    await exigirAdminDaPlataforma();
    const data = z.object({ weddingId: idDoCasamentoValido, reason: z.string().trim().max(500).optional() }).parse(input);
    const { count } = await prisma.wedding.updateMany({ where: { id: data.weddingId, suspendedAt: { not: null } }, data: { suspendedAt: null, suspendedReason: null } });
    if (count === 0) return { success: false, error: "Este casamento não está suspenso." };
    await registrarAuditoria({ action: "wedding.unsuspend", targetType: "wedding", targetId: data.weddingId, details: { reason: data.reason ?? null } });
    revalidatePath("/casamento", "layout");
    atualizarPaginas(data.weddingId);
    return { success: true, message: "Casamento reativado." };
  } catch (error) {
    return falhar(error, "unsuspendWedding");
  }
}

// ---------- Notas internas ----------

export async function adicionarNotaAoCasamento(input: unknown): Promise<ResultadoDaAcaoDoCasal> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const data = z.object({ weddingId: idDoCasamentoValido, body: z.string().trim().min(2, "Escreva a nota.").max(2000, "A nota está longa demais (máximo de 2000 letras).") }).parse(input);
    const wedding = await prisma.wedding.findUnique({ where: { id: data.weddingId }, select: { id: true } });
    if (!wedding) return { success: false, error: ERROS.casamentoNaoEncontrado };
    const note = await prisma.adminNote.create({
      data: { weddingId: wedding.id, authorId: admin.userId, authorName: nomeDeExibicaoDoAdmin(admin.userId, admin.name), body: data.body },
      select: { id: true },
    });
    await registrarAuditoria({ action: "wedding.note_add", targetType: "wedding", targetId: wedding.id, details: { noteId: note.id } });
    revalidatePath(`/admin/casais/${wedding.id}`);
    return { success: true, message: "Nota salva. Só a equipe vê." };
  } catch (error) {
    return falhar(error, "addWeddingNote");
  }
}
