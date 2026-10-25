import { test } from "node:test";
import assert from "node:assert/strict";
import { CONFIGURACAO_DOS_PLANOS } from "../plans.ts";
import { MODULOS_DO_CASAL, calcularPrecoDoPlanoPersonalizado } from "../pricing-modules.ts";
import {
  PRECO_MAXIMO_EM_CENTAVOS,
  PRECO_MINIMO_PAGO_EM_CENTAVOS,
  limparNome,
  textoDoDescontoDoCombo,
  precoDoPlanoPersonalizadoNoCatalogo,
  catalogoPadrao,
  ehPrecoValido,
  mesclarCatalogo,
  chaveDoModuloNoCatalogo,
  chaveDoPlanoNoCatalogo,
  resolverPlanoNoCatalogo,
} from "../catalog.ts";

const ov = (key: string, priceCents: number, name: string | null = null) => ({ key, priceCents, name });

test("sem edições o catálogo é igual ao código", () => {
  const catalog = catalogoPadrao();
  for (const id of Object.keys(CONFIGURACAO_DOS_PLANOS) as (keyof typeof CONFIGURACAO_DOS_PLANOS)[]) {
    assert.equal(catalog.plans[id].price, CONFIGURACAO_DOS_PLANOS[id].price, id);
    assert.equal(catalog.plans[id].name, CONFIGURACAO_DOS_PLANOS[id].name, id);
    assert.equal(catalog.plans[id].type, CONFIGURACAO_DOS_PLANOS[id].type, id);
  }
  assert.deepEqual(
    catalog.modules.map((m) => [m.id, m.price, m.name]),
    MODULOS_DO_CASAL.map((m) => [m.id, m.price, m.name]),
  );
});

test("o preço editado sobrepõe o do código, só no que foi editado", () => {
  const catalog = mesclarCatalogo([ov(chaveDoPlanoNoCatalogo("classic"), 15900), ov(chaveDoModuloNoCatalogo("qrcode"), 4500)]);
  assert.equal(catalog.plans.classic.price, 15900);
  assert.equal(catalog.plans.vip.price, 29900, "o VIP não foi editado");
  assert.equal(catalog.plans.pro.price, 9900);
  assert.equal(catalog.modules.find((m) => m.id === "qrcode")?.price, 4500);
  assert.equal(catalog.modules.find((m) => m.id === "site")?.price, 4900);
});

test("o nome editado sobrepõe e o nome inválido é ignorado", () => {
  const catalog = mesclarCatalogo([ov(chaveDoPlanoNoCatalogo("vip"), 29900, "  Plano   VIP  Ouro "), ov(chaveDoPlanoNoCatalogo("pro"), 9900, "x")]);
  assert.equal(catalog.plans.vip.name, "Plano VIP Ouro");
  assert.equal(catalog.plans.pro.name, CONFIGURACAO_DOS_PLANOS.pro.name, "nome de 1 letra não vale");
  assert.equal(limparNome("   "), null);
  assert.equal(limparNome("a".repeat(41)), null);
  assert.equal(limparNome("ab"), "ab");
});

test("a mescla não altera o código nem uma mescla anterior", () => {
  const before = CONFIGURACAO_DOS_PLANOS.classic.price;
  const a = mesclarCatalogo([ov(chaveDoPlanoNoCatalogo("classic"), 19900)]);
  const b = mesclarCatalogo([]);
  assert.equal(CONFIGURACAO_DOS_PLANOS.classic.price, before);
  assert.equal(a.plans.classic.price, 19900);
  assert.equal(b.plans.classic.price, 14900);
  assert.equal(MODULOS_DO_CASAL.find((m) => m.id === "site")?.price, 4900);
});

