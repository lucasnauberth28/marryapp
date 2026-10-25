// Busca o pagamento e monta as linhas do recibo (cliente, pagamento e valores).
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { formatarDataBrasiliaLonga } from "@/lib/formatacao/data";
import { temAcessoAoCaminho } from "@/lib/permissions";
import { MODULOS_DO_CASAL } from "@/lib/pagamento/pricing-modules";
import { ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { DIAS_DO_PERIODO_DO_FORNECEDOR } from "@/lib/pagamento/subscription-period";

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;
const formatoDeDataEHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export interface LinhaDoRecibo {
  label: string;
  value: string;
  mono?: boolean;
}

export function buscarPagamentoDoRecibo(id: string) {
  return prisma.subscription.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      weddingId: true,
      planId: true,
      planType: true,
      planName: true,
      modules: true,
      couponCode: true,
      discount: true,
      credit: true,
      amount: true,
      status: true,
      gatewayId: true,
      paidAt: true,
      periodEnd: true,
      user: { select: { name: true, username: true, partnerVendor: { select: { companyName: true, documentType: true, documentNumber: true } } } },
      wedding: { select: { coupleNames: true } },
    },
  });
}

export type PagamentoDoRecibo = NonNullable<Awaited<ReturnType<typeof buscarPagamentoDoRecibo>>>;

/** O recibo só existe para pagamento aprovado. */
export const ehPagamentoAprovado = (sub: PagamentoDoRecibo | null): sub is PagamentoDoRecibo => Boolean(sub) && sub?.status === PaymentStatus.APPROVED;

/** Dono: a conta que pagou ou, nos planos de casal, a outra conta do mesmo casamento. Administração com acesso a /assinaturas também vê. */
export async function quemPodeVer(sub: PagamentoDoRecibo, session: { userId: string; allowedPaths: string[] }) {
  const isAdmin = temAcessoAoCaminho(session.allowedPaths, "/assinaturas");
  let isOwner = sub.userId !== null && sub.userId === session.userId;
  if (!isOwner && sub.planType === "COUPLE" && sub.weddingId && session.userId !== ID_DO_SUPER_ADMIN) {
    const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { weddingId: true } });
    isOwner = me?.weddingId === sub.weddingId;
  }
  return { isOwner, isAdmin };
}

function periodoDoPlano(sub: PagamentoDoRecibo) {
  if (sub.planType !== "VENDOR") return "Pagamento único, vale para o casamento";
  if (!sub.periodEnd) return "Mensal (30 dias)";
  const inicio = new Date(sub.periodEnd.getTime() - DIAS_DO_PERIODO_DO_FORNECEDOR * UM_DIA_EM_MS);
  return `${formatarDataBrasiliaLonga(inicio)} a ${formatarDataBrasiliaLonga(sub.periodEnd)}`;
}

export function linhasDoCliente(sub: PagamentoDoRecibo): LinhaDoRecibo[] {
  const isVendor = sub.planType === "VENDOR";
  const vendor = sub.user?.partnerVendor;
  return [
    { label: "Nome", value: sub.user?.name ?? "Conta excluída" },
    ...(isVendor && vendor?.companyName ? [{ label: "Empresa", value: vendor.companyName }] : []),
    ...(isVendor && vendor?.documentNumber ? [{ label: vendor.documentType || "Documento", value: vendor.documentNumber }] : []),
    ...(!isVendor && sub.wedding?.coupleNames ? [{ label: "Casamento", value: sub.wedding.coupleNames }] : []),
    ...(sub.user?.username ? [{ label: "Login", value: sub.user.username }] : []),
  ];
}

export function linhasDoPagamento(sub: PagamentoDoRecibo): LinhaDoRecibo[] {
  const moduleIds = Array.isArray(sub.modules) ? sub.modules.filter((m): m is string => typeof m === "string") : [];
  const moduleNames = MODULOS_DO_CASAL.filter((m) => moduleIds.includes(m.id)).map((m) => m.name);
  return [
    { label: "Plano", value: sub.planName },
    ...(moduleNames.length > 0 ? [{ label: "Módulos", value: moduleNames.join(", ") }] : []),
    { label: "Período", value: periodoDoPlano(sub) },
    { label: "Forma de pagamento", value: "Pix" },
    { label: "Pago em", value: sub.paidAt ? formatoDeDataEHora.format(sub.paidAt) : "—" },
    { label: "Identificador do pagamento", value: sub.gatewayId ?? "—", mono: true },
  ];
}
