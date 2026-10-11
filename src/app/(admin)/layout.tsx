// src/app/(admin)/layout.tsx
import { Sidebar } from "@/components/admin/sidebar"
import { Header } from "@/components/admin/header"
import { MobileTabBar } from "@/components/admin/mobile-tab-bar"
import { getSession, redirectToLogin } from "@/lib/security/auth-guard"
import { getAccountView, getWeddingIdentity } from "@/lib/wedding"
import { getWeddingContext } from "@/lib/security/wedding-context"
import { getNavCounts } from "@/lib/nav-counts"
import { accountLabel } from "@/lib/account-label"
import { daysUntil, daysLeftLabel } from "@/lib/wedding-format"
import { MainWeddingNote } from "@/components/admin/main-wedding-note"
import { MaintenanceBanner } from "@/components/admin/maintenance-banner"
import { unreadCountFor } from "@/lib/notifications/queries"
import { vapidPublicKey } from "@/lib/notifications/push"
import { ImpersonationBanner } from "@/components/admin/impersonation-banner"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Perfil e permissões vêm do banco (não só do JWT), refletindo alterações de acesso na hora.
  const session = await getSession();
  if (!session) return redirectToLogin();

  const { role, allowedPaths } = session;
  const [wedding, account, ctx, unreadNotifications] = await Promise.all([
    getWeddingIdentity(),
    getAccountView(),
    getWeddingContext(),
    unreadCountFor(session.userId),
  ]);
  const counts = ctx ? await getNavCounts(ctx.weddingId, allowedPaths.includes("*")) : undefined;
  const label = accountLabel({
    adminView: account.adminView,
    coupleNames: wedding.coupleNames,
    coupleInitials: wedding.initials,
    userName: account.userName,
    role,
  });
  // Cartão da barra lateral: "17 abr 2027 · faltam 191 dias" (casal) ou a descrição da administração.
  const daysLeft = daysLeftLabel(wedding.weddingDate ? daysUntil(wedding.weddingDate) : null);
  const subtitle = account.adminView
    ? "Gestão da plataforma"
    : [wedding.shortDateLabel, daysLeft].filter(Boolean).join(" · ") || null;

  // "Entrar como este casal": faixa fixa no topo de TODAS as telas do painel; a barra lateral e o cabeçalho descem a altura dela
  const impersonation = ctx?.impersonation ?? null;

  return (
    <>
    {impersonation && <ImpersonationBanner coupleNames={impersonation.weddingNames} canEdit={impersonation.canEdit} expiresAt={impersonation.expiresAt.toISOString()} />}
    <div
      className={
        impersonation
          ? "flex min-h-screen bg-linho md:[&>aside]:top-14 md:[&>aside]:h-[calc(100vh-3.5rem)] [&>div>header]:top-[68px] md:[&>div>header]:top-14"
          : "flex min-h-screen bg-linho"
      }
    >
      <Sidebar allowedPaths={allowedPaths} title={label.title} subtitle={subtitle} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          role={role}
          allowedPaths={allowedPaths}
          coupleNames={wedding.coupleNames}
          initials={wedding.initials}
          dateLabel={wedding.dateLabel}
          adminView={account.adminView}
          userName={account.userName}
          unreadNotifications={unreadNotifications}
          pushPublicKey={vapidPublicKey()}
        />
        <main id="conteudo" className="page-in flex-1 px-4 pb-32 pt-6 md:px-8 md:pb-12 md:pt-8">
          <div className="mx-auto w-full max-w-[1240px]">
            <MaintenanceBanner allowedPaths={allowedPaths} />
            {account.adminView && ctx && <MainWeddingNote coupleNames={wedding.coupleNames} />}
            {children}
          </div>
        </main>
      </div>
      <MobileTabBar allowedPaths={allowedPaths} title={label.title} subtitle={subtitle} initials={label.initials} counts={counts} />
    </div>
    </>
  )
}
