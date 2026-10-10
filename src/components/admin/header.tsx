"use client";

import Link from "next/link";
import {
  Settings as SettingsIcon,
  Shield,
  KeyRound,
  LogOut,
  CreditCard as CreditCardIcon,
  UserRound,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/auth-actions";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { hasPathAccess } from "@/lib/permissions";
import { Logo } from "@/components/brand/logo";

interface HeaderProps {
  role?: string;
  allowedPaths?: string[];
  coupleNames: string;
  initials: string;
  dateLabel?: string | null;
  /** Avisos não lidos, já contados no servidor. */
  unreadNotifications?: number;
  pushPublicKey?: string | null;
}

export function Header({ role = "Admin", allowedPaths = [], coupleNames, initials, dateLabel, unreadNotifications = 0, pushPublicKey = null }: HeaderProps) {
  const can = (path: string) => hasPathAccess(allowedPaths, path);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-linha bg-linho/85 px-4 backdrop-blur-md md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/dashboard" aria-label="Aceito, início do painel" className="md:hidden">
          <Logo variant="mark" height={28} />
        </Link>
        <p className="min-w-0 truncate">
          <span className="font-display text-lg text-tinta md:text-xl">{coupleNames}</span>
          {dateLabel && <span className="hidden text-sm text-tinta-suave md:inline"> · {dateLabel}</span>}
        </p>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <NotificationBell initialUnread={unreadNotifications} allHref="/notificacoes" settingsHref="/conta#avisos" pushPublicKey={pushPublicKey} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-linha bg-ameixa-suave font-display text-base text-ameixa transition-shadow hover:shadow-[0_0_0_3px_var(--color-ameixa-suave)]"
              aria-label="Menu da conta"
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 overflow-hidden rounded-2xl border-linha bg-papel p-0 font-sans shadow-[var(--shadow-aceito-2)]" align="end">
            <div className="border-b border-linha px-4 py-3">
              <p className="font-display text-lg text-tinta">{coupleNames}</p>
              <p className="text-sm text-tinta-suave">{role}</p>
            </div>
            <div className="space-y-0.5 p-1.5">
              <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-tinta">
                <Link href="/conta" className="flex items-center gap-2.5">
                  <UserRound className="h-4 w-4 text-tinta-suave" /> Minha conta
                </Link>
              </DropdownMenuItem>
              {can("/carteira") && (
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-tinta">
                  <Link href="/carteira" className="flex items-center gap-2.5">
                    <CreditCardIcon className="h-4 w-4 text-tinta-suave" /> Carteira
                  </Link>
                </DropdownMenuItem>
              )}
              {can("/configuracoes") && (
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-tinta">
                  <Link href="/configuracoes" className="flex items-center gap-2.5">
                    <SettingsIcon className="h-4 w-4 text-tinta-suave" /> Configurações
                  </Link>
                </DropdownMenuItem>
              )}
              {can("/usuarios") && (
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-tinta">
                  <Link href="/usuarios" className="flex items-center gap-2.5">
                    <KeyRound className="h-4 w-4 text-tinta-suave" /> Usuários
                  </Link>
                </DropdownMenuItem>
              )}
              {can("/perfis") && (
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-tinta">
                  <Link href="/perfis" className="flex items-center gap-2.5">
                    <Shield className="h-4 w-4 text-tinta-suave" /> Perfis de acesso
                  </Link>
                </DropdownMenuItem>
              )}
            </div>
            <DropdownMenuSeparator className="my-0 bg-linha" />
            <div className="p-1.5">
              <DropdownMenuItem
                onClick={() => logout()}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-perigo focus:bg-perigo-suave focus:text-perigo"
              >
                <LogOut className="h-4 w-4" /> Sair
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
