import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { Logo } from "@/components/brand/logo";
import { btn } from "@/components/landing/styles";
import { hasPathAccess } from "@/lib/permissions";
import { COUPLE_MODULES } from "@/lib/pricing-modules";
import { getSession, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { VENDOR_PERIOD_DAYS } from "@/lib/subscription-period";
import { cn } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recibo",
  robots: { index: false, follow: false },
};

const TZ = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (cents: number) => brl.format(cents / 100);
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: TZ });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Recibo de uma assinatura paga. Só o dono vê (a conta que pagou; nos planos de casal, as duas
 * contas do casamento) e quem tem acesso a /assinaturas. Para os outros, a página não existe.
 */
export default async function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const sub = await prisma.subscription.findUnique({
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
      user: {
        select: {
          name: true,
          username: true,
          partnerVendor: { select: { companyName: true, documentType: true, documentNumber: true } },
        },
      },
      wedding: { select: { coupleNames: true } },
    },
  });
  if (!sub || sub.status !== PaymentStatus.APPROVED) notFound();

  const isAdmin = hasPathAccess(session.allowedPaths, "/assinaturas");
  let isOwner = sub.userId !== null && sub.userId === session.userId;
  if (!isOwner && sub.planType === "COUPLE" && sub.weddingId && session.userId !== SUPER_ADMIN_USER_ID) {
    const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { weddingId: true } });
    isOwner = me?.weddingId === sub.weddingId;
  }
  if (!isOwner && !isAdmin) notFound();

  const isVendor = sub.planType === "VENDOR";
  const backHref = isOwner ? (isVendor ? "/fornecedor/plano" : "/plano") : `/assinaturas?id=${sub.id}`;
  const discount = sub.discount ?? 0;
  const credit = sub.credit ?? 0;
  const listPrice = sub.amount + discount + credit;

  const moduleIds = Array.isArray(sub.modules) ? sub.modules.filter((m): m is string => typeof m === "string") : [];
  const moduleNames = COUPLE_MODULES.filter((m) => moduleIds.includes(m.id)).map((m) => m.name);

  const period =
    isVendor && sub.periodEnd
      ? `${dateFmt.format(new Date(sub.periodEnd.getTime() - VENDOR_PERIOD_DAYS * DAY_MS))} a ${dateFmt.format(sub.periodEnd)}`
      : isVendor
        ? "Mensal (30 dias)"
        : "Pagamento único, vale para o casamento";

  const vendor = sub.user?.partnerVendor;
  const customer = [
    { label: "Nome", value: sub.user?.name ?? "Conta excluída" },
    ...(isVendor && vendor?.companyName ? [{ label: "Empresa", value: vendor.companyName }] : []),
    ...(isVendor && vendor?.documentNumber ? [{ label: vendor.documentType || "Documento", value: vendor.documentNumber }] : []),
    ...(!isVendor && sub.wedding?.coupleNames ? [{ label: "Casamento", value: sub.wedding.coupleNames }] : []),
    ...(sub.user?.username ? [{ label: "Login", value: sub.user.username }] : []),
  ];

  const payment = [
    { label: "Plano", value: sub.planName },
    ...(moduleNames.length > 0 ? [{ label: "Módulos", value: moduleNames.join(", ") }] : []),
    { label: "Período", value: period },
    { label: "Forma de pagamento", value: "Pix" },
    { label: "Pago em", value: sub.paidAt ? dateTimeFmt.format(sub.paidAt) : "—" },
    { label: "Identificador do pagamento", value: sub.gatewayId ?? "—", mono: true },
  ];

  return (
    <div className="min-h-dvh bg-linho px-4 py-6 text-tinta sm:px-6 sm:py-10 print:bg-white print:p-0">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href={backHref} className={cn(btn.quiet, "min-h-11 -ml-3")}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar
          </Link>
          <PrintButton />
        </div>

        <article
          aria-labelledby="recibo-titulo"
          className="flex flex-col gap-7 rounded-2xl border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)] sm:p-10 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none"
        >
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-linha pb-6">
            <div className="flex flex-col gap-2">
              <Logo height={28} priority />
              <p className="text-sm text-tinta-suave">Aceito · meuaceito.com.br</p>
            </div>
            <div className="text-right">
              <h1 id="recibo-titulo" className="font-display text-[32px] leading-[38px]">
                Recibo
              </h1>
              <p className="font-mono text-sm text-tinta-suave">Nº {sub.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </header>

          <p className="text-[15px] leading-6">
            Recebemos de <strong className="font-semibold">{vendor?.companyName && isVendor ? vendor.companyName : (sub.user?.name ?? "cliente")}</strong>{" "}
            o valor de <strong className="font-semibold">{money(sub.amount)}</strong> pelo plano {sub.planName} no Aceito.
          </p>

          <section aria-labelledby="cliente-titulo" className="flex flex-col gap-3">
            <h2 id="cliente-titulo" className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">
              Cliente
            </h2>
            <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-[180px_1fr]">
              {customer.map((row) => (
                <div key={row.label} className="contents">
                  <dt className="text-tinta-suave">{row.label}</dt>
                  <dd className="break-words">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="pagamento-titulo" className="flex flex-col gap-3">
            <h2 id="pagamento-titulo" className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">
              Pagamento
            </h2>
            <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-[180px_1fr]">
              {payment.map((row) => (
                <div key={row.label} className="contents">
                  <dt className="text-tinta-suave">{row.label}</dt>
                  <dd className={cn("break-words", row.mono && "break-all font-mono text-sm")}>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="valores-titulo" className="flex flex-col gap-3">
            <h2 id="valores-titulo" className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">
              Valores
            </h2>
            <dl className="flex flex-col gap-2 text-[15px]">
              <div className="flex justify-between gap-4">
                <dt>Valor do plano</dt>
                <dd className="tabular-nums">{money(listPrice)}</dd>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt>Desconto do cupom{sub.couponCode ? ` ${sub.couponCode}` : ""}</dt>
                  <dd className="tabular-nums">- {money(discount)}</dd>
                </div>
              ) : null}
              {credit > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt>Crédito do plano anterior</dt>
                  <dd className="tabular-nums">- {money(credit)}</dd>
                </div>
              ) : null}
              <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-linha pt-3">
                <dt className="font-semibold">Total pago</dt>
                <dd className="font-display text-[28px] leading-8 tabular-nums">{money(sub.amount)}</dd>
              </div>
            </dl>
          </section>

          <footer className="flex flex-col gap-1 border-t border-linha pt-5 text-sm text-tinta-suave">
            <p>
              <strong className="font-semibold text-tinta">Este documento é um recibo de pagamento, não é nota fiscal.</strong> Ele
              comprova o Pix recebido pelo Aceito.
            </p>
            <p>Emitido em {dateFmt.format(new Date())}.</p>
          </footer>
        </article>
      </div>
    </div>
  );
}
