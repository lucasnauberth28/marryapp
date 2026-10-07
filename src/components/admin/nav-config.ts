import {
  LayoutDashboard,
  Users as UsersIcon,
  LayoutGrid,
  QrCode,
  CheckSquare,
  Calendar,
  Briefcase,
  Compass,
  Wallet,
  Gift as GiftIcon,
  CreditCard,
  Sliders,
  MessageSquare,
  Settings as SettingsIcon,
  Shield,
  KeyRound,
  UserCog,
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

// Fonte única do menu do painel (desktop e celular).
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ name: "Início", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Convidados",
    items: [
      { name: "Lista de convidados", href: "/convidados", icon: UsersIcon },
      { name: "Mesas", href: "/mesas", icon: LayoutGrid },
      { name: "Check-in no dia", href: "/credenciamento", icon: QrCode },
    ],
  },
  {
    title: "Planejamento",
    items: [
      { name: "Tarefas", href: "/pendencias", icon: CheckSquare },
      { name: "Cronograma do dia", href: "/cronograma", icon: Calendar },
      { name: "Meus fornecedores", href: "/meus-fornecedores", icon: Briefcase },
      { name: "Encontrar fornecedores", href: "/fornecedores", icon: Compass },
    ],
  },
  {
    title: "Dinheiro",
    items: [
      { name: "Finanças", href: "/financas", icon: Wallet },
      { name: "Presentes", href: "/presentes-admin", icon: GiftIcon },
      { name: "Carteira", href: "/carteira", icon: CreditCard },
    ],
  },
  {
    title: "Site e convites",
    items: [
      { name: "Site do casal", href: "/site-builder", icon: Sliders },
      { name: "Mensagens", href: "/mensagens", icon: MessageSquare },
    ],
  },
  {
    title: "Conta",
    items: [{ name: "Configurações", href: "/configuracoes", icon: SettingsIcon }],
  },
  {
    title: "Administração",
    items: [
      { name: "Curadoria", href: "/curadoria", icon: Shield },
      { name: "Usuários", href: "/usuarios", icon: KeyRound },
      { name: "Perfis de acesso", href: "/perfis", icon: UserCog },
    ],
  },
];

/**
 * Grupos visíveis para o perfil: itens sem permissão somem, e grupos vazios também.
 */
export function visibleNavGroups(allowedPaths: string[]): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPathAccess(allowedPaths, item.href)),
  })).filter((group) => group.items.length > 0);
}

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
