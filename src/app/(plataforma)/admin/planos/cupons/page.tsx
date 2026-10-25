import { PageHeader } from "@/components/plataforma/page-header";
import { isPlanKey } from "@/lib/plans";
import { COUPON_PLAN_IDS, couponPlanIds } from "@/lib/checkout-pricing";
import { getCatalog } from "@/lib/catalog-server";
import { planOption, shortPlanName } from "@/app/login/auth-config";
import prisma from "@/lib/prisma";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { CouponsSection, type CouponRow } from "../_components/coupons-section";
import { PlanosTabs } from "../_components/planos-tabs";

import { formatarDataBrasiliaCurtaComAno } from "@/lib/formatacao/data";
export const dynamic = "force-dynamic";
export const metadata = { title: "Cupons" };

const SP_OFFSET_MS = 3 * 60 * 60 * 1000;
const dayKey = (d: Date) => new Date(d.getTime() - SP_OFFSET_MS).toISOString().slice(0, 10);

export default async function CuponsPage() {
  await requirePlatformAdminPage();
  const now = new Date();
  const catalog = await getCatalog();
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const rows: CouponRow[] = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    percentOff: c.percentOff,
    amountOff: c.amountOff,
    planIds: couponPlanIds(c.planIds),
    maxRedemptions: c.maxRedemptions,
    redemptions: c.redemptions,
    expiresOn: c.expiresAt ? dayKey(c.expiresAt) : null,
    expiresLabel: c.expiresAt ? formatarDataBrasiliaCurtaComAno(c.expiresAt).replace(/\./g, "") : null,
    expired: c.expiresAt !== null && c.expiresAt.getTime() <= now.getTime(),
    active: c.active,
  }));
  const label = (id: string) => (id === "custom" ? "Adaptado" : isPlanKey(id) ? planOption(id, catalog).name : shortPlanName(id));
  return (
    <>
      <PageHeader eyebrow="Dinheiro" title="Cupons" description="Descontos para quem assina um plano. O servidor confere o cupom de novo na hora de gerar o Pix." />
      <PlanosTabs active="cupons" />
      <CouponsSection coupons={rows} plans={COUPON_PLAN_IDS.map((id) => ({ id, label: label(id) }))} />
    </>
  );
}
