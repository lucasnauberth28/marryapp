"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { areaOfPath, navIcon, visibleAdminItems, visibleAreas, isNavItemActive, type NavCountKey } from "@/components/admin/nav-config";
import { navAnchor } from "@/lib/tour/steps";

export type NavCounts = Partial<Record<NavCountKey, number>>;

const COUNT_HINT: Record<NavCountKey, string> = { guests: "no total", messages: "sem resposta", tasks: "em aberto", domains: "aguardando" };

/** Número ao lado do nome; o complemento fica só para leitores de tela. */
export function CountMark({ n, kind, className = "" }: { n: number; kind: NavCountKey; className?: string }) {
  return (
    <span className={`text-xs font-semibold leading-4 tabular-nums text-tinta-suave ${className}`}>
      {n > 999 ? "999+" : n}
      <span className="sr-only"> {COUNT_HINT[kind]}</span>
    </span>
  );
}

const rowClass = (active: boolean) =>
  `flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm transition-colors duration-150 ${
    active ? "bg-ameixa-suave font-semibold text-ameixa" : "font-medium text-tinta-suave hover:bg-areia hover:text-tinta"
  }`;

/** As 5 áreas do painel (barra lateral do computador) e, para quem tem a permissão, as ferramentas de administração. */
export function NavList({ allowedPaths, counts = {} }: { allowedPaths: string[]; counts?: NavCounts }) {
  const pathname = usePathname();
  const areas = visibleAreas(allowedPaths);
  const current = areaOfPath(areas, pathname);
  const adminItems = visibleAdminItems(allowedPaths);

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-0.5">
        {areas.map((area) => {
          const Icon = navIcon(area.icon);
          const active = current?.id === area.id;
          return (
            <li key={area.id}>
              <Link href={area.href} data-tour={navAnchor(area.href)} aria-current={active ? "page" : undefined} className={rowClass(active)}>
                <Icon className="size-[18px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{area.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {adminItems.length > 0 && (
        <div role="group" aria-labelledby="menu-gestao" className="flex flex-col gap-0.5">
          <p id="menu-gestao" className="px-3 pb-1 text-xs font-medium leading-4 text-tinta-suave">
            Gestão da plataforma
          </p>
          {adminItems.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(pathname, item.href);
            const count = item.countKey ? (counts[item.countKey] ?? 0) : 0;
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={rowClass(active)}>
                <Icon className="size-[18px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {count > 0 && item.countKey && <CountMark n={count} kind={item.countKey} />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
