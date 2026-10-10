// src/app/(admin)/layout.tsx
import { Sidebar } from "@/components/admin/sidebar"
import { Header } from "@/components/admin/header"
import { MobileTabBar } from "@/components/admin/mobile-tab-bar"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/security/auth-guard"
import { getWeddingIdentity } from "@/lib/wedding"
import { unreadCountFor } from "@/lib/notifications/queries"
import { vapidPublicKey } from "@/lib/notifications/push"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Perfil e permissões vêm do banco (não só do JWT), refletindo alterações de acesso na hora.
  const session = await getSession();
  if (!session) redirect("/login");

  const { role, allowedPaths } = session;
  const [wedding, unreadNotifications] = await Promise.all([getWeddingIdentity(), unreadCountFor(session.userId)]);

  return (
    <div className="flex min-h-screen bg-linho">
      <Sidebar allowedPaths={allowedPaths} coupleNames={wedding.coupleNames} dateLabel={wedding.dateLabel} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          role={role}
          allowedPaths={allowedPaths}
          coupleNames={wedding.coupleNames}
          initials={wedding.initials}
          dateLabel={wedding.dateLabel}
          unreadNotifications={unreadNotifications}
          pushPublicKey={vapidPublicKey()}
        />
        <main id="conteudo" className="page-in flex-1 px-4 pb-32 pt-6 md:px-8 md:pb-12 md:pt-8">
          <div className="mx-auto w-full max-w-[1240px]">
            {children}
          </div>
        </main>
      </div>
      <MobileTabBar allowedPaths={allowedPaths} coupleNames={wedding.coupleNames} />
    </div>
  )
}
