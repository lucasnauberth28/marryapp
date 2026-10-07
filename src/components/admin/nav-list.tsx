"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, visibleNavGroups } from "@/components/admin/nav-config";

interface NavListProps {
  allowedPaths: string[];
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function NavList({ allowedPaths, collapsed = false, onNavigate }: NavListProps) {
  const pathname = usePathname();
  const groups = visibleNavGroups(allowedPaths);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group, index) => (
        <div key={group.title ?? `grupo-${index}`} className="flex flex-col gap-0.5">
          {group.title && !collapsed && (
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">{group.title}</p>
          )}
          {group.title && collapsed && index > 0 && <div className="mx-3 mb-1 border-t border-stone-200/70" aria-hidden="true" />}
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-brand-100 font-semibold text-brand-600"
                    : "font-medium text-stone-600 hover:bg-stone-100/70 hover:text-stone-900"
                } ${collapsed ? "justify-center" : "justify-start"}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-brand-600" : "text-stone-500"}`} aria-hidden="true" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
