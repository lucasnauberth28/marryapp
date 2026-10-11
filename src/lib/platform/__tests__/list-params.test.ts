import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHref, oneOf, pageNumbers, pageWindow, param, parsePage } from "../list-params.ts";

test("lê parâmetros da URL com limite e sem lixo", () => {
  assert.equal(param({ q: "  ana  " }, "q"), "ana");
  assert.equal(param({ q: ["a", "b"] }, "q"), "a");
  assert.equal(param({ q: "" }, "q"), undefined);
  assert.equal(param({}, "q"), undefined);
  assert.equal(param({ q: "x".repeat(500) }, "q")?.length, 100);
  assert.equal(oneOf({ aba: "problema" }, "aba", ["todos", "problema"] as const), "problema");
  assert.equal(oneOf({ aba: "hack" }, "aba", ["todos", "problema"] as const), undefined);
});

test("página: valor ruim vira 1 e a janela respeita o total", () => {
  assert.equal(parsePage({ pagina: "3" }), 3);
  for (const bad of ["0", "-2", "abc", "1.5x", "999999999", ""]) assert.equal(parsePage({ pagina: bad }), bad === "1.5x" ? 1 : 1, bad);
  assert.deepEqual(pageWindow(2, 25, 100), { page: 2, skip: 25, take: 25, pages: 4 });
  assert.deepEqual(pageWindow(9, 25, 100), { page: 4, skip: 75, take: 25, pages: 4 });
  assert.deepEqual(pageWindow(1, 25, 0), { page: 1, skip: 0, take: 25, pages: 1 });
  assert.equal(pageWindow(3, 10).skip, 20);
});

test("monta o endereço mantendo só o que tem valor", () => {
  assert.equal(buildHref("/admin/casais", {}), "/admin/casais");
  assert.equal(buildHref("/admin/casais", { aba: "problema", q: "ana ribeiro", pagina: undefined, plano: "" }), "/admin/casais?aba=problema&q=ana+ribeiro");
  assert.equal(buildHref("/admin/casais", { pagina: 2 }), "/admin/casais?pagina=2");
});

test("números da paginação", () => {
  assert.deepEqual(pageNumbers(1, 1), [1]);
  assert.deepEqual(pageNumbers(2, 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(pageNumbers(1, 12), [1, 2, 3, "...", 12]);
  assert.deepEqual(pageNumbers(6, 12), [1, "...", 5, 6, 7, "...", 12]);
  assert.deepEqual(pageNumbers(12, 12), [1, "...", 10, 11, 12]);
});
