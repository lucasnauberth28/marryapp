// Passos do passo a passo do painel do casal. Puro (sem banco nem Next): a ordem, o texto e quem vê cada passo.
import { temAcessoAoCaminho } from "../permissions.ts";
import { AREAS_DO_PAINEL, type IdDaArea } from "../panel-nav.ts";

/** Módulos de plano que fecham uma tela inteira (o resto do painel abre para todos os planos). */
export type ModuloDoTour = "whatsapp" | "qrcode" | "customDomain";

interface DefinicaoDoPasso {
  id: string;
  /** Versão do passo a passo em que o passo nasceu. */
  since: number;
  /**
   * Telas da área do menu onde o passo se ancora, em ordem de preferência: vale a primeira que o perfil abre
   * (é também para onde o item da área leva, ver lib/panel-nav). Âncora = `data-tour="nav-<caminho sem a barra>"`.
   */
  targets: readonly string[];
  /** Tela que o plano precisa incluir; sem o módulo o passo não aparece. */
  needs?: ModuloDoTour;
  /** Âncora que não é do menu (botão flutuante da Liz): sem ela na tela, o passo some. */
  floating?: string;
  /** Âncora própria que não é item do menu (o botão do menu da conta). */
  anchor?: string;
  title: string;
  /** O que se faz ali. Pode variar conforme as áreas que o perfil abre e os módulos do plano. */
  what: string | ((opens: (href: string) => boolean, has: (module: ModuloDoTour) => boolean) => string);
  /** Texto do botão que leva à tela (recebe a área escolhida); sem ele o passo só explica. */
  cta?: string | ((href: string) => string);
  /** Onde clicar, para âncoras que não são do menu. */
  where?: string;
}

/** Telas de cada área, na mesma ordem do menu (lib/panel-nav). */
const telasDe = (id: IdDaArea) => AREAS_DO_PAINEL.find((a) => a.id === id)!.screens.map((s) => s.href);

const DEFINICOES: readonly DefinicaoDoPasso[] = [
  {
    id: "resumo",
    since: 2,
    targets: telasDe("resumo"),
    title: "Resumo do casamento",
    what: "Vocês veem num só lugar o convite para mandar aos convidados, as confirmações de presença, os presentes recebidos e o orçamento, com o que fazer agora no topo.",
    cta: "Ir para o Resumo",
  },
  {
    id: "convidados",
    since: 2,
    targets: telasDe("convidados"),
    title: "Convidados",
    what: (opens, has) => {
      const extras = [opens("/mensagens") && has("whatsapp") ? "as Mensagens" : null, opens("/mesas") ? "as Mesas" : null, opens("/credenciamento") && has("qrcode") ? "o Registro de entrada" : null].filter(Boolean);
      const more = extras.length ? ` Nesta área ficam também ${extras.join(", ").replace(/, ([^,]*)$/, " e $1")}.` : "";
      return `Adicionem convidados um a um ou importem uma planilha. Depois acompanhem quem confirmou presença e quem ainda não respondeu.${more}`;
    },
    cta: "Ir para Convidados",
  },
  {
    id: "site",
    since: 2,
    targets: telasDe("site"),
    title: "Site e convite",
    what: "Editem as informações, as fotos e a história de vocês. Ao publicar, o aviso mostra o endereço do site, que é o link do convite para compartilhar com os convidados.",
    cta: "Ir para Site e convite",
  },
  {
    id: "presentes",
    since: 2,
    targets: telasDe("presentes"),
    title: "Presentes e dinheiro",
    what: "Criem presentes com valores em reais. O convidado escolhe um e paga por Pix ou cartão. Nenhum produto é entregue: o presente é o valor. Aqui vocês acompanham o que já chegou e confirmam os Pix que esperam conferência.",
    cta: "Ir para Presentes e dinheiro",
  },
  {
    id: "organizacao",
    since: 2,
    targets: telasDe("organizacao"),
    title: "Organização",
    what: (opens) => {
      const parts = [
        opens("/pendencias") ? "as tarefas" : null,
        opens("/cronograma") ? "o cronograma do dia" : null,
        opens("/financas") ? "as despesas" : null,
        opens("/meus-fornecedores") || opens("/fornecedores") ? "os fornecedores" : null,
      ].filter(Boolean);
      const money = opens("/financas") ? " Nas despesas, vocês anotam o que contrataram e veem quanto já foi pago e quanto falta." : "";
      const find = opens("/fornecedores") ? " Em Encontrar fornecedores, vocês procuram profissionais e pedem orçamento." : "";
      return `Aqui ficam ${parts.join(", ").replace(/, ([^,]*)$/, " e $1")}.${money}${find}`;
    },
    cta: "Ir para Organização",
  },
  {
    id: "configuracoes",
    since: 2,
    targets: ["/configuracoes"],
    anchor: "conta",
    title: "Configurações",
    what: "Definam o prazo para os convidados confirmarem presença. Daqui também dá para ver o plano, rever este passo a passo e sair.",
    cta: "Ir para Configurações",
    where: "No canto de cima, abram o menu da conta e escolham “Configurações”.",
  },
  {
    id: "liz",
    since: 1,
    targets: ["/dashboard"],
    floating: "liz",
    title: "Liz",
    what: "A Liz usa as informações do painel para sugerir o que merece atenção, como convidados sem resposta. Vocês escolhem o que fazer.",
    where: "Fora do passo a passo, o botão da Liz fica no canto da tela.",
  },
];

