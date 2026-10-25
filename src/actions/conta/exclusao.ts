"use server";

// Minha conta: excluir a própria conta.
import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { NOME_DO_COOKIE_DE_SESSAO, NOME_DO_COOKIE_DE_SESSAO_VISTA } from "@/lib/auth";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { registrarAuditoria } from "@/lib/audit";
import { ERROS } from "@/lib/mensagens-de-erro";
import { type Falha, SEM_SESSAO, UM_MINUTO_EM_MS, contaAtual } from "@/actions/conta/comum";

const EsquemaDaExclusao = z.object({
  confirmation: z.string().refine((v) => v.trim().toUpperCase() === "EXCLUIR", 'Digite EXCLUIR para confirmar.'),
  password: z.string().min(1, "Informe sua senha para confirmar.").max(200),
});

type ContaAExcluir = { id: string; weddingId: string | null; partnerVendorId: string | null };

/** Apaga o usuário e, se era o último do casamento, o casamento; fornecedor leva o perfil junto. Devolve se o casamento foi apagado. */
function apagarContaEDados(user: ContaAExcluir): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const otherMembers = user.weddingId ? await tx.user.count({ where: { weddingId: user.weddingId, id: { not: user.id } } }) : 0;

    await tx.user.delete({ where: { id: user.id } });

    let removedWedding = false;
    if (user.weddingId && otherMembers === 0) {
      // Pagamentos de presentes apontam para os presentes (RESTRICT): saem antes do casamento.
      await tx.transaction.deleteMany({ where: { weddingId: user.weddingId } });
      await tx.wedding.delete({ where: { id: user.weddingId } });
      removedWedding = true;
    }
    if (user.partnerVendorId) await tx.partnerVendor.delete({ where: { id: user.partnerVendorId } });
    return removedWedding;
  });
}

/**
 * Exclui a conta logada. Último membro de um casamento: o casamento vai junto (com tudo dele).
 * Fornecedor: o perfil do marketplace vai junto (pedidos, avaliações, agenda). Encerra a sessão.
 */
export async function excluirMinhaConta(input: { confirmation: string; password: string }): Promise<{ success: true } | Falha> {
  const user = await contaAtual();
  if (!user) return SEM_SESSAO;
  if (user.kind === "admin") {
    return { success: false, error: "Contas da administração são removidas pela tela Usuários, por outra pessoa da equipe." };
  }

  const parsed = EsquemaDaExclusao.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };

  const limit = await conferirLimiteDeUso({ key: `ACCOUNT_DELETE:${user.id}`, limit: 5, windowMs: 15 * UM_MINUTO_EM_MS });
  if (!limit.success) return { success: false, error: ERROS.muitasTentativas };

  if (!(await bcrypt.compare(parsed.data.password, user.password))) return { success: false, error: "A senha não confere." };

  let deletedWedding = false;
  try {
    deletedWedding = await apagarContaEDados(user);
  } catch (error) {
    console.error("[deleteMyAccount]", error);
    return { success: false, error: "Não conseguimos excluir a conta agora. Tente de novo ou fale com o suporte." };
  }

  await registrarAuditoria({
    action: "account.delete",
    targetType: "User",
    targetId: user.id,
    actor: { id: user.id, name: user.name },
    details: { kind: user.kind, weddingId: user.weddingId, deletedWedding, deletedVendorProfileId: user.partnerVendorId },
  });

  const cookieStore = await cookies();
  cookieStore.delete(NOME_DO_COOKIE_DE_SESSAO);
  cookieStore.delete(NOME_DO_COOKIE_DE_SESSAO_VISTA);
  return { success: true };
}
