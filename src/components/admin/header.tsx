"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  Users as UsersIcon,
  Wallet,
  Settings as SettingsIcon,
  Shield,
  KeyRound,
  LogOut,
  Calendar,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  RefreshCw,
  CreditCard as CreditCardIcon,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/auth-actions";
import { getSystemNotifications, SystemNotification } from "@/actions/notification-actions";
import { hasPathAccess } from "@/lib/permissions";
import { Logo } from "@/components/brand/logo";

interface HeaderProps {
  role?: string;
  allowedPaths?: string[];
  coupleNames: string;
  initials: string;
  dateLabel?: string | null;
}

const TONE: Record<SystemNotification["type"], string> = {
  alert: "bg-perigo-suave text-perigo",
  warning: "bg-aviso-suave text-aviso",
  info: "bg-ameixa-suave text-ameixa",
  success: "bg-sucesso-suave text-sucesso",
};

export function Header({ role = "Admin", allowedPaths = [], coupleNames, initials, dateLabel }: HeaderProps) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const loadNotifications = () => {
    startTransition(async () => {
      const res = await getSystemNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    });
  };

  useEffect(() => {
    loadNotifications();
  }, []);

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
        <DropdownMenu onOpenChange={(open) => open && loadNotifications()}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-11 w-11 cursor-pointer rounded-xl text-tinta-suave hover:bg-areia/70 hover:text-ameixa"
              aria-label={unreadCount > 0 ? `Avisos (${unreadCount} novos)` : "Avisos"}
            >
              <Bell className="h-5 w-5" strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full border-2 border-linho bg-perigo px-1 text-[10px] font-bold text-on-ameixa">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[calc(100vw-32px)] max-w-96 overflow-hidden rounded-2xl border-linha bg-papel p-0 font-sans shadow-[var(--shadow-aceito-2)]" align="end">
            <div className="flex items-center justify-between border-b border-linha px-4 py-3">
              <p className="text-sm font-semibold text-tinta">Avisos</p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-tinta-suave"
                  onClick={loadNotifications}
                  aria-label="Atualizar avisos"
                >
                  <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                </Button>
                {unreadCount > 0 && (
                  <button onClick={() => setUnreadCount(0)} className="cursor-pointer px-2 text-sm font-semibold text-ameixa hover:underline">
                    Marcar como lidos
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 divide-y divide-linha overflow-y-auto" data-lenis-prevent>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-tinta-suave">
                  <CheckCircle2 className="h-6 w-6 text-sucesso" />
                  <span>Nada pendente por aqui.</span>
                </div>
              ) : (
                notifications.map((n) => (
                  <Link key={n.id} href={n.linkHref} className="group flex items-start gap-3 p-3.5 transition-colors hover:bg-linho">
                    <div className={`mt-0.5 shrink-0 rounded-xl p-2 ${TONE[n.type] ?? TONE.info}`}>
                      {n.category === "finance" && <Wallet className="h-4 w-4" />}
                      {n.category === "expense" && <Calendar className="h-4 w-4" />}
                      {n.category === "guest" && <UsersIcon className="h-4 w-4" />}
                      {n.category === "whatsapp" && <MessageCircle className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-tinta group-hover:text-ameixa">{n.title}</p>
                      <p className="line-clamp-2 text-sm text-tinta-suave">{n.description}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-tinta-suave transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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
