"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, CreditCard, ExternalLink, Inbox, LogOut, Star, Store, UserRound, type LucideIcon } from "lucide-react";
import { logout } from "@/actions/auth-actions";
import { cn } from "@/lib/utils";
import { PLAN_HREF } from "../_lib/vendor-panel";

const PANEL = "/fornecedor";
const ORDERS = "/fornecedor/pedidos";
const AGENDA = "/fornecedor/agenda";
const PROFILE = "/fornecedor/perfil";
const REVIEWS = "/fornecedor/avaliacoes";
const NOTIFICATIONS = "/fornecedor/notificacoes";

function isActive(pathname: string, href: string) {
  // A lista de pedidos fica em /fornecedor; o detalhe, em /fornecedor/pedidos/[id].
  if (href === PANEL) return pathname === PANEL || pathname === ORDERS || pathname.startsWith(`${ORDERS}/`);
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
    { href: AGENDA, label: "Agenda", icon: CalendarDays },
    { href: PROFILE, label: "Meu perfil", icon: Store },
    { href: REVIEWS, label: "Avaliações", icon: Star },
    { href: PLAN_HREF, label: "Plano", icon: CreditCard },
    { href: NOTIFICATIONS, label: "Avisos", icon: Bell },
    { href: "/conta", label: "Minha conta", icon: UserRound },
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

/** Botão "Sair" só com ícone, para o topo no celular. */
export function LogoutIconButton() {
  return (
    <form action={logout} className="shrink-0">
      <button
        type="submit"
        aria-label="Sair"
        title="Sair"
        className="grid size-11 place-items-center rounded-xl text-tinta-suave transition-colors hover:bg-areia hover:text-tinta"
      >
        <LogOut aria-hidden="true" className="size-5" />
      </button>
    </form>
  );
}

const MOBILE_TITLES: { href: string; title: string }[] = [
  { href: ORDERS, title: "Pedido" },
  { href: AGENDA, title: "Agenda" },
  { href: PROFILE, title: "Meu perfil" },
  { href: REVIEWS, title: "Avaliações" },
  { href: PLAN_HREF, title: "Plano" },
  { href: NOTIFICATIONS, title: "Avisos" },
];

/** Título do topo no celular, conforme a página. */
export function VendorMobileTitle() {
  const pathname = usePathname();
  const match = MOBILE_TITLES.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
  return <p className="min-w-0 flex-1 truncate text-lg font-semibold">{match?.title ?? "Pedidos"}</p>;
}

/** Barra de abas inferior (celular): 80px incluindo a área segura. */
export function VendorTabBar() {
  const pathname = usePathname();
  const tabs = [
    { href: PANEL, label: "Pedidos", icon: Inbox },
    { href: AGENDA, label: "Agenda", icon: CalendarDays },
    { href: PROFILE, label: "Perfil", icon: Store },
    { href: PLAN_HREF, label: "Plano", icon: CreditCard },
  ];

  return (
    <nav
      aria-label="Painel do fornecedor"
      className="fixed inset-x-0 bottom-0 z-40 grid h-20 grid-cols-4 border-t border-linha bg-papel pb-[max(16px,env(safe-area-inset-bottom))] md:hidden"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors",
              active ? "text-salvia" : "text-tinta-suave hover:text-tinta",
            )}
          >
            <span className={cn("grid place-items-center rounded-full px-3.5 py-0.5", active && "bg-salvia-suave")}>
              <Icon aria-hidden="true" className="size-5" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
