// Catálogo de planos e módulos com os preços editados pela administração (/admin/planos/catalogo).
// Puro (sem banco nem Next): roda no servidor, no navegador e nos testes. A leitura do banco fica em catalog-server.ts.
//
// Regras de dinheiro:
//  - O código (lib/plans.ts e lib/pricing-modules.ts) é o padrão. Uma linha de CatalogPrice SOBREPÕE preço e nome.
//  - Quem cobra (checkout, cadastro) sempre recalcula o preço no servidor a partir deste catálogo, nunca do navegador.
//  - O novo preço vale só para compras novas: Subscription.amount guarda o que foi cobrado e nada aqui o recalcula.
//  - Planos gratuitos (Básico e Start) continuam gratuitos: a mescla ignora preço de override nesses planos.
//  - Preço pago fica entre R$ 1,00 (a menor cobrança que o Pix aceita) e R$ 10.000,00; valor fora disso é ignorado.
import { PLANS_CONFIG, type PlanKey } from "./plans.ts";
import { COUPLE_MODULES, calculateCustomPlanPrice, type PricingModule } from "./pricing-modules.ts";

/** Menor preço de um plano ou módulo pago, em centavos. */
export const MIN_PAID_PRICE_CENTS = 100;
/** Maior preço aceito, em centavos (R$ 10.000,00): trava erro de digitação. */
export const MAX_PRICE_CENTS = 1_000_000;
/** Tamanho do nome editável. */
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 40;

export interface CatalogPlan {
  type: "COUPLE" | "VENDOR";
  name: string;
  /** Centavos. */
  price: number;
  period: string;
  badge: string;
  isPopular?: boolean;
  features: readonly string[];
}

export interface Catalog {
  plans: Record<PlanKey, CatalogPlan>;
  modules: PricingModule[];
}

/** Uma linha de CatalogPrice (só o que a mescla usa). */
export interface CatalogOverride {
  key: string;
  priceCents: number;
  name: string | null;
}

export const planCatalogKey = (id: PlanKey) => `plan:${id}`;
export const moduleCatalogKey = (id: string) => `module:${id}`;

/** Planos que são sempre gratuitos: o preço deles não se edita. */
export function isFreePlan(id: PlanKey): boolean {
  return PLANS_CONFIG[id].price === 0;
}

/** O preço é aceitável para este item? (inteiro, dentro dos limites; item gratuito só aceita zero) */
export function isValidPrice(priceCents: unknown, options: { free?: boolean } = {}): priceCents is number {
  if (typeof priceCents !== "number" || !Number.isInteger(priceCents)) return false;
  if (options.free) return priceCents === 0;
  return priceCents >= MIN_PAID_PRICE_CENTS && priceCents <= MAX_PRICE_CENTS;
}

/** Nome limpo (espaços aparados e repetidos) ou null se não serve. */
export function cleanName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const value = name.replace(/\s+/g, " ").trim();
  return value.length >= MIN_NAME_LENGTH && value.length <= MAX_NAME_LENGTH ? value : null;
}

/** O catálogo do código, sem nenhuma edição. */
export function defaultCatalog(): Catalog {
  return mergeCatalog([]);
}

/**
 * Mescla as edições da administração com o código. Nunca altera os originais e nunca lança:
 * linha com chave desconhecida, preço inválido ou nome inválido é ignorada (vale o código).
 */
export function mergeCatalog(overrides: readonly CatalogOverride[]): Catalog {
  const byKey = new Map(overrides.map((o) => [o.key, o]));

  const plans = {} as Record<PlanKey, CatalogPlan>;
  for (const id of Object.keys(PLANS_CONFIG) as PlanKey[]) {
    const base = PLANS_CONFIG[id];
    const override = byKey.get(planCatalogKey(id));
    // Plano gratuito nunca vira pago por uma linha do banco
    const price = base.price !== 0 && override && isValidPrice(override.priceCents) ? override.priceCents : base.price;
    plans[id] = {
      type: base.type,
      name: (override && cleanName(override.name)) || base.name,
      price,
      period: base.period,
      badge: base.badge,
      isPopular: "isPopular" in base && base.isPopular === true ? true : undefined,
      features: base.features,
    };
  }

  const modules = COUPLE_MODULES.map((base) => {
    const override = byKey.get(moduleCatalogKey(base.id));
    return {
      ...base,
      name: (override && cleanName(override.name)) || base.name,
      price: override && isValidPrice(override.priceCents) ? override.priceCents : base.price,
    };
  });

  return { plans, modules };
}

export function isCatalogPlanKey(catalog: Catalog, value: string): value is PlanKey {
  return Object.prototype.hasOwnProperty.call(catalog.plans, value);
}

/**
 * Tipo, nome e preço (centavos) de um plano pelo catálogo vigente. O plano adaptado ("custom") é sempre de casal e
 * soma só os módulos escolhidos que existem; sem nenhum módulo válido, devolve null.
 */
export function resolvePlanIn(catalog: Catalog, planId: string, modules?: readonly string[]): { type: "COUPLE" | "VENDOR"; name: string; price: number } | null {
  if (planId === "custom") {
    const calc = calculateCustomPlanPrice([...(modules ?? [])], catalog.modules);
    if (calc.selectedModules.length === 0) return null;
    return { type: "COUPLE", name: "Plano Adaptado", price: calc.total };
  }
  if (!isCatalogPlanKey(catalog, planId)) return null;
  const plan = catalog.plans[planId];
  return { type: plan.type, name: plan.name, price: plan.price };
}

/** Preço do plano adaptado com os módulos do catálogo vigente (a tela de montar o plano e o servidor usam a mesma conta). */
export function customPlanPriceIn(catalog: Catalog, moduleIds: readonly string[]) {
  return calculateCustomPlanPrice([...moduleIds], catalog.modules);
}

/** Texto do desconto por combinação de módulos, tirado do que o código faz (nunca de número escrito à mão). */
export function comboDiscountText(): string {
  // calculateCustomPlanPrice: 3 módulos pagos = 15%, 5 ou mais = 25%.
  const base = COUPLE_MODULES.map((m) => ({ ...m, price: 100 }));
  const at = (n: number) => calculateCustomPlanPrice(base.slice(0, n).map((m) => m.id), base).discountPercent;
  const first = Array.from({ length: base.length }, (_, i) => i + 1).find((n) => at(n) > 0);
  const second = Array.from({ length: base.length }, (_, i) => i + 1).find((n) => at(n) > (first ? at(first) : 0));
  if (!first || !second) return "";
  return `Com ${first} recursos o plano ganha ${at(first)}% de desconto. Com ${second} ou mais, ${at(second)}%.`;
}
