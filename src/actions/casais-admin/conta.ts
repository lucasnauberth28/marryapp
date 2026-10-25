"use server";

// Administração do casal: redefinir a senha e excluir o casamento.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { enviarLinkDeRedefinicaoDeSenha } from "@/lib/account/password-reset-link";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { ERROS } from "@/lib/mensagens-de-erro";
import { type ResultadoDaAcaoDoCasal, atualizarPaginas, esconderEmailDoCasal, falhar, idDoCasamentoValido, motivoValido } from "@/actions/casais-admin/comum";

/** Envia o link de nova senha ao e-mail do dono do casamento. Nunca mostra o link nem a senha. */
export async function redefinirSenhaDoCasamento(input: unknown): Promise<ResultadoDaAcaoDoCasal> {
  try {
    await exigirAdminDaPlataforma();
    const data = z.object({ weddingId: idDoCasamentoValido, reason: motivoValido }).parse(input);
    const owner = await prisma.user.findFirst({ where: { weddingId: data.weddingId }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, username: true } });
    if (!owner) return { success: false, error: "Este casamento não tem nenhuma conta ligada." };

    const limit = await conferirLimiteDeUso({ key: `ADMIN_PWRESET:${data.weddingId}`, limit: 3, windowMs: 60 * 60 * 1000 });
    if (!limit.success) return { success: false, error: "Já foram enviados vários links para este casal na última hora. Aguarde um pouco." };

    const { sent } = await enviarLinkDeRedefinicaoDeSenha(owner);
    await registrarAuditoria({ action: "wedding.password_reset", targetType: "wedding", targetId: data.weddingId, details: { reason: data.reason, userId: owner.id, sent } });
    if (!sent) return { success: false, error: "O e-mail não saiu (envio de e-mail não configurado ou recusado). Nenhuma senha foi alterada." };
    return { success: true, message: `Enviamos o link de nova senha para ${esconderEmailDoCasal(owner.username)}. Ele vale por 1 hora.` };
  } catch (error) {
    return falhar(error, "resetWeddingPassword");
  }
}

// ---------- Excluir o casamento ----------

/**
 * Exclui o casamento e tudo dele (a mesma sequência de deleteMyAccount). As contas das pessoas continuam existindo
 * (voltam ao cadastro do casamento); as assinaturas ficam com o casamento nulo. Irreversível: motivo, o texto
 * EXCLUIR e a segunda confirmação da tela são exigidos aqui também.
 */
export async function excluirCasamento(input: unknown): Promise<ResultadoDaAcaoDoCasal> {
  try {
    await exigirAdminDaPlataforma();
    const data = z
      .object({
        weddingId: idDoCasamentoValido,
        reason: motivoValido,
        confirmation: z.string().refine((v) => v.trim().toUpperCase() === "EXCLUIR", "Digite EXCLUIR para confirmar."),
        acknowledged: z.literal(true, { error: "Marque a confirmação final." }),
      })
      .parse(input);

    const wedding = await prisma.wedding.findUnique({ where: { id: data.weddingId }, select: { id: true, coupleNames: true, slug: true, _count: { select: { guests: true, members: true } } } });
    if (!wedding) return { success: false, error: ERROS.casamentoNaoEncontrado };

    await prisma.$transaction(async (tx) => {
      // Pagamentos de presentes apontam para os presentes (RESTRICT): saem antes do casamento.
      await tx.transaction.deleteMany({ where: { weddingId: wedding.id } });
      await tx.wedding.delete({ where: { id: wedding.id } });
    });
    await registrarAuditoria({
      action: "wedding.delete",
      targetType: "wedding",
      targetId: wedding.id,
      details: { reason: data.reason, coupleNames: wedding.coupleNames, slug: wedding.slug, guests: wedding._count.guests, accounts: wedding._count.members },
    });
    revalidatePath("/casamento", "layout");
    atualizarPaginas();
    return { success: true, message: "Casamento excluído." };
  } catch (error) {
    return falhar(error, "deleteWedding");
  }
}
