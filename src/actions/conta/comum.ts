// Minha conta: a conta logada e os tipos de resposta das ações (não são ações).
import prisma from "@/lib/prisma";
import { obterSessao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { classificarConta } from "@/lib/account/wedding-provisioning";
import { ERROS } from "@/lib/mensagens-de-erro";

export const UM_MINUTO_EM_MS = 60 * 1000;

export type Falha = { success: false; error: string };

/** Conta logada (nunca a de emergência), com o necessário para as ações de "Minha conta". */
export async function contaAtual() {
  const session = await obterSessao();
  if (!session || session.userId === ID_DO_SUPER_ADMIN) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      password: true,
      weddingId: true,
      partnerVendorId: true,
      role: { select: { name: true, allowedPaths: true } },
      wedding: { select: { id: true, coupleNames: true } },
    },
  });
  return user ? { ...user, kind: classificarConta(user) } : null;
}

export const SEM_SESSAO: Falha = { success: false, error: ERROS.sessaoExpirada };
