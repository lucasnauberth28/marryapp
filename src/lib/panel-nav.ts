// Estrutura do menu do painel do casal: 5 áreas, cada uma com as telas que já existem.
// Puro (sem React nem Next): o menu, a barra de baixo, as abas da área e o passo a passo usam a mesma fonte.
// Os ícones ficam em components/admin/nav-config.ts (aqui só a chave), para os testes rodarem sem o React.
import { hasPathAccess } from "./permissions.ts";

/** Contadores reais que uma tela pode mostrar ao lado do nome (ver lib/nav-counts). */
export type NavCountKey = "guests" | "messages" | "tasks" | "domains";

export type AreaId = "resumo" | "convidados" | "site" | "presentes" | "organizacao";

export interface PanelScreen {
  name: string;
  href: string;
  /** Chave do ícone (components/admin/nav-config.ts). */
  icon: string;
  countKey?: NavCountKey;
}

export interface PanelArea {
  id: AreaId;
  /** Nome no menu lateral e no passo a passo. */
  name: string;
  /** Nome na barra de baixo do celular (cabe em uma coluna de 1/5 da tela). */
  shortName: string;
  icon: string;
  /** Telas da área; a primeira que a pessoa pode abrir é para onde o item do menu leva. */
  screens: PanelScreen[];
}

export const PANEL_AREAS: PanelArea[] = [
  {
    id: "resumo",
    name: "Resumo",
    shortName: "Resumo",
    icon: "resumo",
    screens: [{ name: "Resumo", href: "/dashboard", icon: "resumo" }],
  },
  {
    id: "convidados",
    name: "Convidados",
    shortName: "Convidados",
    icon: "convidados",
    screens: [
      { name: "Lista de convidados", href: "/convidados", icon: "convidados", countKey: "guests" },
      { name: "Mensagens", href: "/mensagens", icon: "mensagens", countKey: "messages" },
      { name: "Mesas", href: "/mesas", icon: "mesas" },
      { name: "Registro de entrada", href: "/credenciamento", icon: "entrada" },
    ],
  },
  {
    id: "site",
    name: "Site e convite",
    shortName: "Site",
    icon: "site",
    screens: [
      { name: "Editar o site", href: "/site-builder", icon: "editar-site" },
      { name: "Endereço personalizado", href: "/dominio", icon: "endereco" },
    ],
  },
  {
    id: "presentes",
    name: "Presentes e dinheiro",
    shortName: "Presentes",
    icon: "presentes",
    screens: [
      { name: "Presentes em dinheiro", href: "/presentes-admin", icon: "presentes" },
      // A tela é de Configurações; aparece aqui como atalho para quem pode abri-la.
      { name: "Onde receber", href: "/configuracoes/recebimento", icon: "receber" },
    ],
  },
  {
    id: "organizacao",
    name: "Organização",
    shortName: "Organização",
    icon: "organizacao",
    screens: [
      { name: "Tarefas", href: "/pendencias", icon: "tarefas", countKey: "tasks" },
      { name: "Cronograma do dia", href: "/cronograma", icon: "cronograma" },
      { name: "Despesas", href: "/financas", icon: "despesas" },
      { name: "Meus fornecedores", href: "/meus-fornecedores", icon: "meus-fornecedores" },
      { name: "Encontrar fornecedores", href: "/fornecedores", icon: "encontrar" },
    ],
  },
];

/** Telas do menu da conta (avatar): saem do menu principal. */
export const ACCOUNT_SCREENS = [
  { name: "Configurações", href: "/configuracoes" },
  { name: "Plano e pagamentos", href: "/plano" },
] as const;

/** Área já filtrada pelo perfil: só as telas que a pessoa abre; `href` é a primeira delas. */
export interface VisibleArea extends Omit<PanelArea, "screens"> {
  href: string;
  screens: PanelScreen[];
}

/** Áreas que o perfil vê: telas sem permissão somem, e a área sem nenhuma tela some. */
export function visibleAreas(allowedPaths: readonly string[]): VisibleArea[] {
  const paths = [...allowedPaths];
  const out: VisibleArea[] = [];
  for (const area of PANEL_AREAS) {
    const screens = area.screens.filter((s) => hasPathAccess(paths, s.href));
    if (screens.length > 0) out.push({ ...area, screens, href: screens[0].href });
  }
  return out;
}

/** Caminho dentro da tela? Compara por segmento ("/dominio" não casa com "/dominios"). */
export function isScreenActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Área a que o caminho pertence, entre as visíveis; null nas telas fora do menu (Configurações, Plano, Minha conta). */
export function areaOfPath<A extends { screens: readonly { href: string }[] }>(areas: readonly A[], pathname: string): A | null {
  // A tela mais específica ganha ("/configuracoes/recebimento" é de Presentes, "/configuracoes" não é de nenhuma área)
  let best: { area: A; length: number } | null = null;
  for (const area of areas) {
    for (const screen of area.screens) {
      if (isScreenActive(pathname, screen.href) && (!best || screen.href.length > best.length)) best = { area, length: screen.href.length };
    }
  }
  return best?.area ?? null;
}

/** Nome curto do plano para o menu: sem plano pago é o Básico; o personalizado é "Adaptado". */
export function planShortName(planId: string | null): string {
  if (planId === "classic") return "Classic";
  if (planId === "vip") return "VIP";
  if (planId === "custom") return "Adaptado";
  return "Básico";
}
