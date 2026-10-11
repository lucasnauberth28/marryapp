"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PLATFORM_COUNT_HINT,
  PLATFORM_NAV_GROUPS,
  isPlatformItemActive,
  type PlatformCountKey,
  type PlatformNavGroup,
} from "@/components/plataforma/nav-config";

/**
 * Lista do menu da administração.
 *   <PlatformNavList counts={counts} />                           barra lateral (padrão)
 *   <PlatformNavList variant="cards" groups={...} counts onNavigate />   aba "Mais" do celular
 * `counts` vem de getPlatformNavCounts (servidor). Item ativo: aria-current="page".
 */

export type PlatformNavCountsProp = Partial<Record<PlatformCountKey, number>>;

interface Props {
  counts?: PlatformNavCountsProp;
  groups?: PlatformNavGroup[];
  variant?: "sidebar" | "cards";
  onNavigate?: () => void;
}

function CountMark({ n, kind }: { n: number; kind: PlatformCountKey }) {
  return (
    <span className="ml-auto text-xs font-semibold leading-4 text-tinta-suave">
      {n > 999 ? "999+" : n}
      <span className="sr-only"> {PLATFORM_COUNT_HINT[kind]}</span>
    </span>
  );
}

const GROUP_TITLE = "px-3 pb-2 text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave";

export function PlatformNavList({ counts = {}, groups = PLATFORM_NAV_GROUPS, variant = "sidebar", onNavigate }: Props) {
  const pathname = usePathname();

  if (variant === "cards") {
    return (
      <div className="flex flex-col gap-5">
        {groups.map((group, index) => (
          <section key={group.title ?? `grupo-${index}`} aria-label={group.title}>
            {group.title && <p className="px-1 pb-2 text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">{group.title}</p>}
            <div className="rounded-2xl border border-linha bg-papel px-4 shadow-[var(--shadow-aceito-1)]">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isPlatformItemActive(pathname, item);
                const count = item.countKey ? (counts[item.countKey] ?? 0) : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[52px] items-center gap-3 border-b border-linha text-base last:border-b-0 ${active ? "font-semibold text-ameixa" : "text-tinta"}`}
                  >
                    <Icon className={`size-5 shrink-0 ${active ? "text-ameixa" : "text-tinta-suave"}`} strokeWidth={1.75} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    {count > 0 && item.countKey && <CountMark n={count} kind={item.countKey} />}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group, index) => (
        <div key={group.title ?? `grupo-${index}`} className="flex flex-col gap-0.5">
          {group.title && <p className={GROUP_TITLE}>{group.title}</p>}
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isPlatformItemActive(pathname, item);
            const count = item.countKey ? (counts[item.countKey] ?? 0) : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 transition-colors duration-150 ${
                  item.child ? "ml-5 min-h-9 text-sm" : "min-h-10 text-[15px]"
                } ${active ? "bg-ameixa-suave font-semibold text-ameixa" : "font-medium text-tinta-suave hover:bg-areia hover:text-tinta"}`}
              >
                <Icon className={`size-5 shrink-0 ${active ? "text-ameixa" : "text-tinta-suave"}`} strokeWidth={1.75} aria-hidden="true" />
                <span className="min-w-0 flex-1 leading-5">{item.name}</span>
                {count > 0 && item.countKey && <CountMark n={count} kind={item.countKey} />}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
