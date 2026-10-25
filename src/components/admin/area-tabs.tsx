"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { areaDoCaminho, itemDoMenuEstaAtivo, iconeDoMenu, areasVisiveis } from "@/components/admin/nav-config";
import { MarcaDeContagem, type ContagensDoMenu } from "@/components/admin/nav-list";

/**
 * Abas da área: as telas do mesmo grupo do menu (Convidados: lista, mensagens, mesas...), no topo da página.
 * Só aparecem quando a área tem mais de uma tela que a pessoa pode abrir. No celular rolam para o lado.
 */
export function AbasDeArea({ allowedPaths, counts = {} }: { allowedPaths: string[]; counts?: ContagensDoMenu }) {
  const pathname = usePathname();
  const areas = areasVisiveis(allowedPaths);
  const area = areaDoCaminho(areas, pathname);
  if (!area || area.screens.length < 2) return null;

  return (
    <nav aria-label={`Telas de ${area.name}`} className="-mx-4 mb-5 overflow-x-auto px-4 md:mx-0 md:mb-6 md:px-0" data-lenis-prevent>
      <ul className="flex min-w-max gap-1 border-b border-linha">
        {area.screens.map((screen) => {
          const Icon = iconeDoMenu(screen.icon);
          const active = itemDoMenuEstaAtivo(pathname, screen.href);
          const count = screen.countKey ? (counts[screen.countKey] ?? 0) : 0;
          return (
            <li key={screen.href}>
              <Link
                href={screen.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm transition-colors ${
                  active ? "border-ameixa font-semibold text-ameixa" : "border-transparent font-medium text-tinta-suave hover:text-tinta"
                }`}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                {screen.name}
                {count > 0 && screen.countKey && <MarcaDeContagem n={count} kind={screen.countKey} />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
