"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, visibleNavGroups, type NavCountKey, type NavGroup } from "@/components/admin/nav-config";

export type NavCounts = Partial<Record<NavCountKey, number>>;

interface NavListProps {
  allowedPaths: string[];
  collapsed?: boolean;
  onNavigate?: () => void;
  /** Itens maiores (aba "Mais" no celular). */
  large?: boolean;
  /** "cards": cada grupo vira um cartão com linhas de 52px, como a aba "Mais" do design. */
  variant?: "sidebar" | "cards";
  /** Grupos já filtrados; sem isto, mostra todos os que o perfil pode ver. */
  groups?: NavGroup[];
  /** Contadores reais (só aparecem quando maiores que zero). */
  counts?: NavCounts;
}

const COUNT_HINT: Record<NavCountKey, string> = { guests: "no total", messages: "sem resposta", tasks: "em aberto" };

/** Número à direita do item; o complemento fica só para leitores de tela. */
function CountMark({ n, kind }: { n: number; kind: NavCountKey }) {
  return (
    <span className="ml-auto text-xs font-semibold leading-4 text-tinta-suave">
      {n > 999 ? "999+" : n}
      <span className="sr-only"> {COUNT_HINT[kind]}</span>
    </span>
  );
}

export function NavList({ allowedPaths, collapsed = false, onNavigate, large = false, variant = "sidebar", groups: given, counts = {} }: NavListProps) {
  const pathname = usePathname();
  const groups = given ?? visibleNavGroups(allowedPaths);

  if (variant === "cards") {
    return (
      <div className="flex flex-col gap-5">
        {groups.map((group, index) => (
          <section key={group.title ?? `grupo-${index}`} aria-label={group.title}>
            {group.title && <p className="px-1 pb-2 text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">{group.title}</p>}
            <div className="rounded-2xl border border-linha bg-papel px-4 shadow-[var(--shadow-aceito-1)]">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(pathname, item.href);
                const count = item.countKey ? (counts[item.countKey] ?? 0) : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[52px] items-center gap-3 border-b border-linha text-base last:border-b-0 ${active ? "font-semibold text-ameixa" : "text-tinta"}`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${active ? "text-ameixa" : "text-tinta-suave"}`} strokeWidth={1.75} aria-hidden="true" />
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
    <div className="flex flex-col gap-6">
      {groups.map((group, index) => (
        <div key={group.title ?? `grupo-${index}`} className="flex flex-col gap-0.5">
          {group.title && !collapsed && (
            <p className="px-3 pb-2 text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">{group.title}</p>
          )}
          {group.title && collapsed && index > 0 && <div className="mx-3 mb-1 border-t border-linha" aria-hidden="true" />}
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(pathname, item.href);
            const count = item.countKey ? (counts[item.countKey] ?? 0) : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.name : undefined}
                aria-label={collapsed ? item.name : undefined}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 transition-colors duration-150 ${
                  large ? "min-h-12 text-base" : "min-h-10 text-[15px]"
                } ${
                  active
                    ? "bg-ameixa-suave font-semibold text-ameixa"
                    : "font-medium text-tinta-suave hover:bg-areia hover:text-tinta"
                } ${collapsed ? "justify-center" : "justify-start"}`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${active ? "text-ameixa" : "text-tinta-suave"}`}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                {!collapsed && <span className="min-w-0 flex-1 truncate">{item.name}</span>}
                {!collapsed && count > 0 && item.countKey && <CountMark n={count} kind={item.countKey} />}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
