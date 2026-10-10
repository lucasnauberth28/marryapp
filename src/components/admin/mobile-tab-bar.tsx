"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, X } from "lucide-react";
import { logout } from "@/actions/auth-actions";
import { NavList, type NavCounts } from "@/components/admin/nav-list";
import { MORE_TAB_ICON, isNavItemActive, visibleMobileTabs, visibleMoreGroups } from "@/components/admin/nav-config";
import { hasPathAccess } from "@/lib/permissions";

/** Cartão do topo da aba "Mais": quem está no painel; leva às Configurações quando a conta pode abri-las. */
function AccountCard({
  title,
  subtitle,
  initials,
  href,
  onNavigate,
}: {
  title: string;
  subtitle?: string | null;
  initials: string;
  href: string | null;
  onNavigate: () => void;
}) {
  const className = "flex items-center gap-3 rounded-2xl border border-linha bg-papel px-4 py-3.5 shadow-[var(--shadow-aceito-1)]";
  const content = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ameixa-suave font-display text-lg text-ameixa" aria-hidden="true">
        {initials}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate font-semibold text-tinta">{title}</strong>
        {subtitle && <span className="truncate text-sm text-tinta-suave">{subtitle}</span>}
      </span>
      {href && <ChevronRight className="h-5 w-5 shrink-0 text-tinta-suave" aria-hidden="true" />}
    </>
  );
  return href ? (
    <Link href={href} onClick={onNavigate} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

/**
 * Navegação do painel no celular: barra inferior fixa com as áreas mais usadas
 * e a aba "Mais", que abre uma folha com todas as áreas.
 */
export function MobileTabBar({
  allowedPaths,
  title,
  subtitle,
  initials,
  counts,
}: {
  allowedPaths: string[];
  /** Nomes do casal ou "Administração". */
  title: string;
  subtitle?: string | null;
  initials: string;
  counts?: NavCounts;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const tabs = visibleMobileTabs(allowedPaths);
  const moreGroups = visibleMoreGroups(allowedPaths);
  const canSettings = hasPathAccess(allowedPaths, "/configuracoes");
  const inTabs = tabs.some((t) => isNavItemActive(pathname, t.href));
  const MoreIcon = MORE_TAB_ICON;

  // Fecha a folha ao trocar de página e trava a rolagem do fundo enquanto aberta.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com a navegação
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const tabClass = (active: boolean) =>
    `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${
      active ? "text-ameixa" : "text-tinta-suave"
    }`;
  const pillClass = (active: boolean) =>
    `grid h-8 w-14 place-items-center rounded-full transition-all duration-300 ease-[var(--ease-aceito)] ${
      active ? "bg-ameixa-suave" : "bg-transparent"
    }`;

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-linha bg-papel/95 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur-md md:hidden"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isNavItemActive(pathname, tab.href) && !moreOpen;
          return (
            <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined} className={tabClass(active)}>
              <span className={pillClass(active)}>
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              {tab.name}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-controls="painel-mais"
          className={tabClass(moreOpen || !inTabs)}
        >
          <span className={pillClass(moreOpen || !inTabs)}>
            <MoreIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          Mais
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-labelledby="painel-mais-titulo">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-tinta/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setMoreOpen(false)}
          />
          <div
            id="painel-mais"
            className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl bg-linho shadow-[var(--shadow-aceito-2)] animate-in slide-in-from-bottom duration-300"
          >
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-linha" aria-hidden="true" />
            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <h2 id="painel-mais-titulo" className="font-display text-2xl font-medium text-tinta">Mais</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-xl text-tinta-suave hover:bg-areia"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2" data-lenis-prevent>
              <div className="flex flex-col gap-5">
                <AccountCard title={title} subtitle={subtitle} initials={initials} href={canSettings ? "/configuracoes" : null} onNavigate={() => setMoreOpen(false)} />
                <nav aria-label="Todas as áreas">
                  <NavList allowedPaths={allowedPaths} variant="cards" groups={moreGroups} counts={counts} onNavigate={() => setMoreOpen(false)} />
                </nav>
                <div className="rounded-2xl border border-linha bg-papel px-4 shadow-[var(--shadow-aceito-1)]">
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="flex min-h-[52px] w-full items-center gap-3 text-base text-perigo"
                  >
                    <LogOut className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" /> Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
