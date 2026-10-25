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
import { temAcessoAoCaminho } from "@/lib/permissions";
import { telaEstaAtiva, type ChaveDeContagemDoMenu } from "@/lib/painel/panel-nav";

export type { ChaveDeContagemDoMenu };
export { AREAS_DO_PAINEL, areasVisiveis, areaDoCaminho, TELAS_DA_CONTA } from "@/lib/painel/panel-nav";

/** Ícone de cada área e tela (a estrutura e os nomes ficam em lib/panel-nav). */
const ICONES_DO_MENU: Record<string, LucideIcon> = {
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

export function iconeDoMenu(key: string): LucideIcon {
  return ICONES_DO_MENU[key] ?? LayoutDashboard;
}

export interface ItemDoMenuDoAdmin {
  name: string;
  href: string;
  icon: LucideIcon;
  countKey?: ChaveDeContagemDoMenu;
}

// Ferramentas de administração que moram no painel (só aparecem para quem tem a permissão): a mesma lista de antes,
// agora fora do menu principal. A barra lateral da administração da plataforma (/admin) é outra e não mudou.
const ITENS_DO_MENU_DO_ADMIN: ItemDoMenuDoAdmin[] = [
  { name: "Curadoria", href: "/curadoria", icon: ShieldCheck },
  { name: "Assinaturas", href: "/assinaturas", icon: BadgeDollarSign },
  // Só quem tem acesso total ("*") entra: a página confere de novo no servidor.
  { name: "Domínios", href: "/dominios", icon: Link2, countKey: "domains" },
  { name: "Usuários", href: "/usuarios", icon: KeyRound },
  { name: "Perfis de acesso", href: "/perfis", icon: UserCog },
  // Só quem tem acesso total ("*") entra: a página confere de novo no servidor.
  { name: "Registro de atividades", href: "/atividades", icon: ScrollText },
];

export function itensVisiveisDoAdmin(allowedPaths: readonly string[]): ItemDoMenuDoAdmin[] {
  const paths = [...allowedPaths];
  return ITENS_DO_MENU_DO_ADMIN.filter((item) => temAcessoAoCaminho(paths, item.href));
}

export function itemDoMenuEstaAtivo(pathname: string, href: string) {
  return telaEstaAtiva(pathname, href);
}