test("linhas ruins nunca quebram nem mudam o preço", () => {
  const catalog = mesclarCatalogo([
    ov("plan:inexistente", 100),
    ov("module:fantasma", 100),
    ov("lixo", 5),
    ov(chaveDoPlanoNoCatalogo("classic"), 0), // pago não vira grátis
    ov(chaveDoPlanoNoCatalogo("vip"), 50), // abaixo do mínimo de cobrança
    ov(chaveDoPlanoNoCatalogo("pro"), PRECO_MAXIMO_EM_CENTAVOS + 1),
    ov(chaveDoPlanoNoCatalogo("master"), 24900.5), // não inteiro
    ov(chaveDoPlanoNoCatalogo("start"), 5000), // gratuito não vira pago
    ov(chaveDoPlanoNoCatalogo("basic"), 100),
    ov(chaveDoModuloNoCatalogo("tables"), -100),
  ]);
  assert.equal(catalog.plans.classic.price, 14900);
  assert.equal(catalog.plans.vip.price, 29900);
  assert.equal(catalog.plans.pro.price, 9900);
  assert.equal(catalog.plans.master.price, 24900);
  assert.equal(catalog.plans.start.price, 0);
  assert.equal(catalog.plans.basic.price, 0);
  assert.equal(catalog.modules.find((m) => m.id === "tables")?.price, 3900);
  assert.equal(Object.keys(catalog.plans).length, Object.keys(CONFIGURACAO_DOS_PLANOS).length);
});

test("limites de preço", () => {
  assert.equal(ehPrecoValido(PRECO_MINIMO_PAGO_EM_CENTAVOS), true);
  assert.equal(ehPrecoValido(PRECO_MINIMO_PAGO_EM_CENTAVOS - 1), false);
  assert.equal(ehPrecoValido(PRECO_MAXIMO_EM_CENTAVOS), true);
  assert.equal(ehPrecoValido(PRECO_MAXIMO_EM_CENTAVOS + 1), false);
  assert.equal(ehPrecoValido(149.9), false);
  assert.equal(ehPrecoValido("14900"), false);
  assert.equal(ehPrecoValido(Number.NaN), false);
  assert.equal(ehPrecoValido(0, { free: true }), true);
  assert.equal(ehPrecoValido(100, { free: true }), false);
});

test("o plano pronto usa o preço do catálogo vigente", () => {
  const catalog = mesclarCatalogo([ov(chaveDoPlanoNoCatalogo("classic"), 15900), ov(chaveDoPlanoNoCatalogo("pro"), 12900, "Fornecedor Pro Plus")]);
  assert.deepEqual(resolverPlanoNoCatalogo(catalog, "classic"), { type: "COUPLE", name: "Plano Classic", price: 15900 });
  assert.deepEqual(resolverPlanoNoCatalogo(catalog, "pro"), { type: "VENDOR", name: "Fornecedor Pro Plus", price: 12900 });
  assert.equal(resolverPlanoNoCatalogo(catalog, "basic")?.price, 0);
  assert.equal(resolverPlanoNoCatalogo(catalog, "inexistente"), null);
  assert.equal(resolverPlanoNoCatalogo(catalog, "__proto__"), null);
  assert.equal(resolverPlanoNoCatalogo(catalog, "constructor"), null);
});

test("preço de compra antiga é preservado: uma cobrança já feita não muda com o catálogo novo", () => {
  // O que foi cobrado fica em Subscription.amount (centavos). Aqui: a cotação de antes e a de depois são
  // independentes, e quem já tem o valor gravado não depende da mescla.
  const before = resolverPlanoNoCatalogo(catalogoPadrao(), "classic")!.price;
  const charged = before; // gravado na assinatura
  const after = resolverPlanoNoCatalogo(mesclarCatalogo([ov(chaveDoPlanoNoCatalogo("classic"), 17900)]), "classic")!.price;
  assert.equal(charged, 14900);
  assert.equal(after, 17900);
  assert.notEqual(charged, after);
  // voltar o preço ao do código também funciona (apagar a linha)
  assert.equal(resolverPlanoNoCatalogo(mesclarCatalogo([]), "classic")!.price, 14900);
});

