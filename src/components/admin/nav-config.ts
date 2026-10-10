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
  CreditCard,
  BadgeDollarSign,
  Gift as GiftIcon,
  LayoutTemplate,
  MessageCircle,
  Settings as SettingsIcon,
  ShieldCheck,
  KeyRound,
  UserCog,
  ScrollText,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { hasPathAccess } from "@/lib/permissions";

/** Contadores reais que o menu pode mostrar ao lado do item (ver lib/nav-counts). */
export type NavCountKey = "guests" | "messages" | "tasks";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Número exibido à direita (só quando maior que zero). */
  countKey?: NavCountKey;
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
      { name: "Lista de convidados", href: "/convidados", icon: UsersIcon, countKey: "guests" },
      { name: "Mensagens", href: "/mensagens", icon: MessageCircle, countKey: "messages" },
      { name: "Mesas", href: "/mesas", icon: Armchair },
      { name: "Check-in no dia", href: "/credenciamento", icon: ScanLine },
    ],
  },
  {
    title: "Organização",
    items: [
      { name: "Tarefas", href: "/pendencias", icon: ListChecks, countKey: "tasks" },
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
    items: [
      { name: "Configurações", href: "/configuracoes", icon: SettingsIcon },
      { name: "Plano e pagamentos", href: "/plano", icon: CreditCard },
    ],
  },
  {
    title: "Administração",
    items: [
      { name: "Curadoria", href: "/curadoria", icon: ShieldCheck },
      { name: "Assinaturas", href: "/assinaturas", icon: BadgeDollarSign },
      { name: "Usuários", href: "/usuarios", icon: KeyRound },
      { name: "Perfis de acesso", href: "/perfis", icon: UserCog },
      // Só quem tem acesso total ("*") entra: a página confere de novo no servidor.
      { name: "Registro de atividades", href: "/atividades", icon: ScrollText },
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

/** Aba "Mais": as áreas que não estão na barra inferior (como no design). */
export function visibleMoreGroups(allowedPaths: string[]): NavGroup[] {
  const inTabs = new Set(MOBILE_TABS.map((t) => t.href));
  return visibleNavGroups(allowedPaths)
    .map((group) => ({ ...group, items: group.items.filter((item) => !inTabs.has(item.href)) }))
    .filter((group) => group.items.length > 0);
}

export function visibleMobileTabs(allowedPaths: string[]): NavItem[] {
  return MOBILE_TABS.filter((item) => hasPathAccess(allowedPaths, item.href));
}

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
