import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MIN_CHARGE_CENTS,
  couponDiscount,
  couponProblem,
  normalizeCouponCode,
  priceBreakdown,
  type CouponRules,
} from "../checkout-pricing.ts";

const now = new Date("2026-10-09T12:00:00Z");
const base: CouponRules = {
  active: true,
  expiresAt: null,
  maxRedemptions: null,
  redemptions: 0,
  planIds: null,
  percentOff: 10,
  amountOff: null,
};

test("código do cupom: maiúsculas e formato", () => {
  assert.equal(normalizeCouponCode("  bemvindo10 "), "BEMVINDO10");
  assert.equal(normalizeCouponCode("noivos-2026"), "NOIVOS-2026");
  assert.equal(normalizeCouponCode("ab"), null);
  assert.equal(normalizeCouponCode("com espaço"), null);
  assert.equal(normalizeCouponCode(42), null);
});

test("cupom válido não tem problema", () => {
  assert.equal(couponProblem(base, "classic", now), null);
});

test("cupom inativo, vencido, esgotado ou de outro plano", () => {
  assert.equal(couponProblem({ ...base, active: false }, "classic", now), "inactive");
  assert.equal(couponProblem({ ...base, expiresAt: new Date("2026-10-09T11:59:59Z") }, "classic", now), "expired");
  assert.equal(couponProblem({ ...base, expiresAt: new Date("2026-10-10T00:00:00Z") }, "classic", now), null);
  assert.equal(couponProblem({ ...base, maxRedemptions: 3, redemptions: 3 }, "classic", now), "exhausted");
  assert.equal(couponProblem({ ...base, maxRedemptions: 3, redemptions: 2 }, "classic", now), null);
  assert.equal(couponProblem({ ...base, planIds: ["pro", "master"] }, "classic", now), "plan");
  assert.equal(couponProblem({ ...base, planIds: ["pro", "master"] }, "pro", now), null);
  assert.equal(couponProblem({ ...base, planIds: [] }, "vip", now), null);
  assert.equal(couponProblem({ ...base, percentOff: null, amountOff: null }, "vip", now), "no_value");
});

test("desconto percentual arredonda para baixo", () => {
  assert.equal(couponDiscount(14900, { percentOff: 10, amountOff: null }), 1490);
  assert.equal(couponDiscount(9999, { percentOff: 15, amountOff: null }), 1499); // 1499,85
});

test("desconto fixo em centavos", () => {
  assert.equal(couponDiscount(24900, { percentOff: null, amountOff: 5000 }), 5000);
});

test("cobrança nunca fica abaixo do mínimo", () => {
  assert.equal(couponDiscount(9900, { percentOff: 100, amountOff: null }), 9900 - MIN_CHARGE_CENTS);
  assert.equal(couponDiscount(9900, { percentOff: null, amountOff: 50000 }), 9900 - MIN_CHARGE_CENTS);
  assert.equal(couponDiscount(MIN_CHARGE_CENTS, { percentOff: 50, amountOff: null }), 0);
});

test("resumo do preço: sem crédito nem cupom", () => {
  assert.deepEqual(priceBreakdown({ price: 14900 }), { price: 14900, credit: 0, discount: 0, total: 14900 });
});

test("resumo do preço: cupom sobre o valor depois do crédito", () => {
  const r = priceBreakdown({ price: 24900, credit: 4950, coupon: { percentOff: 10, amountOff: null } });
  assert.deepEqual(r, { price: 24900, credit: 4950, discount: 1995, total: 17955 });
});

test("resumo do preço: crédito e cupom juntos respeitam o mínimo", () => {
  const r = priceBreakdown({ price: 24900, credit: 24000, coupon: { percentOff: null, amountOff: 5000 } });
  assert.equal(r.total, MIN_CHARGE_CENTS);
  assert.equal(r.price - r.credit - r.discount, r.total);
  const capped = priceBreakdown({ price: 24900, credit: 99999 });
  assert.equal(capped.credit, 24900 - MIN_CHARGE_CENTS);
  assert.equal(capped.total, MIN_CHARGE_CENTS);
});
