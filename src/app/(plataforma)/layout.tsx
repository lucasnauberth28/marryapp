import type { Metadata } from "next";
import { PlatformSidebar } from "@/components/plataforma/sidebar";
import { PlatformMobileNav } from "@/components/plataforma/mobile-nav";
import { PlatformMobileTopBar } from "@/components/plataforma/mobile-top-bar";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { getPlatformNavCounts } from "@/lib/platform/nav-counts";

// A administração nunca aparece em buscadores
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Shell da administração da plataforma (/admin/...): barra lateral no computador, barra inferior com "Mais" no celular.
 * O layout confere o acesso, mas NÃO basta: cada página, Server Action e rota de API chama requirePlatformAdmin*
 * por conta própria (o layout não roda de novo em toda navegação).
 */
export default async function PlataformaLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePlatformAdminPage();
  const counts = await getPlatformNavCounts();
  const name = admin.name ?? "Administrador";

  return (
    <div className="flex min-h-screen bg-linho">
      <PlatformSidebar counts={counts} name={name} initials={admin.initials} roleLabel={admin.roleLabel} />
      <div className="flex min-w-0 flex-1 flex-col">
        <PlatformMobileTopBar />
        <main id="conteudo" className="page-in flex-1 px-4 pb-32 pt-6 md:px-8 md:pb-16 md:pt-10 lg:px-10">
          <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">{children}</div>
        </main>
      </div>
      <PlatformMobileNav counts={counts} name={name} initials={admin.initials} roleLabel={admin.roleLabel} />
    </div>
  );
}
