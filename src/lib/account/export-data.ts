import "server-only";
import prisma from "@/lib/prisma";
import { classificarConta } from "@/lib/account/wedding-provisioning";
import { esconderDocumento } from "@/lib/document-br";

const CAMPOS_DA_ASSINATURA = {
  id: true,
  planId: true,
  planType: true,
  planName: true,
  modules: true,
  couponCode: true,
  discount: true,
  credit: true,
  amount: true,
  status: true,
  paidAt: true,
  periodEnd: true,
  createdAt: true,
} as const;

function buscarUsuario(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      createdAt: true,
      updatedAt: true,
      weddingId: true,
      partnerVendorId: true,
      role: { select: { name: true, allowedPaths: true } },
      subscriptions: { select: CAMPOS_DA_ASSINATURA, orderBy: { createdAt: "asc" } },
      externalAccounts: { select: { provider: true, email: true, createdAt: true, lastLoginAt: true } },
    },
  });
}

/** O casamento inteiro: membros, convites, site, carteira, convidados, mesas, presentes, despesas, tarefas e o mais. */
function buscarCasamento(weddingId: string) {
  return prisma.wedding.findUnique({
    where: { id: weddingId },
    include: {
      members: { select: { id: true, name: true, username: true, createdAt: true } },
      invites: { select: { id: true, email: true, createdAt: true, expiresAt: true, usedAt: true } },
      settings: true,
      site: true,
      wallet: true,
      guests: true,
      timeline: true,
      tables: true,
      gifts: true,
      transactions: true,
      vendors: true,
      expenses: true,
      tasks: true,
      honeymoon: true,
      templates: true,
      creditCards: true,
      story: true,
      tips: true,
      guestbook: true,
      domainOrders: { orderBy: { requestedAt: "asc" } },
    },
  });
}

function buscarVitrineDoFornecedor(partnerVendorId: string) {
  return prisma.partnerVendor.findUnique({
    where: { id: partnerVendorId },
    include: { leads: true, reviews: true, events: true, profileViews: true },
  });
}

/**
 * Cópia dos dados de uma conta (LGPD, art. 18, V), em JSON. Usada pela própria pessoa (/api/conta/exportar)
 * e pela administração ao atender um pedido de titular (/api/admin/suporte/exportar).
 * Casal: perfil + o casamento inteiro. Fornecedor: perfil + vitrine, pedidos, avaliações e agenda.
 * Nunca inclui hashes de senha ou de tokens; o CPF/CNPJ do titular de domínio sai sempre mascarado.
 * Devolve null se a conta não existe.
 */
export async function montarExportacaoDaConta(userId: string): Promise<{ filename: string; json: string } | null> {
  const user = await buscarUsuario(userId);
  if (!user) return null;

  const kind = classificarConta(user);
  const wedding = kind !== "vendor" && user.weddingId ? await buscarCasamento(user.weddingId) : null;
  const vendorProfile = user.partnerVendorId ? await buscarVitrineDoFornecedor(user.partnerVendorId) : null;

  const exportedAt = new Date();
  const payload = {
    exportedAt: exportedAt.toISOString(),
    notice: "Cópia dos seus dados no Aceito (LGPD, art. 18, V). Valores em dinheiro estão em centavos. Senhas e tokens não são exportados.",
    account: {
      id: user.id,
      name: user.name,
      email: user.username,
      type: kind,
      role: user.role.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    subscriptions: user.subscriptions,
    connectedAccounts: user.externalAccounts,
    // Pedidos de domínio: o CPF/CNPJ do titular sai sempre escondido (o número completo é só para o registro)
    wedding: wedding && { ...wedding, domainOrders: wedding.domainOrders.map((o) => ({ ...o, holderDocument: esconderDocumento(o.holderDocument) })) },
    vendorProfile,
  };

  return { filename: `aceito-meus-dados-${exportedAt.toISOString().slice(0, 10)}.json`, json: JSON.stringify(payload, null, 2) };
}
