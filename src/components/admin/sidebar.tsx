// src/components/admin/sidebar.tsx
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { NavList, type NavCounts } from "@/components/admin/nav-list";
import { Logo } from "@/components/brand/logo";
import { temAcessoAoCaminho } from "@/lib/permissions";

interface SidebarProps {
  allowedPaths?: string[];
  counts?: NavCounts;
  /** Nome curto do plano do casamento ("Básico"); null na conta de administração sem casamento próprio. */
  planName?: string | null;
  /** Endereço público do site (abre em outra aba). */
  siteHref?: string | null;
}

/**
 * Barra lateral do computador: as 5 áreas e, embaixo, o plano e o atalho para ver o site.
 * Fica sobre o chão do painel (sem caixa); a folha com o conteúdo é a caixa clara ao lado.
 * O botão da Liz fica sobre o canto de baixo dela, por isso o espaço extra no fim.
 */
export function Sidebar({ allowedPaths = [], counts, planName = null, siteHref = null }: SidebarProps) {
  const canPlan = temAcessoAoCaminho(allowedPaths, "/plano");
  const footerRow = "flex min-h-11 items-center justify-between gap-2 rounded-[10px] px-3 text-[13px] text-tinta-suave transition-colors hover:bg-areia hover:text-tinta";
  return (
    <aside className="sticky top-[var(--faixa)] hidden h-[calc(100svh-var(--faixa))] w-60 shrink-0 flex-col gap-5 overflow-y-auto px-3 pb-24 pt-5 md:flex" data-lenis-prevent>
      <Link href="/dashboard" aria-label="Aceito, Resumo do casamento" className="flex min-h-11 w-max items-center rounded-lg px-2">
        <Logo height={26} priority />
      </Link>

      <nav aria-label="Menu principal">
        <NavList allowedPaths={allowedPaths} counts={counts} />
      </nav>

      {(planName || siteHref) && (
        <div className="mt-auto flex flex-col gap-0.5 border-t border-linha pt-3">
          {planName &&
            (canPlan ? (
              <Link href="/plano" className={footerRow}>
                <span>
                  Plano <b className="font-semibold text-tinta">{planName}</b>
                </span>
                <span>Ver planos</span>
              </Link>
            ) : (
              <p className="flex min-h-11 items-center px-3 text-[13px] text-tinta-suave">
                Plano <b className="ml-1 font-semibold text-tinta">{planName}</b>
              </p>
            ))}
          {siteHref && (
            <Link href={siteHref} target="_blank" rel="noopener" className={footerRow}>
              <span>Ver o site</span>
              <ExternalLink className="size-[15px]" aria-hidden="true" />
              <span className="sr-only">(abre em outra aba)</span>
            </Link>
          )}
        </div>
      )}
    </aside>
  );
}
