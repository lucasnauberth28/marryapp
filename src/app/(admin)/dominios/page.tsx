import { redirect } from "next/navigation";
import { Globe } from "lucide-react";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSession, redirectToLogin } from "@/lib/security/auth-guard";
import { formatDocument, isMaskedDocument } from "@/lib/document-br";
import { formatPhoneBr, isOpenStatus, type DomainOrderStatusName } from "@/lib/domain-order";
import { vercelConfigured } from "@/lib/vercel-domains";
import { PageHeader } from "@/components/admin/page-header";
import { Reveal } from "@/components/motion/reveal";
import { FilterChips } from "../assinaturas/filter-chips";
import { DomainOrderCard, type AdminOrder } from "./order-card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pedidos de domínio" };

const FILTERS = [
  { value: "fila", label: "Para resolver", where: { status: { in: ["REQUESTED", "REGISTERING", "REGISTERED"] } } },
  { value: "aguardando", label: "Aguardando", where: { status: "REQUESTED" } },
  { value: "registrando", label: "Em registro", where: { status: "REGISTERING" } },
  { value: "registrados", label: "Registrados", where: { status: "REGISTERED" } },
  { value: "no-ar", label: "No ar", where: { status: "CONNECTED" } },
  { value: "encerrados", label: "Encerrados", where: { status: { in: ["REJECTED", "CANCELED"] } } },
  { value: "todos", label: "Todos", where: {} },
] as const satisfies readonly { value: string; label: string; where: Prisma.DomainOrderWhereInput }[];

type FilterValue = (typeof FILTERS)[number]["value"];
const isFilter = (v: string | undefined): v is FilterValue => FILTERS.some((f) => f.value === v);
const LIMIT = 100;

/** Dias até a data (negativo se já passou). */
function daysUntil(date: Date | null): number | null {
  return date ? Math.ceil((date.getTime() - Date.now()) / 86_400_000) : null;
}

export default async function DominiosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await getSession();
  if (!session) return redirectToLogin();
  // Só quem tem acesso total (administração da plataforma) vê os pedidos de todos os casais.
  if (!session.allowedPaths.includes("*")) redirect("/dashboard");

  const params = await searchParams;
  const filter: FilterValue = isFilter(params.status) ? params.status : "fila";
  const where: Prisma.DomainOrderWhereInput = FILTERS.find((f) => f.value === filter)!.where;

  const [rows, counts] = await Promise.all([
    prisma.domainOrder.findMany({
      where,
      orderBy: [{ requestedAt: "asc" }],
      take: LIMIT,
      include: {
        wedding: { select: { coupleNames: true, slug: true } },
        subscription: { select: { planName: true } },
      },
    }),
    Promise.all(FILTERS.map((f) => prisma.domainOrder.count({ where: f.where }))),
  ]);

  const orders: AdminOrder[] = rows.map((o) => ({
    id: o.id,
    domain: o.domain,
    status: o.status as DomainOrderStatusName,
    coupleNames: o.wedding.coupleNames,
    slug: o.wedding.slug,
    planName: o.subscription?.planName ?? null,
    holderName: o.holderName,
    // O número completo só existe enquanto o pedido está aberto; depois disso já é a versão escondida
    holderDocument: isOpenStatus(o.status) && !isMaskedDocument(o.holderDocument) ? formatDocument(o.holderDocument) : o.holderDocument,
    documentIsFull: isOpenStatus(o.status) && !isMaskedDocument(o.holderDocument),
    holderEmail: o.holderEmail,
    holderPhone: formatPhoneBr(o.holderPhone),
    adminNote: o.adminNote,
    rejectionReason: o.rejectionReason,
    requestedAt: o.requestedAt.toISOString(),
    registeredAt: o.registeredAt?.toISOString() ?? null,
    expiresAt: o.expiresAt?.toISOString() ?? null,
    connectedAt: o.connectedAt?.toISOString() ?? null,
    vercelState: o.vercelState,
    daysToExpire: daysUntil(o.expiresAt),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Administração"
        title="Pedidos de domínio"
        description="Domínios próprios (.com.br) pedidos pelos casais. O registro é feito à mão no Registro.br, sempre no nome do titular."
      />

      <FilterChips
        filters={FILTERS.map((f, i) => ({
          href: `/dominios?status=${f.value}`,
          label: `${f.label} (${counts[i]})`,
          active: f.value === filter,
        }))}
      />

      <Reveal>
        {orders.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-linha bg-papel p-5 text-[15px] text-tinta-suave shadow-[var(--shadow-aceito-1)]">
            <Globe className="size-5 shrink-0" aria-hidden="true" />
            Nenhum pedido neste filtro.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {orders.map((order) => (
              <li key={order.id}>
                <DomainOrderCard order={order} vercelReady={vercelConfigured()} />
              </li>
            ))}
          </ul>
        )}
        {orders.length === LIMIT ? <p className="mt-3 text-sm text-tinta-suave">Mostrando os {LIMIT} primeiros.</p> : null}
      </Reveal>
    </div>
  );
}
