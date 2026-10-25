// Filtros, consulta e o painel da assinatura escolhida na tela de Assinaturas e Pix.
import { PaymentStatus, type Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ehChaveDePlano } from "@/lib/pagamento/plans";
import { obterCatalogo } from "@/lib/pagamento/catalog-server";
import { opcaoDePlano, nomeCurtoDoPlano } from "@/app/login/auth-config";
import { formatarDiaEMes, formatarDataEHora, haQuantoTempo } from "@/lib/platform/format";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { montarLink, janelaDaPagina, interpretarPagina, parametroDaBusca, umDosValores, type ParametrosDeBusca } from "@/lib/platform/list-params";
import { ehPixEstatico, formaDoPagamentoDe, situacaoDoPagamentoDe } from "@/lib/platform/payments";
import { filtroDeFornecedorPagoAtivo, obterReceitaDoMes, obterPixParaConferir, filtroDePixParaConferir } from "@/lib/platform/queries/receita/resumo";
import type { AssinaturaDoPainel } from "../../_assinatura/tipos";

export const FILTROS = [
  { value: "todos", label: "Todos" },
  { value: "a-conferir", label: "A conferir" },
  { value: "pagos", label: "Pagos" },
  { value: "recusados", label: "Recusados" },
  { value: "estornados", label: "Estornados" },
] as const;
export type ValorDoFiltro = (typeof FILTROS)[number]["value"];
export const TAMANHO_DA_PAGINA = 25;
export const CAMINHO_BASE = "/admin/planos/assinaturas";

const select = {
  id: true,
  planId: true,
  planName: true,
  planType: true,
  amount: true,
  status: true,
  gatewayId: true,
  expiresAt: true,
  paidAt: true,
  periodEnd: true,
  createdAt: true,
  user: { select: { name: true, username: true, partnerVendor: { select: { companyName: true } } } },
} satisfies Prisma.SubscriptionSelect;

type Assinatura = Prisma.SubscriptionGetPayload<{ select: typeof select }>;
export type LinhaDeAssinatura = Assinatura;

function filtroDaLista(now: Date): Record<ValorDoFiltro, Prisma.SubscriptionWhereInput> {
  return {
    todos: {},
    "a-conferir": filtroDePixParaConferir(now),
    pagos: { status: PaymentStatus.APPROVED },
    recusados: { status: { in: [PaymentStatus.FAILED, PaymentStatus.REJECTED] } },
    estornados: { status: PaymentStatus.REFUNDED },
  };
}

type RotuloDoPlano = (planId: string, planName: string) => string;

function painelDaAssinatura(selected: Assinatura, planLabel: RotuloDoPlano, now: Date): AssinaturaDoPainel {
  return {
    id: selected.id,
    accountName: selected.user?.name ?? "Conta excluída",
    companyName: selected.user?.partnerVendor?.companyName ?? null,
    accountType: selected.planType === "VENDOR" ? "Fornecedor" : "Casal",
    planName: planLabel(selected.planId, selected.planName),
    amount: formatarReais(selected.amount),
    gatewayId: selected.gatewayId,
    createdAt: haQuantoTempo(selected.createdAt, now),
    paidAt: selected.paidAt ? formatarDataEHora(selected.paidAt) : null,
    periodEnd: selected.periodEnd ? formatarDiaEMes(selected.periodEnd) : null,
    email: selected.user?.username ?? "Sem e-mail (conta excluída)",
    method: formaDoPagamentoDe(selected.gatewayId),
    status: situacaoDoPagamentoDe(selected, now),
    checkable: selected.status === PaymentStatus.PENDING && ehPixEstatico(selected.gatewayId),
    receiptHref: selected.status === PaymentStatus.APPROVED ? `/recibo/${selected.id}` : null,
  };
}

export async function carregarAssinaturas(query: ParametrosDeBusca, now: Date) {
  const filter = umDosValores(query, "status", FILTROS.map((f) => f.value)) ?? "todos";
  const idParam = parametroDaBusca(query, "id", 40);
  const selectedId = idParam && /^[0-9a-f-]{36}$/i.test(idParam) ? idParam : null;
  const catalog = await obterCatalogo();
  const planLabel: RotuloDoPlano = (planId, planName) => (ehChaveDePlano(planId) ? opcaoDePlano(planId, catalog).name : nomeCurtoDoPlano(planName));
  const where = filtroDaLista(now)[filter];

  const total = await prisma.subscription.count({ where });
  const window = janelaDaPagina(interpretarPagina(query), TAMANHO_DA_PAGINA, total);
  const [rows, month, pix, vendorTiers, expiringSoon, selected] = await Promise.all([
    prisma.subscription.findMany({ where, orderBy: { createdAt: "desc" }, skip: window.skip, take: window.take, select }),
    obterReceitaDoMes(now),
    obterPixParaConferir(now),
    prisma.partnerVendor.groupBy({ by: ["planTier"], where: filtroDeFornecedorPagoAtivo(now), _count: { _all: true } }),
    prisma.partnerVendor.count({ where: { planTier: { not: "FREE" }, planExpiresAt: { gt: now, lte: new Date(now.getTime() + 7 * 86_400_000) } } }),
    selectedId ? prisma.subscription.findUnique({ where: { id: selectedId }, select }) : Promise.resolve(null),
  ]);

  return {
    filter,
    rows,
    total,
    window,
    month,
    pix,
    expiringSoon,
    planLabel,
    selectedId: selected?.id,
    pro: vendorTiers.find((t) => t.planTier === "PRO")?._count._all ?? 0,
    master: vendorTiers.find((t) => t.planTier === "MASTER")?._count._all ?? 0,
    panel: selected ? painelDaAssinatura(selected, planLabel, now) : null,
    hrefFor: (status: ValorDoFiltro, id?: string, page?: number) => `${montarLink(CAMINHO_BASE, { status: status === "todos" ? undefined : status, id, pagina: page && page > 1 ? page : undefined })}${id ? "#painel" : ""}`,
  };
}

export type TelaDeAssinaturas = Awaited<ReturnType<typeof carregarAssinaturas>>;
