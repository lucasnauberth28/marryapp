"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, visibleNavGroups } from "@/components/admin/nav-config";

interface NavListProps {
  allowedPaths: string[];
  collapsed?: boolean;
  onNavigate?: () => void;
  /** Itens maiores (aba "Mais" no celular). */
  large?: boolean;
}

export function NavList({ allowedPaths, collapsed = false, onNavigate, large = false }: NavListProps) {
  const pathname = usePathname();
  const groups = visibleNavGroups(allowedPaths);

  return (
    <div className={`flex flex-col ${large ? "gap-6" : "gap-5"}`}>
      {groups.map((group, index) => (
        <div key={group.title ?? `grupo-${index}`} className="flex flex-col gap-0.5">
          {group.title && !collapsed && (
            <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{group.title}</p>
          )}
          {group.title && collapsed && index > 0 && <div className="mx-3 mb-1 border-t border-linha" aria-hidden="true" />}
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.name : undefined}
                aria-label={collapsed ? item.name : undefined}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 transition-colors duration-200 ${
                  large ? "min-h-12 text-base" : "min-h-10 text-[15px]"
                } ${
                  active
                    ? "bg-ameixa-suave font-semibold text-ameixa"
                    : "font-medium text-tinta-suave hover:bg-areia/70 hover:text-tinta"
                } ${collapsed ? "justify-center" : "justify-start"}`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${active ? "text-ameixa" : "text-tinta-suave"}`}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
