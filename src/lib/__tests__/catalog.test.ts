import { test } from "node:test";
import assert from "node:assert/strict";
import { PLANS_CONFIG } from "../plans.ts";
import { COUPLE_MODULES, calculateCustomPlanPrice } from "../pricing-modules.ts";
import {
  MAX_PRICE_CENTS,
  MIN_PAID_PRICE_CENTS,
  cleanName,
  comboDiscountText,
  customPlanPriceIn,
  defaultCatalog,
  isValidPrice,
  mergeCatalog,
  moduleCatalogKey,
  planCatalogKey,
  resolvePlanIn,
} from "../catalog.ts";

const ov = (key: string, priceCents: number, name: string | null = null) => ({ key, priceCents, name });

test("sem edições o catálogo é igual ao código", () => {
  const catalog = defaultCatalog();
  for (const id of Object.keys(PLANS_CONFIG) as (keyof typeof PLANS_CONFIG)[]) {
    assert.equal(catalog.plans[id].price, PLANS_CONFIG[id].price, id);
    assert.equal(catalog.plans[id].name, PLANS_CONFIG[id].name, id);
    assert.equal(catalog.plans[id].type, PLANS_CONFIG[id].type, id);
  }
  assert.deepEqual(
    catalog.modules.map((m) => [m.id, m.price, m.name]),
    COUPLE_MODULES.map((m) => [m.id, m.price, m.name]),
  );
});

test("o preço editado sobrepõe o do código, só no que foi editado", () => {
  const catalog = mergeCatalog([ov(planCatalogKey("classic"), 15900), ov(moduleCatalogKey("qrcode"), 4500)]);
  assert.equal(catalog.plans.classic.price, 15900);
  assert.equal(catalog.plans.vip.price, 29900, "o VIP não foi editado");
  assert.equal(catalog.plans.pro.price, 9900);
  assert.equal(catalog.modules.find((m) => m.id === "qrcode")?.price, 4500);
  assert.equal(catalog.modules.find((m) => m.id === "site")?.price, 4900);
});

test("o nome editado sobrepõe e o nome inválido é ignorado", () => {
  const catalog = mergeCatalog([ov(planCatalogKey("vip"), 29900, "  Plano   VIP  Ouro "), ov(planCatalogKey("pro"), 9900, "x")]);
  assert.equal(catalog.plans.vip.name, "Plano VIP Ouro");
  assert.equal(catalog.plans.pro.name, PLANS_CONFIG.pro.name, "nome de 1 letra não vale");
  assert.equal(cleanName("   "), null);
  assert.equal(cleanName("a".repeat(41)), null);
  assert.equal(cleanName("ab"), "ab");
});

test("a mescla não altera o código nem uma mescla anterior", () => {
  const before = PLANS_CONFIG.classic.price;
  const a = mergeCatalog([ov(planCatalogKey("classic"), 19900)]);
  const b = mergeCatalog([]);
  assert.equal(PLANS_CONFIG.classic.price, before);
  assert.equal(a.plans.classic.price, 19900);
  assert.equal(b.plans.classic.price, 14900);
  assert.equal(COUPLE_MODULES.find((m) => m.id === "site")?.price, 4900);
});

test("linhas ruins nunca quebram nem mudam o preço", () => {
  const catalog = mergeCatalog([
    ov("plan:inexistente", 100),
    ov("module:fantasma", 100),
    ov("lixo", 5),
    ov(planCatalogKey("classic"), 0), // pago não vira grátis
    ov(planCatalogKey("vip"), 50), // abaixo do mínimo de cobrança
    ov(planCatalogKey("pro"), MAX_PRICE_CENTS + 1),
    ov(planCatalogKey("master"), 24900.5), // não inteiro
    ov(planCatalogKey("start"), 5000), // gratuito não vira pago
    ov(planCatalogKey("basic"), 100),
    ov(moduleCatalogKey("tables"), -100),
  ]);
  assert.equal(catalog.plans.classic.price, 14900);
  assert.equal(catalog.plans.vip.price, 29900);
  assert.equal(catalog.plans.pro.price, 9900);
  assert.equal(catalog.plans.master.price, 24900);
  assert.equal(catalog.plans.start.price, 0);
  assert.equal(catalog.plans.basic.price, 0);
  assert.equal(catalog.modules.find((m) => m.id === "tables")?.price, 3900);
  assert.equal(Object.keys(catalog.plans).length, Object.keys(PLANS_CONFIG).length);
});

test("limites de preço", () => {
  assert.equal(isValidPrice(MIN_PAID_PRICE_CENTS), true);
  assert.equal(isValidPrice(MIN_PAID_PRICE_CENTS - 1), false);
  assert.equal(isValidPrice(MAX_PRICE_CENTS), true);
  assert.equal(isValidPrice(MAX_PRICE_CENTS + 1), false);
  assert.equal(isValidPrice(149.9), false);
  assert.equal(isValidPrice("14900"), false);
  assert.equal(isValidPrice(Number.NaN), false);
  assert.equal(isValidPrice(0, { free: true }), true);
  assert.equal(isValidPrice(100, { free: true }), false);
});

