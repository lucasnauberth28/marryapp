import { test } from "node:test";
import assert from "node:assert/strict";
import { computeLayout, isHeadTableName, roundRadius, MAX_CHAIRS, DECOR_HEAD_ID } from "../layout.ts";
import { canSeat, groupsOf, matchesName, occupancyByTable, seatColors, seatsOfGuest, type SeatGuest } from "../seating.ts";
import { SCENES, isSceneId } from "../scenarios.ts";

const mesas = (n: number, capacity = 10) => Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, name: `Mesa ${i + 1}`, capacity }));

test("sem mesa dos noivos no painel, o cenário desenha uma cabeceira de enfeite que não recebe convidados", () => {
  const l = computeLayout("jardim", mesas(3));
  assert.equal(l.slots[0].id, DECOR_HEAD_ID);
  assert.equal(l.slots[0].decor, true);
  assert.equal(l.slots[0].cap, 0);
  assert.equal(l.slots.length, 4);
});

test("uma mesa chamada dos noivos vira a cabeceira e continua recebendo convidados", () => {
  assert.ok(isHeadTableName("Mesa dos Noivos"));
  assert.ok(isHeadTableName("Mesa principal"));
  assert.ok(!isHeadTableName("Mesa 7"));
  const l = computeLayout("classico", [{ id: "a", name: "Mesa dos noivos", capacity: 6 }, ...mesas(2)]);
  assert.equal(l.slots[0].id, "a");
  assert.equal(l.slots[0].decor, false);
  assert.equal(l.slots[0].cap, 6);
  assert.equal(l.slots.length, 3);
});

test("as mesas preenchem de dentro para fora e alternam os lados (simétrico)", () => {
  const l = computeLayout("jardim", mesas(4));
  const xs = l.slots.slice(1).map((s) => s.x);
  assert.deepEqual(xs, [-9, 9, -14.5, 14.5]);
  const six = computeLayout("jardim", mesas(6)).slots.slice(1);
  assert.deepEqual(six.map((s) => [s.x, s.z]), [[-9, -1], [9, -1], [-14.5, -1], [14.5, -1], [-9, 5.5], [9, 5.5]]);
});

test("nenhuma mesa cai em cima da outra, em qualquer cenário, mesmo com muitas mesas", () => {
  for (const scene of SCENES) {
    const l = computeLayout(scene.id, mesas(30, 12));
    const g = l.slots.filter((s) => !s.noivos);
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++) assert.ok(g[i].x !== g[j].x || g[i].z !== g[j].z, `${scene.id} ${g[i].id}/${g[j].id}`);
    assert.ok(l.sala[1] >= scene.sala[1]);
    const lastZ = Math.max(...g.map((s) => s.z));
    assert.ok(l.sala[1] / 2 > lastZ + 3, `${scene.id}: a sala precisa passar da última fileira`);
  }
});

test("mesa grande tem tampo maior e cadeiras limitadas", () => {
  assert.ok(roundRadius(12) > roundRadius(8));
  assert.equal(roundRadius(8), 0.97);
  const l = computeLayout("jardim", [{ id: "x", name: "Galera", capacity: 80 }]);
  assert.equal(l.slots[1].cap, 80);
  assert.equal(l.slots[1].cadeiras, MAX_CHAIRS);
});

test("cenário desconhecido cai no primeiro e só ids conhecidos valem", () => {
  assert.equal(computeLayout("nao-existe", mesas(1)).scene.id, "jardim");
  assert.ok(isSceneId("rustico"));
  assert.ok(!isSceneId("praia"));
});

const g = (id: string, name: string, tableId: string | null, seats = 1, category: string | null = "Amigos"): SeatGuest => ({ id, name, category, seats, tableId });

test("lugares do convidado contam os acompanhantes, e a mesa só aceita o que cabe", () => {
  assert.equal(seatsOfGuest(0), 1);
  assert.equal(seatsOfGuest(2), 3);
  const guests = [g("1", "Ana", "t1", 3), g("2", "Bia", "t1", 1), g("3", "Caio", null, 2)];
  const occ = occupancyByTable(["t1", "t2"], guests);
  assert.equal(occ.t1.used, 4);
  assert.equal(canSeat(5, occ.t1, guests[2], "t1"), false);
  assert.equal(canSeat(6, occ.t1, guests[2], "t1"), true);
  // quem já está na mesa não conta duas vezes
  assert.equal(canSeat(4, occ.t1, guests[0], "t1"), true);
});

test("cada categoria ganha uma cor e as cadeiras ocupadas seguem a cor do grupo", () => {
  const guests = [g("1", "Ana", "t1", 2, "Família"), g("2", "Bia", "t1", 1, null), g("3", "Caio", "t1", 1, "Amigos")];
  const groups = groupsOf(guests);
  assert.deepEqual(groups.map((x) => x.label), ["Amigos", "Família", "Sem grupo"]);
  const occ = occupancyByTable(["t1"], guests);
  const colors = seatColors(occ.t1, groups, 10);
  assert.equal(colors.length, 4);
  assert.equal(colors[0], colors[1]);
  assert.notEqual(colors[1], colors[2]);
  assert.equal(seatColors(occ.t1, groups, 3).length, 3);
});

test("a busca ignora acento, maiúscula e ordem das palavras", () => {
  assert.ok(matchesName("Sônia Duarte", "sonia"));
  assert.ok(matchesName("Vera Lúcia Cunha", "cunha vera"));
  assert.ok(!matchesName("Ana", "bia"));
  assert.ok(!matchesName("Ana", "  "));
});
