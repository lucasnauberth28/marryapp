// Catálogo de planos e módulos com os preços editados pela administração (/admin/planos/catalogo).
// Puro (sem banco nem Next): roda no servidor, no navegador e nos testes. A leitura do banco fica em catalog-server.ts.
//
// Regras de dinheiro:
//  - O código (lib/plans.ts e lib/pricing-modules.ts) é o padrão. Uma linha de CatalogPrice SOBREPÕE preço e nome.
//  - Quem cobra (checkout, cadastro) sempre recalcula o preço no servidor a partir deste catálogo, nunca do navegador.
//  - O novo preço vale só para compras novas: Subscription.amount guarda o que foi cobrado e nada aqui o recalcula.
//  - Planos gratuitos (Básico e Start) continuam gratuitos: a mescla ignora preço de override nesses planos.
//  - Preço pago fica entre R$ 1,00 (a menor cobrança que o Pix aceita) e R$ 10.000,00; valor fora disso é ignorado.
import { CONFIGURACAO_DOS_PLANOS, type ChaveDoPlano } from "./plans.ts";
import { MODULOS_DO_CASAL, calcularPrecoDoPlanoPersonalizado, type ModuloDePreco } from "./pricing-modules.ts";

/** Menor preço de um plano ou módulo pago, em centavos. */
export const PRECO_MINIMO_PAGO_EM_CENTAVOS = 100;
/** Maior preço aceito, em centavos (R$ 10.000,00): trava erro de digitação. */
export const PRECO_MAXIMO_EM_CENTAVOS = 1_000_000;
/** Tamanho do nome editável. */
export const TAMANHO_MINIMO_DO_NOME = 2;
export const TAMANHO_MAXIMO_DO_NOME = 40;

export interface PlanoDoCatalogo {
  type: "COUPLE" | "VENDOR";
  name: string;
  /** Centavos. */
  price: number;
  period: string;
  badge: string;
  isPopular?: boolean;
  features: readonly string[];
}

export interface Catalogo {
  plans: Record<ChaveDoPlano, PlanoDoCatalogo>;
  modules: ModuloDePreco[];
}

/** Uma linha de CatalogPrice (só o que a mescla usa). */
export interface AjusteDoCatalogo {
  key: string;
  priceCents: number;
  name: string | null;
}

export const chaveDoPlanoNoCatalogo = (id: ChaveDoPlano) => `plan:${id}`;
export const chaveDoModuloNoCatalogo = (id: string) => `module:${id}`;

/** Planos que são sempre gratuitos: o preço deles não se edita. */
export function ehPlanoGratis(id: ChaveDoPlano): boolean {
  return CONFIGURACAO_DOS_PLANOS[id].price === 0;
}

/** O preço é aceitável para este item? (inteiro, dentro dos limites; item gratuito só aceita zero) */
export function ehPrecoValido(priceCents: unknown, options: { free?: boolean } = {}): priceCents is number {
  if (typeof priceCents !== "number" || !Number.isInteger(priceCents)) return false;
  if (options.free) return priceCents === 0;
  return priceCents >= PRECO_MINIMO_PAGO_EM_CENTAVOS && priceCents <= PRECO_MAXIMO_EM_CENTAVOS;
}

/** Nome limpo (espaços aparados e repetidos) ou null se não serve. */
export function limparNome(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const value = name.replace(/\s+/g, " ").trim();
  return value.length >= TAMANHO_MINIMO_DO_NOME && value.length <= TAMANHO_MAXIMO_DO_NOME ? value : null;
}

/** O catálogo do código, sem nenhuma edição. */
export function catalogoPadrao(): Catalogo {
  return mesclarCatalogo([]);
}

/**
 * Mescla as edições da administração com o código. Nunca altera os originais e nunca lança:
 * linha com chave desconhecida, preço inválido ou nome inválido é ignorada (vale o código).
 */
export function mesclarCatalogo(overrides: readonly AjusteDoCatalogo[]): Catalogo {
  const byKey = new Map(overrides.map((o) => [o.key, o]));

  const plans = {} as Record<ChaveDoPlano, PlanoDoCatalogo>;
  for (const id of Object.keys(CONFIGURACAO_DOS_PLANOS) as ChaveDoPlano[]) {
    const base = CONFIGURACAO_DOS_PLANOS[id];
    const override = byKey.get(chaveDoPlanoNoCatalogo(id));
    // Plano gratuito nunca vira pago por uma linha do banco
    const price = base.price !== 0 && override && ehPrecoValido(override.priceCents) ? override.priceCents : base.price;
    plans[id] = {
      type: base.type,
      name: (override && limparNome(override.name)) || base.name,
      price,
      period: base.period,
      badge: base.badge,
      isPopular: "isPopular" in base && base.isPopular === true ? true : undefined,
      features: base.features,
    };
  }

  const modules = MODULOS_DO_CASAL.map((base) => {
    const override = byKey.get(chaveDoModuloNoCatalogo(base.id));
    return {
      ...base,
      name: (override && limparNome(override.name)) || base.name,
      price: override && ehPrecoValido(override.priceCents) ? override.priceCents : base.price,
    };
  });

  return { plans, modules };
}

export function ehChaveDePlanoDoCatalogo(catalog: Catalogo, value: string): value is ChaveDoPlano {
  return Object.prototype.hasOwnProperty.call(catalog.plans, value);
}

/**
 * Tipo, nome e preço (centavos) de um plano pelo catálogo vigente. O plano adaptado ("custom") é sempre de casal e
 * soma só os módulos escolhidos que existem; sem nenhum módulo válido, devolve null.
 */
export function resolverPlanoNoCatalogo(catalog: Catalogo, planId: string, modules?: readonly string[]): { type: "COUPLE" | "VENDOR"; name: string; price: number } | null {
  if (planId === "custom") {
    const calc = calcularPrecoDoPlanoPersonalizado([...(modules ?? [])], catalog.modules);
    if (calc.selectedModules.length === 0) return null;
    return { type: "COUPLE", name: "Plano Adaptado", price: calc.total };
  }
  if (!ehChaveDePlanoDoCatalogo(catalog, planId)) return null;
  const plan = catalog.plans[planId];
  return { type: plan.type, name: plan.name, price: plan.price };
}

/** Preço do plano adaptado com os módulos do catálogo vigente (a tela de montar o plano e o servidor usam a mesma conta). */
export function precoDoPlanoPersonalizadoNoCatalogo(catalog: Catalogo, moduleIds: readonly string[]) {
  return calcularPrecoDoPlanoPersonalizado([...moduleIds], catalog.modules);
}

/** Texto do desconto por combinação de módulos, tirado do que o código faz (nunca de número escrito à mão). */
export function textoDoDescontoDoCombo(): string {
  // calculateCustomPlanPrice: 3 módulos pagos = 15%, 5 ou mais = 25%.
  const base = MODULOS_DO_CASAL.map((m) => ({ ...m, price: 100 }));
  const at = (n: number) => calcularPrecoDoPlanoPersonalizado(base.slice(0, n).map((m) => m.id), base).discountPercent;
  const first = Array.from({ length: base.length }, (_, i) => i + 1).find((n) => at(n) > 0);
  const second = Array.from({ length: base.length }, (_, i) => i + 1).find((n) => at(n) > (first ? at(first) : 0));
  if (!first || !second) return "";
  return `Com ${first} recursos o plano ganha ${at(first)}% de desconto. Com ${second} ou mais, ${at(second)}%.`;
}
