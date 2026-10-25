import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { obterContextoDaPaginaDoFornecedor } from "@/lib/security/vendor-guard";
import { quantidadeNaoLidaDe } from "@/lib/notifications/queries";
import { BarraDeAbasDoFornecedor, BotaoDeSair } from "./_components/vendor-nav";
import { AvisoDeSuspensao } from "./_layout/aviso-de-suspensao";
import { BarraLateralDoFornecedor, BlocoDaMarca } from "./_layout/barra-lateral";
import { CabecalhoDoCelular } from "./_layout/cabecalho-do-celular";
import { LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL, ROTULO_DO_PLANO, nivelEfetivoDoFornecedor } from "./_lib/planos-do-fornecedor";
import { inicioDoMesEmBrasilia } from "./_lib/datas-do-painel";

export const metadata: Metadata = {
  title: { default: "Painel do fornecedor", template: "%s · Aceito para Fornecedores" },
  robots: { index: false, follow: false },
};

/** Conta com perfil "Fornecedor", mas ainda sem fornecedor vinculado. */
function ContaSemVinculo() {
  return (
    <main id="conteudo" className="grid min-h-dvh place-items-center bg-linho px-4 py-12 text-tinta">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)] sm:p-8">
        <BlocoDaMarca />
        <div className="flex flex-col gap-2 px-3">
          <h1 className="font-display text-[28px] leading-9 font-medium">Seu painel está quase pronto</h1>
          <p className="text-tinta-suave">Sua conta ainda não está ligada a um perfil de fornecedor. Assim que a curadoria do Aceito concluir o vínculo, seus pedidos de orçamento aparecem aqui.</p>
        </div>
        <BotaoDeSair className="w-fit" />
      </div>
    </main>
  );
}

export default async function FornecedorLayout({ children }: { children: React.ReactNode }) {
  const { session, vendor } = await obterContextoDaPaginaDoFornecedor();
  if (!vendor) return <ContaSemVinculo />;

  const tier = nivelEfetivoDoFornecedor(vendor.planTier, vendor.planExpiresAt);
  const isFree = tier === "FREE";
  const [newLeads, monthLeads, unreadNotifications] = await Promise.all([
    prisma.vendorLead.count({ where: { vendorId: vendor.id, status: "NEW" } }),
    isFree ? prisma.vendorLead.count({ where: { vendorId: vendor.id, createdAt: { gte: inicioDoMesEmBrasilia() } } }) : Promise.resolve(0),
    quantidadeNaoLidaDe(session.userId),
  ]);
  const planLabel = ROTULO_DO_PLANO[tier] ?? "Plano Start";
  const etiquetaDoPlano = isFree ? `Start · ${Math.min(monthLeads, LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL)} de ${LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL}` : planLabel;

  return (
    <div className="min-h-dvh bg-linho font-sans text-tinta md:flex">
      <a href="#conteudo" className="sr-only z-50 rounded-xl bg-ameixa px-4 py-3 font-semibold text-on-ameixa focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Pular para o conteúdo
      </a>
      <BarraLateralDoFornecedor
        companyName={vendor.companyName}
        logoUrl={vendor.logoUrl}
        planLabel={planLabel}
        newLeads={newLeads}
        unreadNotifications={unreadNotifications}
        publicProfileHref={vendor.curationStatus === "APPROVED" ? `/fornecedores/${vendor.id}` : null}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <CabecalhoDoCelular companyName={vendor.companyName} logoUrl={vendor.logoUrl} etiquetaDoPlano={etiquetaDoPlano} unreadNotifications={unreadNotifications} />
        <main id="conteudo" className="flex-1 px-4 pt-4 pb-[calc(80px+env(safe-area-inset-bottom)+24px)] md:px-[clamp(16px,4vw,48px)] md:pt-10 md:pb-16">
          <div className="mx-auto w-full max-w-[1180px]">
            {vendor.suspendedAt ? <AvisoDeSuspensao motivo={vendor.suspendedReason} /> : null}
            {children}
          </div>
        </main>
      </div>
      <BarraDeAbasDoFornecedor />
    </div>
  );
}
