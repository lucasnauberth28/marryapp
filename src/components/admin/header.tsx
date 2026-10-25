"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { SinoDeNotificacoes } from "@/components/notifications/notification-bell";
import { ehAcessoDeAdminDaPlataforma } from "@/lib/permissions";
import { Logotipo } from "@/components/brand/logo";
import { rotuloDaConta } from "@/lib/account-label";
import { AlternadorDeTema } from "@/components/theme/theme-toggle";
import { MenuDaConta } from "./cabecalho/menu-da-conta";

interface PropriedadesDoCabecalho {
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

/**
 * Cabeçalho da folha: quem é o casal e quando é o casamento à esquerda; tema, avisos e menu da conta à direita,
 * sempre no mesmo lugar. Configurações, plano, conta e sair moram no menu da conta (saíram do menu principal).
 */
export function Cabecalho({ role = "Admin", allowedPaths = [], coupleNames, initials, subtitle, adminView = false, userName = null, planName = null, unreadNotifications = 0, pushPublicKey = null }: PropriedadesDoCabecalho) {
  const label = rotuloDaConta({ adminView, coupleNames, coupleInitials: initials, userName, role });
  // Só a conta com acesso total ("*") vê o caminho de volta para a administração da plataforma
  const isPlatformAdmin = ehAcessoDeAdminDaPlataforma(allowedPaths);

  return (
    <header className="sticky top-[var(--faixa)] z-40 flex min-h-[60px] items-center justify-between gap-3 border-b border-linha bg-papel/95 px-4 backdrop-blur-md md:min-h-16 md:rounded-t-2xl md:pl-8 md:pr-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/dashboard" aria-label="Aceito, Resumo do casamento" className="shrink-0 md:hidden">
          <Logotipo variant="mark" height={30} />
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
        <AlternadorDeTema />
        <SinoDeNotificacoes initialUnread={unreadNotifications} allHref="/notificacoes" settingsHref="/conta#avisos" pushPublicKey={pushPublicKey} />
        <MenuDaConta allowedPaths={allowedPaths} isPlatformAdmin={isPlatformAdmin} planName={planName} label={label} />
      </div>
    </header>
  );
}