test("plano adaptado: soma dos módulos com os preços do catálogo", () => {
  const catalog = mesclarCatalogo([ov(chaveDoModuloNoCatalogo("site"), 5000), ov(chaveDoModuloNoCatalogo("pixZero"), 6000)]);
  const calc = precoDoPlanoPersonalizadoNoCatalogo(catalog, ["site", "pixZero"]);
  assert.equal(calc.subtotal, 11000);
  assert.equal(calc.discountPercent, 0);
  assert.equal(calc.total, 11000);
  assert.deepEqual(resolverPlanoNoCatalogo(catalog, "custom", ["site", "pixZero"]), { type: "COUPLE", name: "Plano Adaptado", price: 11000 });
  // com o código, o mesmo conjunto custa o valor antigo
  assert.equal(calcularPrecoDoPlanoPersonalizado(["site", "pixZero"]).total, 4900 + 5900);
});

test("desconto de combinação: 3 módulos 15%, 5 ou mais 25%, arredondado ao centavo", () => {
  const three = precoDoPlanoPersonalizadoNoCatalogo(catalogoPadrao(), ["site", "pixZero", "whatsapp"]);
  assert.equal(three.subtotal, 4900 + 5900 + 6900);
  assert.equal(three.discountPercent, 15);
  assert.equal(three.discountAmount, Math.round((17700 * 15) / 100)); // 2655
  assert.equal(three.total, 17700 - 2655);

  const five = precoDoPlanoPersonalizadoNoCatalogo(catalogoPadrao(), ["site", "pixZero", "whatsapp", "qrcode", "tables"]);
  assert.equal(five.discountPercent, 25);
  assert.equal(five.total, five.subtotal - Math.round((five.subtotal * 25) / 100));

  const two = precoDoPlanoPersonalizadoNoCatalogo(catalogoPadrao(), ["site", "qrcode"]);
  assert.equal(two.discountPercent, 0);
  assert.equal(two.total, two.subtotal);
});

test("arredondamento com centavos ímpares", () => {
  // subtotal 3 x R$ 33,33 = 9999 centavos; 15% = 1499,85 -> 1500 (arredonda para o centavo mais próximo)
  const catalog = mesclarCatalogo([ov(chaveDoModuloNoCatalogo("site"), 3333), ov(chaveDoModuloNoCatalogo("pixZero"), 3333), ov(chaveDoModuloNoCatalogo("whatsapp"), 3333)]);
  const calc = precoDoPlanoPersonalizadoNoCatalogo(catalog, ["site", "pixZero", "whatsapp"]);
  assert.equal(calc.subtotal, 9999);
  assert.equal(calc.discountAmount, 1500);
  assert.equal(calc.total, 8499);
  assert.ok(Number.isInteger(calc.total) && Number.isInteger(calc.discountAmount));
  // 5 x 1,01 = 505 centavos; 25% = 126,25 -> 126
  const cheap = mesclarCatalogo(["site", "pixZero", "whatsapp", "qrcode", "tables"].map((id) => ov(chaveDoModuloNoCatalogo(id), 101)));
  const five = precoDoPlanoPersonalizadoNoCatalogo(cheap, ["site", "pixZero", "whatsapp", "qrcode", "tables"]);
  assert.equal(five.subtotal, 505);
  assert.equal(five.discountAmount, 126);
  assert.equal(five.total, 379);
});

test("módulo repetido ou inexistente não infla nem derruba o preço", () => {
  const catalog = catalogoPadrao();
  assert.equal(precoDoPlanoPersonalizadoNoCatalogo(catalog, ["site", "site", "site"]).subtotal, 4900);
  assert.equal(precoDoPlanoPersonalizadoNoCatalogo(catalog, ["nada"]).selectedModules.length, 0);
  assert.equal(resolverPlanoNoCatalogo(catalog, "custom", ["nada"]), null);
  assert.equal(resolverPlanoNoCatalogo(catalog, "custom", []), null);
  assert.equal(resolverPlanoNoCatalogo(catalog, "custom"), null);
});

test("o texto do desconto vem do que o código faz", () => {
  assert.equal(textoDoDescontoDoCombo(), "Com 3 recursos o plano ganha 15% de desconto. Com 5 ou mais, 25%.");
});
