"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Settings as SettingsIcon, LogOut, CreditCard as CreditCardIcon, UserRound, LayoutDashboard, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/auth-actions";
import { Spinner } from "@/components/ui/spinner";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { hasPathAccess, isPlatformAdminPaths } from "@/lib/permissions";
import { Logo } from "@/components/brand/logo";
import { accountLabel } from "@/lib/account-label";
import { TourMenuItem } from "@/components/tour/tour-restart";
import { ThemeMenuItems, ThemeToggle } from "@/components/theme/theme-toggle";
import { visibleAdminItems } from "@/components/admin/nav-config";

interface HeaderProps {
  role?: string;
  allowedPaths?: string[];
  coupleNames: string;
  initials: string;
  /** "17 abr 2027 · faltam 178 dias" (vazio na conta de administração). */
  subtitle?: string | null;
  /** Conta de administração sem casamento próprio: mostra "Administração" em vez do casal. */
  adminView?: boolean;
  /** Nome cadastrado do usuário (null na conta de emergência). */
  userName?: string | null;
  /** Nome curto do plano ("Básico"), mostrado ao lado de "Plano e pagamentos". */
  planName?: string | null;
  /** Avisos não lidos, já contados no servidor. */
  unreadNotifications?: number;
  pushPublicKey?: string | null;
}

const menuItem = "cursor-pointer rounded-[8px] px-3 py-2.5 text-sm text-tinta";

/**
 * Cabeçalho da folha: quem é o casal e quando é o casamento à esquerda; tema, avisos e menu da conta à direita,
 * sempre no mesmo lugar. Configurações, plano, conta e sair moram no menu da conta (saíram do menu principal).
 */
export function Header({ role = "Admin", allowedPaths = [], coupleNames, initials, subtitle, adminView = false, userName = null, planName = null, unreadNotifications = 0, pushPublicKey = null }: HeaderProps) {
  const [leaving, startLeave] = useTransition();
  const can = (path: string) => hasPathAccess(allowedPaths, path);
  const label = accountLabel({ adminView, coupleNames, coupleInitials: initials, userName, role });
  // Só a conta com acesso total ("*") vê o caminho de volta para a administração da plataforma
  const isPlatformAdmin = isPlatformAdminPaths(allowedPaths);
  const adminItems = visibleAdminItems(allowedPaths);

  return (
    <header className="sticky top-[var(--faixa)] z-40 flex min-h-[60px] items-center justify-between gap-3 border-b border-linha bg-papel/95 px-4 backdrop-blur-md md:min-h-16 md:rounded-t-2xl md:pl-8 md:pr-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/dashboard" aria-label="Aceito, Resumo do casamento" className="shrink-0 md:hidden">
          <Logo variant="mark" height={30} />
        </Link>
        <p className="flex min-w-0 flex-col md:flex-row md:items-baseline md:gap-3">
          <span className="truncate font-display text-base font-semibold leading-5 tracking-[-0.01em] text-tinta md:text-lg md:leading-6">{label.title}</span>
          {!adminView && subtitle && <span className="truncate text-xs leading-4 text-tinta-suave tabular-nums md:text-[13px]">{subtitle}</span>}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 md:gap-1">
        {isPlatformAdmin && (
          <Link href="/admin" className="hidden min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-tinta-suave transition-colors hover:text-ameixa md:inline-flex">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Administração
          </Link>
        )}
        {/* Seletor de tema sempre à mão no cabeçalho (claro é o padrão; escuro por escolha) */}
        <ThemeToggle />
        <NotificationBell initialUnread={unreadNotifications} allHref="/notificacoes" settingsHref="/conta#avisos" pushPublicKey={pushPublicKey} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-11 cursor-pointer items-center gap-1 rounded-full pl-1 pr-1 text-tinta-suave md:pr-1.5 transition-colors hover:bg-areia/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ameixa data-[state=open]:bg-areia/70"
              aria-label="Menu da conta"
              data-tour="conta"
            >
              <span className="grid size-9 place-items-center rounded-full bg-ameixa-suave text-xs font-semibold tracking-[0.02em] text-ameixa" aria-hidden="true">
                {label.initials}
              </span>
              <ChevronDown className="hidden size-4 md:block" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 overflow-hidden rounded-[12px] border-linha bg-papel p-0 shadow-[var(--shadow-aceito-2)]" align="end">
            <div className="border-b border-linha px-4 py-3">
              <p className="truncate font-display text-base font-semibold text-tinta">{label.menuTitle}</p>
              <p className="text-sm text-tinta-suave">{label.menuSubtitle}</p>
            </div>
            <div className="space-y-0.5 p-1.5">
              {can("/configuracoes") && (
                <DropdownMenuItem asChild className={menuItem}>
                  <Link href="/configuracoes" className="flex items-center gap-2.5">
                    <SettingsIcon className="h-4 w-4 text-tinta-suave" /> Configurações
                  </Link>
                </DropdownMenuItem>
              )}
              {can("/plano") && (
                <DropdownMenuItem asChild className={menuItem}>
                  <Link href="/plano" className="flex items-center gap-2.5">
                    <CreditCardIcon className="h-4 w-4 text-tinta-suave" /> Plano e pagamentos
                    {planName && <span className="ml-auto text-xs text-tinta-suave">{planName}</span>}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild className={menuItem}>
                <Link href="/conta" className="flex items-center gap-2.5">
                  <UserRound className="h-4 w-4 text-tinta-suave" /> Minha conta
                </Link>
              </DropdownMenuItem>
              <TourMenuItem />
              {isPlatformAdmin && (
                <DropdownMenuItem asChild className={`${menuItem} md:hidden`}>
                  <Link href="/admin" className="flex items-center gap-2.5">
                    <LayoutDashboard className="h-4 w-4 text-tinta-suave" /> Administração
                  </Link>
                </DropdownMenuItem>
              )}
            </div>
            {/* No computador as ferramentas de administração ficam na barra lateral */}
            {adminItems.length > 0 && (
              <div className="md:hidden">
                <DropdownMenuSeparator className="my-0 bg-linha" />
                <div className="space-y-0.5 p-1.5">
                  <DropdownMenuLabel className="text-xs font-medium text-tinta-suave">Gestão da plataforma</DropdownMenuLabel>
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.href} asChild className={menuItem}>
                        <Link href={item.href} className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 text-tinta-suave" /> {item.name}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </div>
            )}
            {/* No computador o seletor fica no botão sol/lua do cabeçalho */}
            <DropdownMenuSeparator className="my-0 bg-linha md:hidden" />
            <div className="p-1.5 md:hidden">
              <ThemeMenuItems />
            </div>
            <DropdownMenuSeparator className="my-0 bg-linha" />
            <div className="p-1.5">
              <DropdownMenuItem
                disabled={leaving}
                aria-busy={leaving || undefined}
                // Fica aberto até a saída terminar, mostrando o andamento
                onSelect={(e) => {
                  e.preventDefault();
                  startLeave(() => logout());
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-perigo focus:bg-perigo-suave focus:text-perigo"
              >
                {leaving ? <Spinner /> : <LogOut className="h-4 w-4" />} Sair
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
