import { test } from "node:test";
import assert from "node:assert/strict";
import { MAXIMO_DE_FOTOS_DA_GALERIA, MODELOS_DO_SITE, ehIdDeModelo, fotosDaGaleria, modeloDoSite, textoDaGaleria } from "../../components/public/site-do-casamento/modelos/catalogo.ts";
import { corDoTextoSobre, destaqueParaFundoEscuro, estiloDoModelo, variaveisDoModelo } from "../../components/public/site-do-casamento/modelos/estilo.ts";

test("são oito modelos, cada um com id único e cores em hexadecimal", () => {
  assert.equal(MODELOS_DO_SITE.length, 8);
  assert.equal(new Set(MODELOS_DO_SITE.map((m) => m.id)).size, 8);
  for (const m of MODELOS_DO_SITE) {
    for (const cor of [m.destaque, ...Object.values(m.paleta)]) assert.match(cor, /^#[0-9A-F]{6}$/i, `${m.id}: ${cor}`);
  }
});

test("id desconhecido ou vazio cai no modelo clássico", () => {
  assert.equal(modeloDoSite("nao-existe").id, "classico");
  assert.equal(modeloDoSite(null).id, "classico");
  assert.equal(modeloDoSite("noturno").id, "noturno");
  assert.ok(ehIdDeModelo("campo"));
  assert.ok(!ehIdDeModelo("campo "));
  assert.ok(!ehIdDeModelo(42));
});

test("a galeria lê só endereços de texto, sem repetir, até o máximo", () => {
  assert.deepEqual(fotosDaGaleria(null), []);
  assert.deepEqual(fotosDaGaleria("não é json"), []);
  assert.deepEqual(fotosDaGaleria('{"a":1}'), []);
  assert.deepEqual(fotosDaGaleria('["https://a/1.jpg"," https://a/1.jpg ", 7, "", "https://a/2.jpg"]'), ["https://a/1.jpg", "https://a/2.jpg"]);
  const muitas = JSON.stringify(Array.from({ length: 20 }, (_, i) => `https://a/${i}.jpg`));
  assert.equal(fotosDaGaleria(muitas).length, MAXIMO_DE_FOTOS_DA_GALERIA);
  assert.equal(fotosDaGaleria(textoDaGaleria(["https://a/1.jpg"])).length, 1);
});

test("o texto sobre a cor de destaque tem contraste: claro no escuro e escuro no claro", () => {
  assert.equal(corDoTextoSobre("#111111"), "#FFFFFF");
  assert.equal(corDoTextoSobre("#5E2B4E"), "#FFFFFF");
  assert.equal(corDoTextoSobre("#C9A86A"), "#17110C");
  assert.equal(corDoTextoSobre("sem cor"), "#FFFFFF");
});

test("o estilo do modelo troca as cores da página e deixa a cor de destaque para o casal", () => {
  const estilo = estiloDoModelo("noturno", destaqueParaFundoEscuro("#C9A86A")) as Record<string, string>;
  assert.equal(estilo["--color-linho"], "#0F0C0A");
  assert.equal(estilo["--color-tinta"], "#F1E8DC");
  assert.equal(estilo["--color-ameixa"], "#C9A86A");
  assert.equal(estilo["--color-on-ameixa"], "#17110C");
  assert.match(estilo["--font-display"], /cormorant/);
});

test("o modelo clássico mantém a letra padrão do Aceito", () => {
  assert.equal(variaveisDoModelo(modeloDoSite("classico"))["--font-display"], undefined);
});
