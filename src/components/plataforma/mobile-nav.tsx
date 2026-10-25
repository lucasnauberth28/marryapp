"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, X } from "lucide-react";
import { sair } from "@/actions/auth-actions";
import { ListaDoMenuDaPlataforma, type ContagensDoMenuDaPlataformaNaPropriedade } from "@/components/plataforma/nav-list";
import { ABAS_MOVEIS_DA_PLATAFORMA, ICONE_DE_MAIS_DA_PLATAFORMA, itemDaPlataformaEstaAtivo, gruposDeMaisDaPlataforma } from "@/components/plataforma/nav-config";

/**
 * Navegação da administração no celular (some a partir de md): barra inferior com as quatro áreas mais usadas
 * e "Mais", que abre uma folha com todas as outras, o cartão da conta e "Sair". Mesmo padrão do painel do casal.
 */
export function MenuMovelDaPlataforma({
  counts,
  name,
  initials,
  roleLabel,
}: {
  counts: ContagensDoMenuDaPlataformaNaPropriedade;
  name: string;
  initials: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreGroups = gruposDeMaisDaPlataforma();
  const inTabs = ABAS_MOVEIS_DA_PLATAFORMA.some((tab) => itemDaPlataformaEstaAtivo(pathname, tab));
  const MoreIcon = ICONE_DE_MAIS_DA_PLATAFORMA;
  // Número do "Mais": soma do que está nos itens escondidos nele (para não perder o aviso)
  const hiddenCount = moreGroups.flatMap((g) => g.items).reduce((sum, item) => sum + (item.countKey ? (counts[item.countKey] ?? 0) : 0), 0);

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
    `flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[11px] font-semibold transition-colors ${active ? "text-ameixa" : "text-tinta-suave"}`;
  const pillClass = (active: boolean) =>
    `relative grid h-8 w-14 place-items-center rounded-full transition-all duration-300 ease-[var(--ease-aceito)] ${active ? "bg-ameixa-suave" : "bg-transparent"}`;

  return (
    <>
      <nav
        aria-label="Navegação da administração"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-linha bg-papel/95 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur-md md:hidden"
      >
        {ABAS_MOVEIS_DA_PLATAFORMA.map((tab) => {
          const Icon = tab.icon;
          const active = itemDaPlataformaEstaAtivo(pathname, tab) && !moreOpen;
          return (
            <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined} className={tabClass(active)}>
              <span className={pillClass(active)}>
                <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <span className="max-w-full truncate">{tab.name}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-controls="admin-mais"
          className={tabClass(moreOpen || !inTabs)}
        >
          <span className={pillClass(moreOpen || !inTabs)}>
            <MoreIcon className="size-5" strokeWidth={1.6} aria-hidden="true" />
            {hiddenCount > 0 && <span className="absolute right-2 top-0.5 size-2 rounded-full bg-ameixa" aria-hidden="true" />}
          </span>
          Mais
          {hiddenCount > 0 && <span className="sr-only">, {hiddenCount} para resolver</span>}
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-labelledby="admin-mais-titulo">
          <button type="button" aria-label="Fechar" className="absolute inset-0 bg-scrim/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setMoreOpen(false)} />
          <div
            id="admin-mais"
            className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl bg-linho shadow-[var(--shadow-aceito-2)] animate-in slide-in-from-bottom duration-300"
          >
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-linha" aria-hidden="true" />
            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <h2 id="admin-mais-titulo" className="font-display text-2xl font-medium text-tinta">Mais</h2>
              <button type="button" onClick={() => setMoreOpen(false)} className="grid size-11 place-items-center rounded-xl text-tinta-suave hover:bg-areia" aria-label="Fechar">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2" data-lenis-prevent>
              <div className="flex flex-col gap-5">
                <Link
                  href="/conta"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-linha bg-papel px-4 py-3.5 shadow-[var(--shadow-aceito-1)]"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ameixa-suave font-display text-lg text-ameixa" aria-hidden="true">
                    {initials}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate font-semibold text-tinta">{name}</strong>
                    <span className="truncate text-sm text-tinta-suave">{roleLabel}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-tinta-suave" aria-hidden="true" />
                </Link>
                <nav aria-label="Todas as áreas da administração">
                  <ListaDoMenuDaPlataforma variant="cards" groups={moreGroups} counts={counts} onNavigate={() => setMoreOpen(false)} />
                </nav>
                <form action={sair} className="rounded-2xl border border-linha bg-papel px-4 shadow-[var(--shadow-aceito-1)]">
                  <button type="submit" className="flex min-h-[52px] w-full cursor-pointer items-center gap-3 text-base text-perigo">
                    <LogOut className="size-5" strokeWidth={1.6} aria-hidden="true" /> Sair
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
