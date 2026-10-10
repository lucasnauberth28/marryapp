// src/app/(admin)/layout.tsx
import { Sidebar } from "@/components/admin/sidebar"
import { Header } from "@/components/admin/header"
import { MobileTabBar } from "@/components/admin/mobile-tab-bar"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/security/auth-guard"
import { getAccountView, getWeddingIdentity } from "@/lib/wedding"
import { getWeddingContext } from "@/lib/security/wedding-context"
import { getNavCounts } from "@/lib/nav-counts"
import { accountLabel } from "@/lib/account-label"
import { daysUntil, daysLeftLabel } from "@/lib/wedding-format"
import { MainWeddingNote } from "@/components/admin/main-wedding-note"
import { unreadCountFor } from "@/lib/notifications/queries"
import { vapidPublicKey } from "@/lib/notifications/push"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Perfil e permissões vêm do banco (não só do JWT), refletindo alterações de acesso na hora.
  const session = await getSession();
  if (!session) redirect("/login");

  const { role, allowedPaths } = session;
  const [wedding, account, ctx, unreadNotifications] = await Promise.all([
    getWeddingIdentity(),
    getAccountView(),
    getWeddingContext(),
    unreadCountFor(session.userId),
  ]);
  const counts = ctx ? await getNavCounts(ctx.weddingId) : undefined;
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

  return (
    <div className="flex min-h-screen bg-linho">
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
            {account.adminView && ctx && <MainWeddingNote coupleNames={wedding.coupleNames} />}
            {children}
          </div>
        </main>
      </div>
      <MobileTabBar allowedPaths={allowedPaths} title={label.title} subtitle={subtitle} initials={label.initials} counts={counts} />
    </div>
  )
}
