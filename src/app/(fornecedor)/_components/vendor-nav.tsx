"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, ExternalLink, Inbox, LogOut, Store, type LucideIcon } from "lucide-react";
import { logout } from "@/actions/auth-actions";
import { cn } from "@/lib/utils";
import { PLAN_HREF } from "../_lib/vendor-panel";

const PANEL = "/fornecedor";
const PROFILE = "/fornecedor/perfil";

function isActive(pathname: string, href: string) {
  if (href === PANEL) return pathname === PANEL;
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface SideItem {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  external?: boolean;
}

/** Navegação lateral (desktop). */
export function VendorSidebarNav({ newLeads, publicProfileHref }: { newLeads: number; publicProfileHref: string | null }) {
  const pathname = usePathname();

  const items: SideItem[] = [
    { href: PANEL, label: "Pedidos de orçamento", icon: Inbox, count: newLeads },
    { href: PROFILE, label: "Meu perfil", icon: Store },
    { href: PLAN_HREF, label: "Plano", icon: CreditCard },
  ];
  if (publicProfileHref) {
    items.push({ href: publicProfileHref, label: "Ver perfil público", icon: ExternalLink, external: true });
  }

  return (
    <nav aria-label="Painel do fornecedor">
      <ul className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon, count, external }) => {
          const active = !external && isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors",
                  active ? "bg-salvia-suave font-semibold text-salvia" : "text-tinta-suave hover:bg-areia hover:text-tinta",
                )}
              >
                <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                <span className="flex-1">{label}</span>
                {count ? (
                  <span className="min-w-6 rounded-full bg-ameixa px-1.5 py-0.5 text-center text-xs font-semibold text-on-ameixa">
                    {count}
                    <span className="sr-only"> sem resposta</span>
                  </span>
                ) : null}
                {external ? <span className="sr-only">(abre em nova aba)</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={cn(
          "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-tinta-suave transition-colors hover:bg-areia hover:text-tinta",
          className,
        )}
      >
        <LogOut aria-hidden="true" className="size-[18px] shrink-0" />
        Sair
      </button>
    </form>
  );
}

/** Título do topo no celular, conforme a página. */
export function VendorMobileTitle() {
  const pathname = usePathname();
  return (
    <p className="min-w-0 flex-1 truncate text-lg font-semibold">{isActive(pathname, PROFILE) ? "Meu perfil" : "Pedidos"}</p>
  );
}

const tabClass =
  "flex min-h-11 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors";

function TabIcon({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) {
  return (
    <span className={cn("grid place-items-center rounded-full px-3.5 py-0.5", active && "bg-salvia-suave")}>
      <Icon aria-hidden="true" className="size-5" />
    </span>
  );
}

/** Barra de abas inferior (celular): 80px incluindo a área segura. */
export function VendorTabBar() {
  const pathname = usePathname();
  const tabs = [
    { href: PANEL, label: "Pedidos", icon: Inbox },
    { href: PROFILE, label: "Perfil", icon: Store },
    { href: PLAN_HREF, label: "Plano", icon: CreditCard },
  ];

  return (
    <nav
      aria-label="Painel do fornecedor"
      className="fixed inset-x-0 bottom-0 z-40 grid h-20 grid-cols-4 border-t border-linha bg-papel pb-[max(16px,env(safe-area-inset-bottom))] md:hidden"
    >
      {tabs.map(({ href, label, icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(tabClass, active ? "text-salvia" : "text-tinta-suave hover:text-tinta")}
          >
            <TabIcon icon={icon} active={active} />
            {label}
          </Link>
        );
      })}
      <form action={logout} className="contents">
        <button type="submit" className={cn(tabClass, "text-tinta-suave hover:text-tinta")}>
          <TabIcon icon={LogOut} active={false} />
          Sair
        </button>
      </form>
    </nav>
  );
}
