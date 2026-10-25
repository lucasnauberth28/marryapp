import { test } from "node:test";
import assert from "node:assert/strict";
import { ARTIGOS_DE_AJUDA } from "../help-articles.ts";
import { artigosVisiveis } from "../help-search.ts";
import { ASSUNTOS_DA_LIZ, artigosSemAssunto, assuntoDoArtigo, assuntosPara } from "../topics.ts";

test("todo artigo do guia pertence a um assunto só, e todo assunto cita artigos que existem", () => {
  assert.deepEqual(artigosSemAssunto(), []);
  const ids = new Set(ARTIGOS_DE_AJUDA.map((a) => a.id));
  for (const t of ASSUNTOS_DA_LIZ) for (const id of t.articleIds) assert.ok(ids.has(id), `${t.id}: ${id}`);
});

test("quem só abre convidados e mesas não vê assuntos de outras telas", () => {
  const visible = artigosVisiveis(ARTIGOS_DE_AJUDA, { allowedPaths: ["/convidados", "/mesas"] });
  const topics = assuntosPara(visible).map((t) => t.topic.id);
  assert.ok(topics.includes("convidados") && topics.includes("mesas"));
  assert.ok(!topics.includes("presentes") && !topics.includes("site"));
});

test("as mesas em 3D aparecem no assunto Mesas, marcadas como do plano VIP quando o plano não inclui", () => {
  const visible = artigosVisiveis(ARTIGOS_DE_AJUDA, { allowedPaths: ["*"], planModules: { tables3d: false } });
  const mesas = assuntosPara(visible).find((t) => t.topic.id === "mesas")!;
  const hit = mesas.hits.find((h) => h.article.id === "mesas-3d")!;
  assert.equal(hit.locked, true);
  assert.equal(assuntoDoArtigo("mesas-3d")?.id, "mesas");
});
