import {
  LayoutDashboard,
  Users as UsersIcon,
  Armchair,
  ScanLine,
  ListChecks,
  CalendarClock,
  Store,
  Compass,
  Receipt,
  Wallet,
  Gift as GiftIcon,
  LayoutTemplate,
  MessageCircle,
  Settings as SettingsIcon,
  ShieldCheck,
  KeyRound,
  UserCog,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { hasPathAccess } from "@/lib/permissions";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  /** Sem título: o grupo aparece no topo, sem cabeçalho. */
  title?: string;
  items: NavItem[];
}

// Fonte única do menu do painel do casal (barra lateral, aba "Mais" e barra inferior).
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ name: "Início", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Convidados",
    items: [
      { name: "Lista de convidados", href: "/convidados", icon: UsersIcon },
      { name: "Mensagens", href: "/mensagens", icon: MessageCircle },
      { name: "Mesas", href: "/mesas", icon: Armchair },
      { name: "Check-in no dia", href: "/credenciamento", icon: ScanLine },
    ],
  },
  {
    title: "Organização",
    items: [
      { name: "Tarefas", href: "/pendencias", icon: ListChecks },
      { name: "Cronograma do dia", href: "/cronograma", icon: CalendarClock },
      { name: "Meus fornecedores", href: "/meus-fornecedores", icon: Store },
      { name: "Encontrar fornecedores", href: "/fornecedores", icon: Compass },
      { name: "Finanças", href: "/financas", icon: Receipt },
      { name: "Carteira", href: "/carteira", icon: Wallet },
    ],
  },
  {
    title: "Site e presentes",
    items: [
      { name: "Editar o site", href: "/site-builder", icon: LayoutTemplate },
      { name: "Presentes", href: "/presentes-admin", icon: GiftIcon },
    ],
  },
  {
    title: "Conta",
    items: [{ name: "Configurações", href: "/configuracoes", icon: SettingsIcon }],
  },
  {
    title: "Administração",
    items: [
      { name: "Curadoria", href: "/curadoria", icon: ShieldCheck },
      { name: "Usuários", href: "/usuarios", icon: KeyRound },
      { name: "Perfis de acesso", href: "/perfis", icon: UserCog },
    ],
  },
];

/** Barra inferior no celular: as quatro áreas mais usadas + "Mais" (abre todas as áreas). */
export const MOBILE_TABS: NavItem[] = [
  { name: "Início", href: "/dashboard", icon: LayoutDashboard },
  { name: "Convidados", href: "/convidados", icon: UsersIcon },
  { name: "Presentes", href: "/presentes-admin", icon: GiftIcon },
  { name: "Site", href: "/site-builder", icon: LayoutTemplate },
];

export const MORE_TAB_ICON = Menu;

/**
 * Grupos visíveis para o perfil: itens sem permissão somem, e grupos vazios também.
 */
export function visibleNavGroups(allowedPaths: string[]): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPathAccess(allowedPaths, item.href)),
  })).filter((group) => group.items.length > 0);
}

export function visibleMobileTabs(allowedPaths: string[]): NavItem[] {
  return MOBILE_TABS.filter((item) => hasPathAccess(allowedPaths, item.href));
}

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
