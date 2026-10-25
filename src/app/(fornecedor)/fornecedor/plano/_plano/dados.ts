import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { opcaoDePlano, nomeCurtoDoPlano, type OpcaoDePlano } from "@/app/login/auth-config";
import type { obterCatalogo } from "@/lib/pagamento/catalog-server";
import { detalharPreco } from "@/lib/pagamento/checkout-pricing";
import { proximoFimDoPeriodoDoFornecedor, nivelDoFornecedorParaOPlano } from "@/lib/pagamento/subscription-period";
import { creditoDeUpgrade } from "@/lib/pagamento/upgrade-credit";
import { inicioDoMesEmBrasilia } from "../../../_lib/datas-do-painel";
import { LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL } from "../../../_lib/planos-do-fornecedor";
import { UM_DIA_EM_MS, formatarData } from "./datas";

type Catalogo = Awaited<ReturnType<typeof obterCatalogo>>;
interface FornecedorDoPlano {
  id: string;
  planTier: string;
  planExpiresAt: Date | null;
}

const PLANO_DO_NIVEL: Record<string, "start" | "pro" | "master"> = { FREE: "start", PRO: "pro", MASTER: "master" };

/** Os últimos pagamentos do plano e quantos pedidos chegaram no mês. */
export async function carregarPagamentosEPedidos(userId: string, vendorId: string, now: Date) {
  return Promise.all([
    prisma.subscription.findMany({
      where: { userId, status: { in: [PaymentStatus.APPROVED, PaymentStatus.REFUNDED] } },
      orderBy: { paidAt: "desc" },
      take: 6,
      select: { id: true, planName: true, amount: true, status: true, paidAt: true, periodEnd: true },
    }),
    prisma.vendorLead.count({ where: { vendorId, createdAt: { gte: inicioDoMesEmBrasilia(now) } } }),
  ]);
}

export type PagamentoDoFornecedor = Awaited<ReturnType<typeof carregarPagamentosEPedidos>>[0][number];

/** Até quando vale cada plano se pago agora (mesma regra do webhook de confirmação). */
function fimDeCadaPlano(options: OpcaoDePlano[], v: FornecedorDoPlano, now: Date) {
  return Object.fromEntries(
    options.map((o) => {
      const newTier = nivelDoFornecedorParaOPlano(o.id) ?? "PRO";
      return [o.id, formatarData(proximoFimDoPeriodoDoFornecedor({ currentTier: v.planTier, currentExpiresAt: v.planExpiresAt, newTier, now }), now, true)];
    }),
  );
}

/** Crédito dos dias pagos que sobraram ao subir de plano (mesma conta do servidor ao gerar o Pix). */
function creditoDeCadaPlano(options: OpcaoDePlano[], v: FornecedorDoPlano, catalog: Catalogo, now: Date) {
  const currentKey = v.planTier === "PRO" ? "pro" : v.planTier === "MASTER" ? "master" : null;
  return Object.fromEntries(
    options.map((o) => {
      const newTier = nivelDoFornecedorParaOPlano(o.id);
      const credit = newTier && currentKey
        ? creditoDeUpgrade({ currentTier: v.planTier, currentExpiresAt: v.planExpiresAt, newTier, now, currentMonthlyPrice: catalog.plans[currentKey].price, newPrice: o.price })
        : 0;
      return [o.id, detalharPreco({ price: o.price, credit })];
    }),
  );
}

/** Tudo o que a tela do plano mostra: nome, período, opções, fins de período, créditos e os detalhes do cartão. */
export function situacaoDoPlano(v: FornecedorDoPlano, catalog: Catalogo, monthLeads: number, now: Date) {
  const isPaid = v.planTier !== "FREE";
  const expiresAt = v.planExpiresAt;
  const hasActivePeriod = expiresAt !== null && expiresAt.getTime() > now.getTime();
  const daysLeft = isPaid && expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / UM_DIA_EM_MS)) : null;
  const planName = nomeCurtoDoPlano(opcaoDePlano(PLANO_DO_NIVEL[v.planTier] ?? "start", catalog).name);
  const options = [opcaoDePlano("pro", catalog), opcaoDePlano("master", catalog)];
  const details: { label: string; value: string }[] = isPaid
    ? [
        ...(expiresAt ? [{ label: "Pago até", value: formatarData(expiresAt, now) }] : []),
        { label: "Pedidos este mês", value: `${monthLeads} · ilimitados` },
        { label: "Forma de pagamento", value: "Pix, mês a mês" },
      ]
    : [
        { label: "Pedidos este mês", value: `${Math.min(monthLeads, LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL)} de ${LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL}` },
        { label: "Valor", value: "Gratuito" },
      ];
  return { expiresAt, hasActivePeriod, daysLeft, planName, options, details, endLabels: fimDeCadaPlano(options, v, now), credits: creditoDeCadaPlano(options, v, catalog, now) };
}
