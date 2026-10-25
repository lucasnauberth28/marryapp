// Textos, fotos e planos da tela de acesso (entrar e criar conta). Sem dependências de servidor.
import type { ChaveDoPlano } from "@/lib/pagamento/plans";
import { catalogoPadrao, precoDoPlanoPersonalizadoNoCatalogo, type Catalogo } from "@/lib/pagamento/catalog";
import { RESUMO_DO_CADASTRO, rotuloDoPlano } from "@/lib/pagamento/plan-copy";

import { formatarReaisEnxuto } from "@/lib/formatacao/dinheiro";
// Sem catálogo passado, valem os preços do código; as telas reais passam o catálogo do servidor (lib/catalog-server.ts),
// que traz os preços editados pela administração.
let catalogoPorCodigo: Catalogo | null = null;
const catalogoDeApoio = () => (catalogoPorCodigo ??= catalogoPadrao());

export type ModoDeAcesso = "entrar" | "criar";
export type TipoDeConta = "casal" | "fornecedor";
export type EtapaDoCadastro = "tipo" | "plano" | "dados" | "pagamento" | "pronto";

const CHAVES_DOS_PLANOS_DO_CASAL = ["basic", "classic", "vip"] as const satisfies readonly ChaveDoPlano[];
const CHAVES_DOS_PLANOS_DE_FORNECEDOR = ["start", "pro", "master"] as const satisfies readonly ChaveDoPlano[];

/** Plano mostrado na tela: os do catálogo ou o adaptado (montado em /monte-seu-plano). */
export interface OpcaoDePlano {
  id: ChaveDoPlano | "custom";
  name: string;
  summary: string;
  price: number; // centavos
  period: string;
  features: string[];
  popular?: boolean;
}

/** Nome sem o prefixo "Plano"/"Fornecedor": "Classic", "Pro", "Master Elite". */
export function nomeCurtoDoPlano(name: string) {
  return rotuloDoPlano(name);
}

export function opcaoDePlano(key: ChaveDoPlano, catalog: Catalogo = catalogoDeApoio()): OpcaoDePlano {
  const plan = catalog.plans[key];
  return {
    id: key,
    name: nomeCurtoDoPlano(plan.name),
    summary: RESUMO_DO_CADASTRO[key],
    price: plan.price,
    period: plan.price === 0 ? "sem mensalidade" : plan.type === "VENDOR" ? "por mês" : "pagamento único",
    features: [...plan.features],
    popular: plan.isPopular === true,
  };
}

function opcaoDePlanoPersonalizado(modules: string[], catalog: Catalogo = catalogoDeApoio()): OpcaoDePlano | null {
  const calc = precoDoPlanoPersonalizadoNoCatalogo(catalog, modules);
  if (calc.selectedModules.length === 0) return null;
  return {
    id: "custom",
    name: "Adaptado",
    summary: "O plano que vocês montaram, só com os recursos que escolheram.",
    price: calc.total,
    period: calc.total === 0 ? "sem mensalidade" : "pagamento único",
    features: calc.selectedModules.map((m) => m.name),
  };
}

export function planosPara(type: TipoDeConta, customModules?: string[], catalog: Catalogo = catalogoDeApoio()): OpcaoDePlano[] {
  if (type === "fornecedor") return CHAVES_DOS_PLANOS_DE_FORNECEDOR.map((key) => opcaoDePlano(key, catalog));
  const custom = customModules?.length ? opcaoDePlanoPersonalizado(customModules, catalog) : null;
  return [...(custom ? [custom] : []), ...CHAVES_DOS_PLANOS_DO_CASAL.map((key) => opcaoDePlano(key, catalog))];
}

export function tipoDoPlano(planId: string | undefined): TipoDeConta | null {
  if (!planId) return null;
  if ((CHAVES_DOS_PLANOS_DE_FORNECEDOR as readonly string[]).includes(planId)) return "fornecedor";
  if ((CHAVES_DOS_PLANOS_DO_CASAL as readonly string[]).includes(planId) || planId === "custom") return "casal";
  return null;
}

export function formatarPrecoDoPlano(cents: number) {
  return formatarReaisEnxuto(cents);
}

/** Foto do painel lateral para cada momento do acesso. */
export interface FotoDeAcesso {
  src: string;
  alt: string;
  caption: string;
  position?: string;
}

const FOTOS = {
  entrar: {
    src: "/images/acesso/convite-aliancas.webp",
    alt: "Convite com selo de cera ameixa, alianças num pratinho e peônias rosa sobre uma mesa de madeira",
    caption: "Um sim. Muitos próximos passos.",
    position: "15% 60%",
  },
  tipo: {
    src: "/images/acesso/maos-xicara.webp",
    alt: "Duas pessoas de mãos dadas em volta de uma xícara, uma delas com aliança dourada",
    caption: "Todo grande dia começa com um sim.",
    position: "50% 60%",
  },
  casal: {
    src: "/images/acesso/maos-xicara.webp",
    alt: "Duas pessoas de mãos dadas em volta de uma xícara, uma delas com aliança dourada",
    caption: "Comecem pelo site e pela lista de convidados.",
    position: "50% 60%",
  },
  fornecedor: {
    src: "/images/acesso/cafe-croissant.webp",
    alt: "Duas xícaras de cerâmica, um croissant e flores secas numa mesa de madeira clara",
    caption: "Mostre seu trabalho para quem está casando.",
    position: "45% 60%",
  },
  pronto: {
    src: "/images/acesso/croche-peonia.webp",
    alt: "Peônia de crochê rosa num vaso branco, ao lado de uma xícara fumegante",
    caption: "Tudo pronto. Agora é só começar.",
    position: "35% 60%",
  },
} satisfies Record<string, FotoDeAcesso>;

export function fotoPara(mode: ModoDeAcesso, step: EtapaDoCadastro, type: TipoDeConta | null): FotoDeAcesso {
  if (mode === "entrar") return FOTOS.entrar;
  if (step === "pronto") return FOTOS.pronto;
  if (step === "tipo" || !type) return FOTOS.tipo;
  return type === "fornecedor" ? FOTOS.fornecedor : FOTOS.casal;
}
