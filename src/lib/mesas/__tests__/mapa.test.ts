import { test } from "node:test";
import assert from "node:assert/strict";

import { acharConvidados, cadeirasDaMesa, mesasPorFileira, montarPlanta, RAIO_DA_MESA } from "../mapa.ts";

const mesa = (i: number, capacity = 8, occupied = 0) => ({ id: `m${i}`, name: `Mesa ${i}`, capacity, occupied });

test("sem mesas, a planta é só a margem; com uma, ela fica no centro", () => {
  const vazia = montarPlanta([]);
  assert.equal(vazia.mesas.length, 0);
  assert.ok(vazia.largura > 0 && vazia.altura > 0);
  const uma = montarPlanta([mesa(1)]);
  assert.equal(uma.mesas[0].x, uma.largura / 2);
  assert.equal(uma.mesas[0].number, 1);
});

test("as mesas entram em fileiras, na ordem, sem se sobrepor", () => {
  const planta = montarPlanta(Array.from({ length: 11 }, (_, i) => mesa(i + 1)));
  assert.deepEqual(planta.mesas.map((m) => m.number), Array.from({ length: 11 }, (_, i) => i + 1));
  for (const a of planta.mesas) {
    assert.ok(a.x - RAIO_DA_MESA >= 0 && a.x + RAIO_DA_MESA <= planta.largura, "dentro da largura");
    assert.ok(a.y + RAIO_DA_MESA <= planta.altura, "dentro da altura");
    for (const b of planta.mesas) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= RAIO_DA_MESA * 2, `${a.number} e ${b.number} se sobrepõem`);
  }
});

test("a última fileira incompleta fica centralizada", () => {
  const planta = montarPlanta(Array.from({ length: 5 }, (_, i) => mesa(i + 1)));
  const porFileira = mesasPorFileira(5);
  const ultima = planta.mesas.slice(Math.floor(4 / porFileira) * porFileira);
  const media = ultima.reduce((s, m) => s + m.x, 0) / ultima.length;
  assert.ok(Math.abs(media - planta.largura / 2) < 0.001);
});

test("cadeiras: uma por lugar, ocupadas primeiro; o excedente vira cadeira extra", () => {
  const cadeiras = cadeirasDaMesa(100, 100, 8, 3);
  assert.equal(cadeiras.length, 8);
  assert.deepEqual(cadeiras.map((c) => c.ocupada), [true, true, true, false, false, false, false, false]);
  assert.ok(cadeiras.every((c) => !c.excedente));
  const cheia = cadeirasDaMesa(100, 100, 4, 6);
  assert.equal(cheia.length, 6);
  assert.equal(cheia.filter((c) => c.excedente).length, 2);
  assert.ok(Math.abs(cadeiras[0].x - 100) < 0.001 && cadeiras[0].y < 100, "a primeira fica no topo");
});

test("busca por nome: sem acento, sem maiúscula, várias palavras e só a partir de 2 letras", () => {
  const lista = [{ name: "João Álvares" }, { name: "Joana Souza" }, { name: "Maria Alves" }];
  assert.deepEqual(acharConvidados(lista, "joao"), [{ name: "João Álvares" }]);
  assert.deepEqual(acharConvidados(lista, "JOAN SOUZ"), [{ name: "Joana Souza" }]);
  assert.deepEqual(acharConvidados(lista, "alv").map((c) => c.name), ["João Álvares", "Maria Alves"].filter((n) => /alv/i.test(n.normalize("NFD").replace(/[̀-ͯ]/g, ""))));
  assert.deepEqual(acharConvidados(lista, "j"), []);
  assert.deepEqual(acharConvidados(lista, "  "), []);
  assert.equal(acharConvidados(Array.from({ length: 20 }, (_, i) => ({ name: `Ana ${i}` })), "ana").length, 8);
});
