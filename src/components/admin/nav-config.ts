import {
  Armchair,
  BadgeDollarSign,
  CalendarClock,
  Compass,
  Gift as GiftIcon,
  Globe,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  Link2,
  ListChecks,
  MessageCircle,
  Receipt,
  ScanLine,
  ScrollText,
  ShieldCheck,
  Store,
  UserCog,
  Users as UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { hasPathAccess } from "@/lib/permissions";
import { isScreenActive, type NavCountKey } from "@/lib/panel-nav";

export type { NavCountKey };
export { PANEL_AREAS, visibleAreas, areaOfPath, ACCOUNT_SCREENS } from "@/lib/panel-nav";

/** Ícone de cada área e tela (a estrutura e os nomes ficam em lib/panel-nav). */
const ICONS: Record<string, LucideIcon> = {
  resumo: LayoutDashboard,
  convidados: UsersIcon,
  mensagens: MessageCircle,
  mesas: Armchair,
  entrada: ScanLine,
  site: Globe,
  "editar-site": LayoutTemplate,
  endereco: Link2,
  presentes: GiftIcon,
  receber: Landmark,
  organizacao: ListChecks,
  tarefas: ListChecks,
  cronograma: CalendarClock,
  despesas: Receipt,
  "meus-fornecedores": Store,
  encontrar: Compass,
};

export function navIcon(key: string): LucideIcon {
  return ICONS[key] ?? LayoutDashboard;
}

export interface AdminNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  countKey?: NavCountKey;
}

// Ferramentas de administração que moram no painel (só aparecem para quem tem a permissão): a mesma lista de antes,
// agora fora do menu principal. A barra lateral da administração da plataforma (/admin) é outra e não mudou.
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { name: "Curadoria", href: "/curadoria", icon: ShieldCheck },
  { name: "Assinaturas", href: "/assinaturas", icon: BadgeDollarSign },
  // Só quem tem acesso total ("*") entra: a página confere de novo no servidor.
  { name: "Domínios", href: "/dominios", icon: Link2, countKey: "domains" },
  { name: "Usuários", href: "/usuarios", icon: KeyRound },
  { name: "Perfis de acesso", href: "/perfis", icon: UserCog },
  // Só quem tem acesso total ("*") entra: a página confere de novo no servidor.
  { name: "Registro de atividades", href: "/atividades", icon: ScrollText },
];

export function visibleAdminItems(allowedPaths: readonly string[]): AdminNavItem[] {
  const paths = [...allowedPaths];
  return ADMIN_NAV_ITEMS.filter((item) => hasPathAccess(paths, item.href));
}

export function isNavItemActive(pathname: string, href: string) {
  return isScreenActive(pathname, href);
}
