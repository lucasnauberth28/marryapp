import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { ehChaveDePlano } from "@/lib/plans";
import { PLANOS_ACEITOS_PELO_CUPOM, planosDoCupom } from "@/lib/checkout-pricing";
import { obterCatalogo } from "@/lib/catalog-server";
import { opcaoDePlano, nomeCurtoDoPlano } from "@/app/login/auth-config";
import prisma from "@/lib/prisma";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { CouponsSection, type CouponRow } from "../_components/coupons-section";
import { PlanosTabs } from "../_components/planos-tabs";

import { formatarDataBrasiliaCurtaComAno } from "@/lib/formatacao/data";
export const dynamic = "force-dynamic";
export const metadata = { title: "Cupons" };

const SP_OFFSET_MS = 3 * 60 * 60 * 1000;
const dayKey = (d: Date) => new Date(d.getTime() - SP_OFFSET_MS).toISOString().slice(0, 10);

export default async function CuponsPage() {
  await exigirAdminDaPlataformaNaPagina();
  const now = new Date();
  const catalog = await obterCatalogo();
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const rows: CouponRow[] = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    percentOff: c.percentOff,
    amountOff: c.amountOff,
    planIds: planosDoCupom(c.planIds),
    maxRedemptions: c.maxRedemptions,
    redemptions: c.redemptions,
    expiresOn: c.expiresAt ? dayKey(c.expiresAt) : null,
    expiresLabel: c.expiresAt ? formatarDataBrasiliaCurtaComAno(c.expiresAt).replace(/\./g, "") : null,
    expired: c.expiresAt !== null && c.expiresAt.getTime() <= now.getTime(),
    active: c.active,
  }));
  const label = (id: string) => (id === "custom" ? "Adaptado" : ehChaveDePlano(id) ? opcaoDePlano(id, catalog).name : nomeCurtoDoPlano(id));
  return (
    <>
      <CabecalhoDaPagina eyebrow="Dinheiro" title="Cupons" description="Descontos para quem assina um plano. O servidor confere o cupom de novo na hora de gerar o Pix." />
      <PlanosTabs active="cupons" />
      <CouponsSection coupons={rows} plans={PLANOS_ACEITOS_PELO_CUPOM.map((id) => ({ id, label: label(id) }))} />
    </>
  );
}
