import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Logotipo } from "@/components/brand/logo";
import prisma from "@/lib/prisma";
import { obterContextoDaPaginaDoFornecedor } from "@/lib/security/vendor-guard";
import { SinoDeNotificacoes } from "@/components/notifications/notification-bell";
import { quantidadeNaoLidaDe } from "@/lib/notifications/queries";
import { chavePublicaVapid } from "@/lib/notifications/push";
import { AlternadorDeTema } from "@/components/theme/theme-toggle";
import { EtiquetaBase } from "./_components/status-chip";
import { AvatarDoFornecedor } from "./_components/vendor-avatar";
import { BotaoDeSair, BotaoDeIconeDeSair, TituloMovelDoFornecedor, MenuLateralDoFornecedor, BarraDeAbasDoFornecedor } from "./_components/vendor-nav";
import { nivelEfetivoDoFornecedor, ROTULO_DO_PLANO, LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL, inicioDoMesEmBrasilia } from "./_lib/vendor-panel";

export const metadata: Metadata = {
  title: { default: "Painel do fornecedor", template: "%s · Aceito para Fornecedores" },
  robots: { index: false, follow: false },
};

function BlocoDaMarca() {
  return (
    <div className="flex flex-col gap-1.5 px-3">
      <Logotipo height={26} />
      <span className="w-fit rounded-md bg-salvia-suave px-2.5 py-0.5 text-xs font-semibold text-salvia">
        para Fornecedores
      </span>
    </div>
  );
}

/** Conta com perfil "Fornecedor", mas ainda sem fornecedor vinculado. */
function ContaSemVinculo() {
  return (
    <main id="conteudo" className="grid min-h-dvh place-items-center bg-linho px-4 py-12 text-tinta">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)] sm:p-8">
        <BlocoDaMarca />
        <div className="flex flex-col gap-2 px-3">
          <h1 className="font-display text-[28px] leading-9 font-medium">Seu painel está quase pronto</h1>
          <p className="text-tinta-suave">
            Sua conta ainda não está ligada a um perfil de fornecedor. Assim que a curadoria do Aceito concluir o
            vínculo, seus pedidos de orçamento aparecem aqui.
          </p>
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
    isFree
      ? prisma.vendorLead.count({ where: { vendorId: vendor.id, createdAt: { gte: inicioDoMesEmBrasilia() } } })
      : Promise.resolve(0),
    quantidadeNaoLidaDe(session.userId),
  ]);

  const planLabel = ROTULO_DO_PLANO[tier] ?? "Plano Start";
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
        <div className="flex items-start justify-between gap-2">
          <BlocoDaMarca />
          <SinoDeNotificacoes
            initialUnread={unreadNotifications}
            allHref="/fornecedor/notificacoes"
            settingsHref="/conta#avisos"
            pushPublicKey={chavePublicaVapid()}
            side="right"
            align="start"
            className="-mt-2.5"
          />
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-linha bg-papel p-3">
          <AvatarDoFornecedor name={vendor.companyName} logoUrl={vendor.logoUrl} size={40} />
          <span className="flex min-w-0 flex-col">
            <strong className="truncate text-[15px] font-semibold">{vendor.companyName}</strong>
            <span className="text-[13px] text-tinta-suave">{planLabel}</span>
          </span>
        </div>
        <MenuLateralDoFornecedor newLeads={newLeads} publicProfileHref={publicProfileHref} />
        <div className="mt-auto flex items-center gap-1 border-t border-linha pt-3">
          <div className="min-w-0 flex-1">
            <BotaoDeSair />
          </div>
          <AlternadorDeTema align="start" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[60px] items-center gap-2.5 border-b border-linha bg-linho/95 pr-2 pl-4 backdrop-blur md:hidden">
          <Link href="/conta" aria-label="Minha conta" className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salvia">
            <AvatarDoFornecedor name={vendor.companyName} logoUrl={vendor.logoUrl} size={36} />
          </Link>
          <TituloMovelDoFornecedor />
          <EtiquetaBase tone="salvia">
            {isFree ? `Start · ${Math.min(monthLeads, LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL)} de ${LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL}` : planLabel}
          </EtiquetaBase>
          <AlternadorDeTema />
          <SinoDeNotificacoes
            initialUnread={unreadNotifications}
            allHref="/fornecedor/notificacoes"
            settingsHref="/conta#avisos"
            pushPublicKey={chavePublicaVapid()}
            className="-mr-1"
          />
          <BotaoDeIconeDeSair />
        </header>

        <main
          id="conteudo"
          className="flex-1 px-4 pt-4 pb-[calc(80px+env(safe-area-inset-bottom)+24px)] md:px-[clamp(16px,4vw,48px)] md:pt-10 md:pb-16"
        >
          <div className="mx-auto w-full max-w-[1180px]">
            {vendor.suspendedAt ? (
              <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-perigo/40 bg-perigo-suave px-4 py-3.5 text-tinta">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-perigo" />
                <div className="text-[15px] leading-6">
                  <p className="font-semibold">Seu perfil está suspenso</p>
                  <p>
                    Ele não aparece na lista de fornecedores e não recebe novos pedidos de orçamento.
                    {vendor.suspendedReason ? ` Motivo: ${vendor.suspendedReason}` : ""} Para entender e resolver, fale com a equipe do Aceito.
                  </p>
                </div>
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>

      <BarraDeAbasDoFornecedor />
    </div>
  );
}
