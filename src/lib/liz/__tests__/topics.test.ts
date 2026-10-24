import { test } from "node:test";
import assert from "node:assert/strict";
import { HELP_ARTICLES } from "../help-articles.ts";
import { visibleArticles } from "../help-search.ts";
import { LIZ_TOPICS, articlesWithoutTopic, topicOfArticle, topicsFor } from "../topics.ts";

test("todo artigo do guia pertence a um assunto só, e todo assunto cita artigos que existem", () => {
  assert.deepEqual(articlesWithoutTopic(), []);
  const ids = new Set(HELP_ARTICLES.map((a) => a.id));
  for (const t of LIZ_TOPICS) for (const id of t.articleIds) assert.ok(ids.has(id), `${t.id}: ${id}`);
});

test("quem só abre convidados e mesas não vê assuntos de outras telas", () => {
  const visible = visibleArticles(HELP_ARTICLES, { allowedPaths: ["/convidados", "/mesas"] });
  const topics = topicsFor(visible).map((t) => t.topic.id);
  assert.ok(topics.includes("convidados") && topics.includes("mesas"));
  assert.ok(!topics.includes("presentes") && !topics.includes("site"));
});

test("as mesas em 3D aparecem no assunto Mesas, marcadas como do plano VIP quando o plano não inclui", () => {
  const visible = visibleArticles(HELP_ARTICLES, { allowedPaths: ["*"], planModules: { tables3d: false } });
  const mesas = topicsFor(visible).find((t) => t.topic.id === "mesas")!;
  const hit = mesas.hits.find((h) => h.article.id === "mesas-3d")!;
  assert.equal(hit.locked, true);
  assert.equal(topicOfArticle("mesas-3d")?.id, "mesas");
});
