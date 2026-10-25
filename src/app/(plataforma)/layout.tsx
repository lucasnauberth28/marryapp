import { Suspense } from "react";
import type { Metadata } from "next";
import { BarraLateralDaPlataforma } from "@/components/plataforma/sidebar";
import { MenuMovelDaPlataforma } from "@/components/plataforma/mobile-nav";
import { BarraSuperiorMovelDaPlataforma } from "@/components/plataforma/mobile-top-bar";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { obterContagensDoMenuDaPlataforma } from "@/lib/platform/nav-counts";

// A administração nunca aparece em buscadores
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Shell da administração da plataforma (/admin/...): barra lateral no computador, barra inferior com "Mais" no celular.
 * O layout confere o acesso, mas NÃO basta: cada página, Server Action e rota de API chama requirePlatformAdmin*
 * por conta própria (o layout não roda de novo em toda navegação).
 */
type Who = { name: string; initials: string; roleLabel: string };

/** Os números do menu vêm de 8 consultas: o menu já aparece sem eles e os números entram quando chegam. */
async function SidebarWithCounts(who: Who) {
  return <BarraLateralDaPlataforma counts={await obterContagensDoMenuDaPlataforma()} {...who} />;
}
async function MobileNavWithCounts(who: Who) {
  return <MenuMovelDaPlataforma counts={await obterContagensDoMenuDaPlataforma()} {...who} />;
}

export default async function PlataformaLayout({ children }: { children: React.ReactNode }) {
  // O guard fica antes de qualquer streaming (sem sessão vai ao login, sem acesso total dá 404)
  const admin = await exigirAdminDaPlataformaNaPagina();
  const who: Who = { name: admin.name ?? "Administrador", initials: admin.initials, roleLabel: admin.roleLabel };

  return (
    <div className="flex min-h-screen bg-linho">
      <Suspense fallback={<BarraLateralDaPlataforma counts={{}} {...who} />}>
        <SidebarWithCounts {...who} />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperiorMovelDaPlataforma />
        <main id="conteudo" className="page-in flex-1 px-4 pb-32 pt-6 md:px-8 md:pb-16 md:pt-10 lg:px-10">
          <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">{children}</div>
        </main>
      </div>
      <Suspense fallback={<MenuMovelDaPlataforma counts={{}} {...who} />}>
        <MobileNavWithCounts {...who} />
      </Suspense>
    </div>
  );
}
