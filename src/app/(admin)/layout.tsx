// src/app/(admin)/layout.tsx
import "./painel.css"
import { Sidebar } from "@/components/admin/sidebar"
import { Header } from "@/components/admin/header"
import { MobileTabBar } from "@/components/admin/mobile-tab-bar"
import { obterSessao, redirecionarParaOLogin } from "@/lib/security/auth-guard"
import { obterVisaoDaConta, obterIdentidadeDoCasamentoPrincipal } from "@/lib/wedding"
import { obterContextoDoCasamento } from "@/lib/security/wedding-context"
import { obterContagensDoMenu } from "@/lib/nav-counts"
import { diasAte, rotuloDosDiasRestantes } from "@/lib/wedding-format"
import { MainWeddingNote } from "@/components/admin/main-wedding-note"
import { MaintenanceBanner } from "@/components/admin/maintenance-banner"
import { quantidadeNaoLidaDe } from "@/lib/notifications/queries"
import { chavePublicaVapid } from "@/lib/notifications/push"
import { ImpersonationBanner } from "@/components/admin/impersonation-banner"
import { LizAssistant } from "@/components/liz/liz-assistant"
import { PanelTourProvider } from "@/components/tour/panel-tour-provider"
import { carregarTourDoPainel } from "@/lib/tour/panel-tour"
import { AreaTabs } from "@/components/admin/area-tabs"
import { obterPlanoDoCasamento } from "@/lib/wedding-plan"
import { nomeCurtoDoPlano } from "@/lib/panel-nav"
import { urlDoSiteDoCasamento } from "@/lib/wedding-links"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Perfil e permissões vêm do banco (não só do JWT), refletindo alterações de acesso na hora.
  const session = await obterSessao();
  if (!session) return redirecionarParaOLogin();

  const { role, allowedPaths } = session;
  const [wedding, account, ctx, unreadNotifications] = await Promise.all([
    obterIdentidadeDoCasamentoPrincipal(),
    obterVisaoDaConta(),
    obterContextoDoCasamento(),
    quantidadeNaoLidaDe(session.userId),
  ]);
  const [counts, tour, plan] = await Promise.all([
    ctx ? obterContagensDoMenu(ctx.weddingId, allowedPaths.includes("*")) : undefined,
    carregarTourDoPainel(session, ctx), // passo a passo do painel (null para administração, visita "Entrar como" e fornecedor)
    ctx && !account.adminView ? obterPlanoDoCasamento(ctx.weddingId) : null,
  ]);
  // Cabeçalho: "17 abr 2027 · faltam 191 dias" (casal); a administração não mostra data
  const daysLeft = rotuloDosDiasRestantes(wedding.weddingDate ? diasAte(wedding.weddingDate) : null);
  const subtitle = account.adminView ? null : [wedding.shortDateLabel, daysLeft].filter(Boolean).join(" · ") || null;
  const planName = plan ? nomeCurtoDoPlano(plan.planId) : null;
  const siteHref = !account.adminView && ctx && wedding.slug ? urlDoSiteDoCasamento(wedding.slug, undefined, ctx.wedding.customDomain) : null;

  // "Entrar como este casal": faixa fixa no topo de TODAS as telas do painel; a barra lateral e o cabeçalho descem a altura dela
  const impersonation = ctx?.impersonation ?? null;

  return (
    <PanelTourProvider config={tour}>
    {impersonation && <ImpersonationBanner coupleNames={impersonation.weddingNames} canEdit={impersonation.canEdit} expiresAt={impersonation.expiresAt.toISOString()} />}
    {/* --faixa: altura da faixa "Vocês estão vendo como..." (0 sem ela); a barra lateral e o cabeçalho descem por ela */}
    <div className={`painel-raiz flex min-h-screen bg-linho ${impersonation ? "[--faixa:68px] md:[--faixa:56px]" : "[--faixa:0px]"}`}>
      <Sidebar allowedPaths={allowedPaths} counts={counts} planName={planName} siteHref={siteHref} />
      {/* A folha: caixa clara com o cabeçalho e o conteúdo (no celular ocupa a tela toda) */}
      <div className="relative flex min-w-0 flex-1 flex-col bg-papel md:m-2 md:ml-0 md:rounded-2xl md:border md:border-linha">
        <Header
          role={role}
          allowedPaths={allowedPaths}
          coupleNames={wedding.coupleNames}
          initials={wedding.initials}
          subtitle={subtitle}
          adminView={account.adminView}
          userName={account.userName}
          planName={planName}
          unreadNotifications={unreadNotifications}
          pushPublicKey={chavePublicaVapid()}
        />
        <main id="conteudo" className="page-in flex-1 px-4 pb-32 pt-6 md:px-8 md:pb-24 md:pt-7">
          <div className="mx-auto w-full max-w-[1240px]">
            <MaintenanceBanner allowedPaths={allowedPaths} />
            {account.adminView && ctx && <MainWeddingNote coupleNames={wedding.coupleNames} />}
            <AreaTabs allowedPaths={allowedPaths} counts={counts} />
            {children}
          </div>
        </main>
      </div>
      <MobileTabBar allowedPaths={allowedPaths} />
      <LizAssistant allowedPaths={allowedPaths} />
    </div>
    </PanelTourProvider>
  )
}
