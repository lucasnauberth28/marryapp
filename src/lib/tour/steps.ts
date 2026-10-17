// Passos do passo a passo do painel do casal. Puro (sem banco nem Next): a ordem, o texto e quem vê cada passo.
import { hasPathAccess } from "../permissions.ts";

/** Módulos de plano que fecham uma tela inteira (o resto do painel abre para todos os planos). */
export type TourModule = "whatsapp" | "qrcode" | "customDomain";

interface StepDef {
  id: string;
  /** Versão do passo a passo em que o passo nasceu. */
  since: number;
  /**
   * Áreas do menu onde o passo se ancora, em ordem de preferência: vale a primeira que o perfil abre.
   * Nome do item no menu = `data-tour="nav-<caminho sem a barra>"` (ver nav-config).
   */
  targets: readonly string[];
  /** Tela que o plano precisa incluir; sem o módulo o passo não aparece. */
  needs?: TourModule;
  /** Âncora que não é do menu (botão flutuante da Liz): sem ela na tela, o passo some. */
  floating?: string;
  title: string;
  /** O que se faz ali. Pode variar conforme as áreas que o perfil abre. */
  what: string | ((opens: (href: string) => boolean) => string);
  /** Texto do botão que leva à tela (recebe a área escolhida); sem ele o passo só explica. */
  cta?: string | ((href: string) => string);
  /** Onde clicar, para âncoras que não são do menu. */
  where?: string;
}

const DEFS: readonly StepDef[] = [
  {
    id: "resumo",
    since: 1,
    targets: ["/dashboard"],
    title: "Resumo do casamento",
    what: "Vocês veem num só lugar as confirmações de presença, os presentes recebidos, o orçamento e as próximas tarefas.",
    cta: "Ir para o Resumo",
  },
  {
    id: "convidados",
    since: 1,
    targets: ["/convidados"],
    title: "Convidados",
    what: "Adicionem convidados um a um ou importem uma planilha. Depois acompanhem quem confirmou presença e quem ainda não respondeu.",
    cta: "Ir para Convidados",
  },
  {
    id: "site",
    since: 1,
    targets: ["/site-builder"],
    title: "Site do casamento",
    what: "Editem as informações, as fotos e a história de vocês. Ao publicar, o aviso mostra o endereço do site para compartilhar com os convidados.",
    cta: "Ir para o editor do site",
  },
  {
    id: "presentes",
    since: 1,
    targets: ["/presentes-admin"],
    title: "Presentes em dinheiro",
    what: "Criem presentes com valores em reais. O convidado escolhe um e paga por Pix ou cartão. Nenhum produto é entregue: o presente é o valor. Aqui vocês acompanham o que já chegou.",
    cta: "Ir para Presentes",
  },
  {
    id: "mensagens",
    since: 1,
    targets: ["/mensagens"],
    needs: "whatsapp",
    title: "Mensagens",
    what: "Escrevam os modelos de convite e de lembrete e enviem pelo WhatsApp para os convidados.",
    cta: "Ir para Mensagens",
  },
  {
    id: "mesas",
    since: 1,
    targets: ["/mesas"],
    title: "Mesas",
    what: "Organizem onde cada convidado vai sentar, mesa por mesa.",
    cta: "Ir para Mesas",
  },
  {
    id: "financas",
    since: 1,
    targets: ["/financas"],
    title: "Finanças",
    what: "Anotem as despesas para saber quanto já foi pago e quanto falta. Os Pix de presente que esperam conferência também são confirmados aqui.",
    cta: "Ir para Finanças",
  },
  {
    id: "fornecedores",
    since: 1,
    targets: ["/fornecedores", "/meus-fornecedores"],
    title: "Fornecedores",
    what: (opens) => {
      const find = opens("/fornecedores");
      const mine = opens("/meus-fornecedores");
      if (find && mine) return "Em Encontrar fornecedores, vocês procuram profissionais e pedem orçamento. Em Meus fornecedores, registram quem já contrataram.";
      if (find) return "Procurem profissionais para o casamento, conheçam o trabalho de cada um e peçam orçamento.";
      return "Registrem aqui quem vocês já contrataram.";
    },
    cta: (href) => (href === "/fornecedores" ? "Ir para Encontrar fornecedores" : "Ir para Meus fornecedores"),
  },
  {
    id: "configuracoes",
    since: 1,
    targets: ["/configuracoes"],
    title: "Configurações",
    what: "Definam o prazo para os convidados confirmarem presença. Daqui também dá para rever este passo a passo quando quiserem.",
    cta: "Ir para Configurações",
  },
  {
    id: "liz",
    since: 1,
    targets: ["/dashboard"],
    floating: "liz",
    title: "Liz",
    what: "A Liz usa as informações do painel para sugerir o que merece atenção, como convidados sem resposta. Vocês escolhem o que fazer.",
    where: "Fica no botão da Liz, no canto da tela.",
  },
];

/** Passo pronto para a pessoa: já filtrado pelo perfil e pelo plano. */
export interface TourStep {
  id: string;
  since: number;
  title: string;
  what: string;
  /** Área do menu em que ele aponta (caminho), ou null quando aponta para um botão flutuante. */
  href: string | null;
  /** Valor de `data-tour` do elemento âncora. */
  anchor: string;
  /** Âncora que pode não existir na tela (some do passo a passo se não existir). */
  floating: boolean;
  cta: string | null;
  /** Onde clicar, para âncoras fora do menu. */
  where: string | null;
}

/** `data-tour` de um item do menu: "/site-builder" vira "nav-site-builder". */
export function navAnchor(href: string): string {
  return `nav-${href.replace(/^\//, "").replace(/\//g, "-")}`;
}

/**
 * Passos que esta pessoa vê. Cada passo respeita as MESMAS permissões do menu (hasPathAccess sobre os
 * caminhos do perfil) e os módulos do plano: o passo a passo nunca explica o que a pessoa não pode abrir.
 */
export function buildTourSteps(opts: { allowedPaths: readonly string[]; modules: readonly string[] }): TourStep[] {
  const paths = [...opts.allowedPaths];
  const opens = (href: string) => hasPathAccess(paths, href);
  const steps: TourStep[] = [];
  for (const def of DEFS) {
    if (def.needs && !opts.modules.includes(def.needs)) continue;
    const href = def.targets.find(opens);
    if (!href) continue;
    const text = typeof def.what === "function" ? def.what(opens) : def.what;
    steps.push({
      id: def.id,
      since: def.since,
      title: def.title,
      what: text,
      href: def.floating ? null : href,
      anchor: def.floating ?? navAnchor(href),
      floating: Boolean(def.floating),
      cta: def.cta && !def.floating ? (typeof def.cta === "function" ? def.cta(href) : def.cta) : null,
      where: def.where ?? null,
    });
  }
  return steps;
}

/** Nome da área no menu, para dizer onde clicar. */
export interface StepPlace {
  /** Nome do item no menu lateral ("Lista de convidados"). */
  menuLabel: string;
  /** Nome na barra de baixo do celular, quando o item está nela ("Convidados"); null = fica em "Mais". */
  tabLabel: string | null;
}

/** Onde clicar, no computador ou no celular, com os nomes reais do menu. */
export function whereText(step: Pick<TourStep, "where">, place: StepPlace | null, device: "desktop" | "mobile"): string {
  if (step.where) return step.where;
  if (!place) return "";
  if (device === "desktop") return `No menu ao lado, clique em “${place.menuLabel}”.`;
  if (place.tabLabel) return `Na barra de baixo, toque em “${place.tabLabel}”.`;
  return `Toque em “Mais” e depois em “${place.menuLabel}”.`;
}