test("o plano pronto usa o preço do catálogo vigente", () => {
  const catalog = mergeCatalog([ov(planCatalogKey("classic"), 15900), ov(planCatalogKey("pro"), 12900, "Fornecedor Pro Plus")]);
  assert.deepEqual(resolvePlanIn(catalog, "classic"), { type: "COUPLE", name: "Plano Classic", price: 15900 });
  assert.deepEqual(resolvePlanIn(catalog, "pro"), { type: "VENDOR", name: "Fornecedor Pro Plus", price: 12900 });
  assert.equal(resolvePlanIn(catalog, "basic")?.price, 0);
  assert.equal(resolvePlanIn(catalog, "inexistente"), null);
  assert.equal(resolvePlanIn(catalog, "__proto__"), null);
  assert.equal(resolvePlanIn(catalog, "constructor"), null);
});

test("preço de compra antiga é preservado: uma cobrança já feita não muda com o catálogo novo", () => {
  // O que foi cobrado fica em Subscription.amount (centavos). Aqui: a cotação de antes e a de depois são
  // independentes, e quem já tem o valor gravado não depende da mescla.
  const before = resolvePlanIn(defaultCatalog(), "classic")!.price;
  const charged = before; // gravado na assinatura
  const after = resolvePlanIn(mergeCatalog([ov(planCatalogKey("classic"), 17900)]), "classic")!.price;
  assert.equal(charged, 14900);
  assert.equal(after, 17900);
  assert.notEqual(charged, after);
  // voltar o preço ao do código também funciona (apagar a linha)
  assert.equal(resolvePlanIn(mergeCatalog([]), "classic")!.price, 14900);
});

test("plano adaptado: soma dos módulos com os preços do catálogo", () => {
  const catalog = mergeCatalog([ov(moduleCatalogKey("site"), 5000), ov(moduleCatalogKey("pixZero"), 6000)]);
  const calc = customPlanPriceIn(catalog, ["site", "pixZero"]);
  assert.equal(calc.subtotal, 11000);
  assert.equal(calc.discountPercent, 0);
  assert.equal(calc.total, 11000);
  assert.deepEqual(resolvePlanIn(catalog, "custom", ["site", "pixZero"]), { type: "COUPLE", name: "Plano Adaptado", price: 11000 });
  // com o código, o mesmo conjunto custa o valor antigo
  assert.equal(calculateCustomPlanPrice(["site", "pixZero"]).total, 4900 + 5900);
});

test("desconto de combinação: 3 módulos 15%, 5 ou mais 25%, arredondado ao centavo", () => {
  const three = customPlanPriceIn(defaultCatalog(), ["site", "pixZero", "whatsapp"]);
  assert.equal(three.subtotal, 4900 + 5900 + 6900);
  assert.equal(three.discountPercent, 15);
  assert.equal(three.discountAmount, Math.round((17700 * 15) / 100)); // 2655
  assert.equal(three.total, 17700 - 2655);

  const five = customPlanPriceIn(defaultCatalog(), ["site", "pixZero", "whatsapp", "qrcode", "tables"]);
  assert.equal(five.discountPercent, 25);
  assert.equal(five.total, five.subtotal - Math.round((five.subtotal * 25) / 100));

  const two = customPlanPriceIn(defaultCatalog(), ["site", "qrcode"]);
  assert.equal(two.discountPercent, 0);
  assert.equal(two.total, two.subtotal);
});

test("arredondamento com centavos ímpares", () => {
  // subtotal 3 x R$ 33,33 = 9999 centavos; 15% = 1499,85 -> 1500 (arredonda para o centavo mais próximo)
  const catalog = mergeCatalog([ov(moduleCatalogKey("site"), 3333), ov(moduleCatalogKey("pixZero"), 3333), ov(moduleCatalogKey("whatsapp"), 3333)]);
  const calc = customPlanPriceIn(catalog, ["site", "pixZero", "whatsapp"]);
  assert.equal(calc.subtotal, 9999);
  assert.equal(calc.discountAmount, 1500);
  assert.equal(calc.total, 8499);
  assert.ok(Number.isInteger(calc.total) && Number.isInteger(calc.discountAmount));
  // 5 x 1,01 = 505 centavos; 25% = 126,25 -> 126
  const cheap = mergeCatalog(["site", "pixZero", "whatsapp", "qrcode", "tables"].map((id) => ov(moduleCatalogKey(id), 101)));
  const five = customPlanPriceIn(cheap, ["site", "pixZero", "whatsapp", "qrcode", "tables"]);
  assert.equal(five.subtotal, 505);
  assert.equal(five.discountAmount, 126);
  assert.equal(five.total, 379);
});

test("módulo repetido ou inexistente não infla nem derruba o preço", () => {
  const catalog = defaultCatalog();
  assert.equal(customPlanPriceIn(catalog, ["site", "site", "site"]).subtotal, 4900);
  assert.equal(customPlanPriceIn(catalog, ["nada"]).selectedModules.length, 0);
  assert.equal(resolvePlanIn(catalog, "custom", ["nada"]), null);
  assert.equal(resolvePlanIn(catalog, "custom", []), null);
  assert.equal(resolvePlanIn(catalog, "custom"), null);
});

test("o texto do desconto vem do que o código faz", () => {
  assert.equal(comboDiscountText(), "Com 3 recursos o plano ganha 15% de desconto. Com 5 ou mais, 25%.");
});
