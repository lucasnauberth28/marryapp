// Visão geral: erros e falhas das últimas 24 horas e a lista de configuração inicial (para abrir as portas).
import "server-only";
import prisma from "@/lib/prisma";
import { whatsappEstaConfigurado } from "@/lib/whatsapp/config";
import { pluralizar } from "@/lib/formatacao/plural";
import { ROTULO_DO_SERVICO } from "@/lib/platform/queries/atencao-itens";
import { UM_DIA_EM_MS } from "@/lib/platform/queries/atencao";

interface LinhaDeSaudeDoServico {
  service: string;
  label: string;
  total: number;
  failures: number;
  lastFailureAt: Date | null;
}

export interface ErrosRecentes {
  services: LinhaDeSaudeDoServico[];
  failedCrons: { job: string; at: Date }[];
  /** Nada foi registrado (nem sucesso nem falha): a tela diz "Sem registros ainda", nunca "tudo certo". */
  nothingRecorded: boolean;
}

export async function obterErrosRecentes(now: Date = new Date()): Promise<ErrosRecentes> {
  const since = new Date(now.getTime() - UM_DIA_EM_MS);
  const [totals, failures, lastFailures, crons] = await Promise.all([
    prisma.serviceEvent.groupBy({ by: ["service"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.serviceEvent.groupBy({ by: ["service"], where: { createdAt: { gte: since }, ok: false }, _count: { _all: true } }),
    prisma.serviceEvent.groupBy({ by: ["service"], where: { createdAt: { gte: since }, ok: false }, _max: { createdAt: true } }),
    prisma.cronRun.findMany({ where: { status: "FAILED", startedAt: { gte: since } }, orderBy: { startedAt: "desc" }, distinct: ["job"], select: { job: true, startedAt: true } }),
  ]);
  const services = Object.keys(ROTULO_DO_SERVICO).map<LinhaDeSaudeDoServico>((service) => ({
    service,
    label: ROTULO_DO_SERVICO[service],
    total: totals.find((t) => t.service === service)?._count._all ?? 0,
    failures: failures.find((t) => t.service === service)?._count._all ?? 0,
    lastFailureAt: lastFailures.find((t) => t.service === service)?._max.createdAt ?? null,
  }));
  return {
    services,
    failedCrons: crons.map((c) => ({ job: c.job, at: c.startedAt })),
    nothingRecorded: services.every((s) => s.total === 0) && crons.length === 0,
  };
}

// ---------- Visão "Vazia": para abrir as portas ----------

export interface ItemDeConfiguracao {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  actionLabel: string;
  href: string;
}

export async function obterListaDeConfiguracao(): Promise<ItemDeConfiguracao[]> {
  const [coupons, team] = await Promise.all([
    prisma.coupon.count(),
    // Contas com perfil de acesso total ("*"): você e quem mais da equipe
    prisma.user.count({ where: { role: { allowedPaths: { array_contains: ["*"] } } } }),
  ]);
  const mercadoPago = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN);
  return [
    { id: "mp", title: "Conectar o Mercado Pago", detail: "Pagamentos e presentes já entram sozinhos.", done: mercadoPago, actionLabel: "Ver a saúde", href: "/admin/saude" },
    { id: "equipe", title: "Convidar a equipe", detail: team > 1 ? `Você e mais ${pluralizar(team - 1, "pessoa", "pessoas")} com acesso.` : "Hoje só uma pessoa tem acesso total.", done: team > 1, actionLabel: "Usuários e perfis", href: "/usuarios" },
    { id: "whatsapp", title: "Conectar o WhatsApp", detail: "Sem isso, convites e lembretes não saem.", done: whatsappEstaConfigurado(), actionLabel: "Conectar", href: "/admin/saude" },
    { id: "cupom", title: "Criar um cupom de lançamento", detail: "Opcional, para os primeiros casais.", done: coupons > 0, actionLabel: "Criar cupom", href: "/admin/planos/cupons" },
  ];
}
