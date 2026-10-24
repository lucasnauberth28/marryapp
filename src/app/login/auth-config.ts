// Textos, fotos e planos da tela de acesso (entrar e criar conta). Sem dependências de servidor.
import type { PlanKey } from "@/lib/plans";
import { defaultCatalog, customPlanPriceIn, type Catalog } from "@/lib/catalog";
import { SIGNUP_SUMMARY, planLabel } from "@/lib/plan-copy";

// Sem catálogo passado, valem os preços do código; as telas reais passam o catálogo do servidor (lib/catalog-server.ts),
// que traz os preços editados pela administração.
let codeCatalog: Catalog | null = null;
const fallbackCatalog = () => (codeCatalog ??= defaultCatalog());

export type AuthMode = "entrar" | "criar";
export type AccountType = "casal" | "fornecedor";
export type SignupStep = "tipo" | "plano" | "dados" | "pagamento" | "pronto";

const COUPLE_PLAN_KEYS = ["basic", "classic", "vip"] as const satisfies readonly PlanKey[];
const VENDOR_PLAN_KEYS = ["start", "pro", "master"] as const satisfies readonly PlanKey[];

/** Plano mostrado na tela: os do catálogo ou o adaptado (montado em /monte-seu-plano). */
export interface PlanOption {
  id: PlanKey | "custom";
  name: string;
  summary: string;
  price: number; // centavos
  period: string;
  features: string[];
  popular?: boolean;
}

/** Nome sem o prefixo "Plano"/"Fornecedor": "Classic", "Pro", "Master Elite". */
export function shortPlanName(name: string) {
  return planLabel(name);
}

export function planOption(key: PlanKey, catalog: Catalog = fallbackCatalog()): PlanOption {
  const plan = catalog.plans[key];
  return {
    id: key,
    name: shortPlanName(plan.name),
    summary: SIGNUP_SUMMARY[key],
    price: plan.price,
    period: plan.price === 0 ? "sem mensalidade" : plan.type === "VENDOR" ? "por mês" : "pagamento único",
    features: [...plan.features],
    popular: plan.isPopular === true,
  };
}

function customPlanOption(modules: string[], catalog: Catalog = fallbackCatalog()): PlanOption | null {
  const calc = customPlanPriceIn(catalog, modules);
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

export function plansFor(type: AccountType, customModules?: string[], catalog: Catalog = fallbackCatalog()): PlanOption[] {
  if (type === "fornecedor") return VENDOR_PLAN_KEYS.map((key) => planOption(key, catalog));
  const custom = customModules?.length ? customPlanOption(customModules, catalog) : null;
  return [...(custom ? [custom] : []), ...COUPLE_PLAN_KEYS.map((key) => planOption(key, catalog))];
}

export function typeOfPlan(planId: string | undefined): AccountType | null {
  if (!planId) return null;
  if ((VENDOR_PLAN_KEYS as readonly string[]).includes(planId)) return "fornecedor";
  if ((COUPLE_PLAN_KEYS as readonly string[]).includes(planId) || planId === "custom") return "casal";
  return null;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function formatPrice(cents: number) {
  return cents === 0 ? "R$ 0" : brl.format(cents / 100);
}

/** Foto do painel lateral para cada momento do acesso. */
export interface AuthPhoto {
  src: string;
  alt: string;
  caption: string;
  position?: string;
}

const PHOTOS = {
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
} satisfies Record<string, AuthPhoto>;

export function photoFor(mode: AuthMode, step: SignupStep, type: AccountType | null): AuthPhoto {
  if (mode === "entrar") return PHOTOS.entrar;
  if (step === "pronto") return PHOTOS.pronto;
  if (step === "tipo" || !type) return PHOTOS.tipo;
  return type === "fornecedor" ? PHOTOS.fornecedor : PHOTOS.casal;
}
