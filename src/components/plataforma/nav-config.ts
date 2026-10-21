import {
  LayoutGrid,
  Heart,
  Store,
  ShieldCheck,
  Wallet,
  Globe,
  Flower2,
  Megaphone,
  LifeBuoy,
  Activity,
  Users,
  ScrollText,
  Settings as SettingsIcon,
  Menu,
  type LucideIcon,
} from "lucide-react";

/**
 * Menu da administração da plataforma (barra lateral, barra inferior e aba "Mais" do celular).
 * Fonte única: o desenho (AdminVisaoGeral) manda na ordem, nos grupos e nos nomes.
 *
 * Contadores: chaves de PlatformNavCounts (lib/platform/nav-counts.ts), sempre reais; zero some do menu.
 *
 * TELAS ANTIGAS: /curadoria, /usuarios, /perfis, /assinaturas e /atividades ainda usam o shell do painel
 * do casal. Aparecem aqui só como destino do menu e serão migradas para /admin/... depois (marcadas com
 * "MIGRAR"); trocar o `href` quando a migração acontecer não exige mexer em mais nada.
 */

export type PlatformCountKey = "curadoria" | "planos" | "dominios" | "suporte" | "saude";

export interface PlatformNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Ícone ilustrado da marca no lugar do lucide (o menu desenha o da Liz em cores próprias). */
  brand?: "liz";
  /** Número à direita do item (só quando maior que zero). */
  countKey?: PlatformCountKey;
  /** Item de segundo nível (recuado), como "Curadoria" sob "Fornecedores". */
  child?: boolean;
  /** Ativo só quando o caminho é exatamente este (a Visão geral, que é o prefixo de todos). */
  exact?: boolean;
  /** Outros caminhos que também deixam o item ativo (telas antigas que pertencem a ele). */
  alsoActiveFor?: string[];
}

export interface PlatformNavGroup {
  /** Sem título: o grupo aparece no topo, sem cabeçalho. */
  title?: string;
  items: PlatformNavItem[];
}

export const PLATFORM_NAV_GROUPS: PlatformNavGroup[] = [
  {
    items: [{ name: "Visão geral", href: "/admin", icon: LayoutGrid, exact: true }],
  },
  {
    title: "Casais e fornecedores",
    items: [
      { name: "Casais", href: "/admin/casais", icon: Heart },
      { name: "Fornecedores", href: "/admin/fornecedores", icon: Store, exact: true },
      // Migrada para o shell /admin (a rota antiga /curadoria só redireciona e fica ativa junto)
      { name: "Curadoria", href: "/admin/fornecedores/curadoria", icon: ShieldCheck, countKey: "curadoria", child: true, alsoActiveFor: ["/curadoria"] },
    ],
  },
  {
    title: "Dinheiro",
    items: [
      // MIGRAR: /assinaturas (Assinaturas e Pix, Cupons) é aba de "Planos e receita" e fica ativa junto
      { name: "Planos e receita", href: "/admin/planos", icon: Wallet, countKey: "planos", alsoActiveFor: ["/assinaturas"] },
      { name: "Domínios", href: "/admin/dominios", icon: Globe, countKey: "dominios", alsoActiveFor: ["/dominios"] },
    ],
  },
  {
    title: "Liz",
    items: [{ name: "Liz", href: "/admin/madrinha", icon: Flower2, brand: "liz" }],
  },
  {
    title: "Comunicação",
    items: [{ name: "Comunicados", href: "/admin/comunicados", icon: Megaphone }],
  },
  {
    title: "Suporte",
    items: [{ name: "Suporte e LGPD", href: "/admin/suporte", icon: LifeBuoy, countKey: "suporte" }],
  },
  {
    title: "Sistema",
    items: [
      { name: "Saúde do sistema", href: "/admin/saude", icon: Activity, countKey: "saude" },
      // Migrado: /usuarios e /perfis viram uma tela só em /admin/usuarios (as antigas redirecionam)
      { name: "Usuários e perfis", href: "/admin/usuarios", icon: Users, alsoActiveFor: ["/usuarios", "/perfis"] },
      // Migrado: /atividades agora é /admin/atividades (a antiga redireciona)
      { name: "Registro de atividades", href: "/admin/atividades", icon: ScrollText, alsoActiveFor: ["/atividades"] },
      { name: "Configurações da plataforma", href: "/admin/configuracoes", icon: SettingsIcon },
    ],
  },
];

/** Todas as telas antigas que o menu aponta, para o teste conferir que continuam existindo. */
export const LEGACY_ADMIN_HREFS = ["/curadoria", "/usuarios", "/perfis", "/assinaturas", "/atividades", "/dominios"] as const;

/** Barra inferior no celular: as quatro áreas mais usadas + "Mais" (abre todas as outras). */
export const PLATFORM_MOBILE_TABS: { name: string; href: string; icon: LucideIcon; exact?: boolean }[] = [
  { name: "Visão geral", href: "/admin", icon: LayoutGrid, exact: true },
  { name: "Casais", href: "/admin/casais", icon: Heart },
  { name: "Fornecedores", href: "/admin/fornecedores", icon: Store },
  { name: "Planos", href: "/admin/planos", icon: Wallet },
];

export const PLATFORM_MORE_ICON = Menu;

/** O item (ou aba) está ativo para este caminho? Compara por segmento: "/admin/casais" não liga "/admin/casaisx". */
export function isPlatformItemActive(pathname: string, item: { href: string; exact?: boolean; alsoActiveFor?: string[] }): boolean {
  const matches = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
  if (item.exact) return pathname === item.href;
  return matches(item.href) || (item.alsoActiveFor ?? []).some(matches);
}

/** Aba "Mais": os itens que não estão na barra inferior, nos mesmos grupos do menu. */
export function platformMoreGroups(): PlatformNavGroup[] {
  const inTabs = new Set(PLATFORM_MOBILE_TABS.map((t) => t.href));
  return PLATFORM_NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => !inTabs.has(item.href)) })).filter(
    (group) => group.items.length > 0,
  );
}

/** Texto lido por leitores de tela depois do número do item. */
export const PLATFORM_COUNT_HINT: Record<PlatformCountKey, string> = {
  curadoria: "esperando a curadoria",
  planos: "para resolver",
  dominios: "esperando você",
  suporte: "em aberto",
  saude: "pedem atenção",
};
