// Textos, fotos e planos da tela de acesso (entrar e criar conta). Sem dependências de servidor.
import { PLANS_CONFIG, type PlanKey } from "@/lib/plans";
import { calculateCustomPlanPrice } from "@/lib/pricing-modules";

export type AuthMode = "entrar" | "criar";
export type AccountType = "casal" | "fornecedor";
export type SignupStep = "tipo" | "plano" | "dados" | "pagamento" | "pronto";

export const COUPLE_PLAN_KEYS = ["basic", "classic", "vip"] as const satisfies readonly PlanKey[];
export const VENDOR_PLAN_KEYS = ["start", "pro", "master"] as const satisfies readonly PlanKey[];

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

const SUMMARY: Record<PlanKey, string> = {
  basic: "Site, lista de presentes e confirmações.",
  classic: "Tudo para receber os convidados sem planilha.",
  vip: "Tudo do Classic, mesas e atendimento prioritário.",
  start: "Seu perfil na vitrine, com curadoria.",
  pro: "Pedidos ilimitados e WhatsApp direto com o casal.",
  master: "Destaque nas buscas e painel de resultados.",
};

/** Nome sem o prefixo "Plano"/"Fornecedor": "Classic", "Pro", "Master Elite". */
export function shortPlanName(name: string) {
  return name.replace(/^(Plano|Fornecedor)\s+/, "");
}

export function planOption(key: PlanKey): PlanOption {
  const plan = PLANS_CONFIG[key];
  return {
    id: key,
    name: shortPlanName(plan.name),
    summary: SUMMARY[key],
    price: plan.price,
    period: plan.price === 0 ? "para sempre" : plan.type === "VENDOR" ? "por mês" : "uma vez",
    features: plan.features,
    popular: "isPopular" in plan && plan.isPopular === true,
  };
}

export function customPlanOption(modules: string[]): PlanOption | null {
  const calc = calculateCustomPlanPrice(modules);
  if (calc.selectedModules.length === 0) return null;
  return {
    id: "custom",
    name: "Adaptado",
    summary: "O plano que vocês montaram, só com o que precisam.",
    price: calc.total,
    period: calc.total === 0 ? "para sempre" : "uma vez",
    features: calc.selectedModules.map((m) => m.name),
  };
}

export function plansFor(type: AccountType, customModules?: string[]): PlanOption[] {
  if (type === "fornecedor") return VENDOR_PLAN_KEYS.map(planOption);
  const custom = customModules?.length ? customPlanOption(customModules) : null;
  return [...(custom ? [custom] : []), ...COUPLE_PLAN_KEYS.map(planOption)];
}

export function typeOfPlan(planId: string | undefined): AccountType | null {
  if (!planId) return null;
  if ((VENDOR_PLAN_KEYS as readonly string[]).includes(planId)) return "fornecedor";
  if ((COUPLE_PLAN_KEYS as readonly string[]).includes(planId) || planId === "custom") return "casal";
  return null;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function formatPrice(cents: number) {
  return cents === 0 ? "Grátis" : brl.format(cents / 100);
}

/** Foto do painel lateral para cada momento do acesso. */
export interface AuthPhoto {
  src: string;
  alt: string;
  caption: string;
  position?: string;
}

export const PHOTOS = {
  entrar: {
    src: "/images/aceito/img-21-papelaria.webp",
    alt: "Convite em papel algodão com envelope ameixa e selo de cera",
    caption: "Do convite ao grande dia.",
  },
  tipo: {
    src: "/images/aceito/img-19-fotografia-pre-wedding.webp",
    alt: "Casal sorrindo numa estrada de terra ao pôr do sol",
    caption: "Todo grande dia começa com um sim.",
    position: "50% 35%",
  },
  casal: {
    src: "/images/aceito/img-01-casal-capa.webp",
    alt: "Noivos se olhando no campo ao entardecer",
    caption: "Comecem de graça. O resto vem com calma.",
    position: "50% 30%",
  },
  fornecedor: {
    src: "/images/aceito/img-24-fotografo-retrato.webp",
    alt: "Fotógrafo de casamento segurando a câmera",
    caption: "Mostre seu trabalho para quem está casando.",
    position: "50% 30%",
  },
  pronto: {
    src: "/images/aceito/img-22-album-brinde.webp",
    alt: "Convidados brindando com taças de espumante",
    caption: "Que comece a festa.",
  },
} satisfies Record<string, AuthPhoto>;

export function photoFor(mode: AuthMode, step: SignupStep, type: AccountType | null): AuthPhoto {
  if (mode === "entrar") return PHOTOS.entrar;
  if (step === "pronto") return PHOTOS.pronto;
  if (step === "tipo" || !type) return PHOTOS.tipo;
  return type === "fornecedor" ? PHOTOS.fornecedor : PHOTOS.casal;
}
