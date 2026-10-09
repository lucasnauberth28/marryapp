import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import prisma from "@/lib/prisma";
import { getVendorPageContext } from "@/lib/security/vendor-guard";
import { Chip } from "./_components/status-chip";
import { VendorAvatar } from "./_components/vendor-avatar";
import { LogoutButton, LogoutIconButton, VendorMobileTitle, VendorSidebarNav, VendorTabBar } from "./_components/vendor-nav";
import { effectiveVendorTier, PLAN_LABEL, START_MONTHLY_LEAD_LIMIT, startOfMonthBrasilia } from "./_lib/vendor-panel";

export const metadata: Metadata = {
  title: { default: "Painel do fornecedor", template: "%s · Aceito para Fornecedores" },
  robots: { index: false, follow: false },
};

function BrandBlock() {
  return (
    <div className="flex flex-col gap-1.5 px-3">
      <Logo height={22} />
      <span className="w-fit rounded-full bg-salvia-suave px-2.5 py-0.5 text-xs font-semibold text-salvia">
        para Fornecedores
      </span>
    </div>
  );
}

/** Conta com perfil "Fornecedor", mas ainda sem fornecedor vinculado. */
function UnlinkedAccount() {
  return (
    <main id="conteudo" className="grid min-h-dvh place-items-center bg-linho px-4 py-12 text-tinta">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)] sm:p-8">
        <BrandBlock />
        <div className="flex flex-col gap-2 px-3">
          <h1 className="font-display text-[28px] leading-9 font-medium">Seu painel está quase pronto</h1>
          <p className="text-tinta-suave">
            Sua conta ainda não está ligada a um perfil de fornecedor. Assim que a curadoria do Aceito concluir o
            vínculo, seus pedidos de orçamento aparecem aqui.
          </p>
        </div>
        <LogoutButton className="w-fit" />
      </div>
    </main>
  );
}

export default async function FornecedorLayout({ children }: { children: React.ReactNode }) {
  const { vendor } = await getVendorPageContext();
  if (!vendor) return <UnlinkedAccount />;

  const tier = effectiveVendorTier(vendor.planTier, vendor.planExpiresAt);
  const isFree = tier === "FREE";
  const [newLeads, monthLeads] = await Promise.all([
    prisma.vendorLead.count({ where: { vendorId: vendor.id, status: "NEW" } }),
    isFree
      ? prisma.vendorLead.count({ where: { vendorId: vendor.id, createdAt: { gte: startOfMonthBrasilia() } } })
      : Promise.resolve(0),
  ]);

  const planLabel = PLAN_LABEL[tier] ?? "Plano Start";
  const publicProfileHref = vendor.curationStatus === "APPROVED" ? `/fornecedores/${vendor.id}` : null;

  return (
    <div className="min-h-dvh bg-linho font-sans text-tinta md:flex">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-xl bg-ameixa px-4 py-3 font-semibold text-on-ameixa focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>

      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-linha bg-linho px-4 py-6 md:flex">
        <BrandBlock />
        <div className="flex items-center gap-2.5 rounded-xl border border-linha bg-papel p-3">
          <VendorAvatar name={vendor.companyName} logoUrl={vendor.logoUrl} size={40} />
          <span className="flex min-w-0 flex-col">
            <strong className="truncate text-[15px] font-semibold">{vendor.companyName}</strong>
            <span className="text-[13px] text-tinta-suave">{planLabel}</span>
          </span>
        </div>
        <VendorSidebarNav newLeads={newLeads} publicProfileHref={publicProfileHref} />
        <div className="mt-auto border-t border-linha pt-3">
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[60px] items-center gap-2.5 border-b border-linha bg-linho/95 pr-2 pl-4 backdrop-blur md:hidden">
          <VendorAvatar name={vendor.companyName} logoUrl={vendor.logoUrl} size={36} />
          <VendorMobileTitle />
          <Chip tone="salvia">
            {isFree ? `Start · ${Math.min(monthLeads, START_MONTHLY_LEAD_LIMIT)} de ${START_MONTHLY_LEAD_LIMIT}` : planLabel}
          </Chip>
          <LogoutIconButton />
        </header>

        <main
          id="conteudo"
          className="flex-1 px-4 pt-4 pb-[calc(80px+env(safe-area-inset-bottom)+24px)] md:px-[clamp(16px,4vw,48px)] md:pt-10 md:pb-16"
        >
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>

      <VendorTabBar />
    </div>
  );
}