/** Passo pronto para a pessoa: já filtrado pelo perfil e pelo plano. */
export interface PassoDoTour {
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
export function ancoraDoMenu(href: string): string {
  return `nav-${href.replace(/^\//, "").replace(/\//g, "-")}`;
}

/**
 * Passos que esta pessoa vê. Cada passo respeita as MESMAS permissões do menu (hasPathAccess sobre os
 * caminhos do perfil) e os módulos do plano: o passo a passo nunca explica o que a pessoa não pode abrir.
 */
export function montarPassosDoTour(opts: { allowedPaths: readonly string[]; modules: readonly string[] }): PassoDoTour[] {
  const paths = [...opts.allowedPaths];
  const opens = (href: string) => temAcessoAoCaminho(paths, href);
  const steps: PassoDoTour[] = [];
  for (const def of DEFINICOES) {
    if (def.needs && !opts.modules.includes(def.needs)) continue;
    const href = def.targets.find(opens);
    if (!href) continue;
    const text = typeof def.what === "function" ? def.what(opens, (m) => opts.modules.includes(m)) : def.what;
    steps.push({
      id: def.id,
      since: def.since,
      title: def.title,
      what: text,
      href: def.floating ? null : href,
      anchor: def.floating ?? def.anchor ?? ancoraDoMenu(href),
      floating: Boolean(def.floating),
      cta: def.cta && !def.floating ? (typeof def.cta === "function" ? def.cta(href) : def.cta) : null,
      where: def.where ?? null,
    });
  }
  return steps;
}

/** Nome da área no menu, para dizer onde clicar. */
export interface LugarDoPasso {
  /** Nome da área no menu lateral ("Site e convite"). */
  menuLabel: string;
  /** Nome na barra de baixo do celular ("Site"). */
  tabLabel: string | null;
}

/** Onde clicar, no computador ou no celular, com os nomes reais do menu. */
export function textoDoLugar(step: Pick<PassoDoTour, "where">, place: LugarDoPasso | null, device: "desktop" | "mobile"): string {
  if (step.where) return step.where;
  if (!place) return "";
  if (device === "desktop") return `No menu ao lado, clique em “${place.menuLabel}”.`;
  if (place.tabLabel) return `Na barra de baixo, toque em “${place.tabLabel}”.`;
  return `Na barra de baixo, procure “${place.menuLabel}”.`;
}
