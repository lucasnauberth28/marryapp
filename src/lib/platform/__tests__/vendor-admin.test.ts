import { test } from "node:test";
import assert from "node:assert/strict";
import { curationView, galleryPhotos, grantedPlanEnd, isPaidActive, parseRegions, planExpiryTone, rejectionMessageFor, vitrineRank } from "../vendor-admin.ts";

const NOW = new Date("2026-10-11T15:00:00Z");

test("suspenso tem precedência sobre a curadoria", () => {
  assert.equal(curationView({ curationStatus: "APPROVED", suspendedAt: new Date() }), "suspended");
  assert.equal(curationView({ curationStatus: "REJECTED", suspendedAt: new Date() }), "suspended");
  assert.equal(curationView({ curationStatus: "APPROVED", suspendedAt: null }), "approved");
  assert.equal(curationView({ curationStatus: "REJECTED", suspendedAt: null }), "adjust");
  assert.equal(curationView({ curationStatus: "PENDING_APPROVAL", suspendedAt: null }), "pending");
});

test("motivos prontos têm mensagem, exceto 'outro'", () => {
  assert.match(rejectionMessageFor("price"), /preço inicial/);
  assert.equal(rejectionMessageFor("other"), "");
  assert.equal(rejectionMessageFor("inexistente"), "");
});

test("regiões e galeria em texto JSON nunca quebram", () => {
  assert.deepEqual(parseRegions('["Campinas"," Grande SP ",3,""]'), ["Campinas", "Grande SP"]);
  assert.deepEqual(parseRegions("não é json"), []);
  assert.deepEqual(parseRegions(null), []);
  assert.deepEqual(galleryPhotos('["https://a/1.jpg","http://x/2.jpg","https://a/3.jpg","https://a/4.jpg","https://a/5.jpg"]', null), ["https://a/1.jpg", "https://a/3.jpg", "https://a/4.jpg"]);
  assert.deepEqual(galleryPhotos(null, "https://a/capa.jpg"), ["https://a/capa.jpg"]);
  assert.deepEqual(galleryPhotos("[", "javascript:alert(1)"), []);
});

test("plano pago em vigor", () => {
  assert.equal(isPaidActive({ planTier: "PRO", planExpiresAt: new Date("2026-10-20T00:00:00Z") }, NOW), true);
  assert.equal(isPaidActive({ planTier: "PRO", planExpiresAt: null }, NOW), true);
  assert.equal(isPaidActive({ planTier: "PRO", planExpiresAt: new Date("2026-10-01T00:00:00Z") }, NOW), false);
  assert.equal(isPaidActive({ planTier: "FREE", planExpiresAt: null }, NOW), false);
});

test("vencimento perto destaca em até 7 dias", () => {
  assert.equal(planExpiryTone(null, NOW), "none");
  assert.equal(planExpiryTone(new Date("2026-10-17T00:00:00Z"), NOW), "soon");
  assert.equal(planExpiryTone(new Date("2026-11-30T00:00:00Z"), NOW), "normal");
});

test("plano cortesia: hoje mais N dias, sem encurtar um plano pago maior", () => {
  const thirty = new Date(NOW.getTime() + 30 * 86_400_000);
  assert.equal(grantedPlanEnd(NOW, 30, null, false).getTime(), thirty.getTime());
  const farAway = new Date("2027-03-01T00:00:00Z");
  assert.equal(grantedPlanEnd(NOW, 30, farAway, true).getTime(), farAway.getTime());
  assert.equal(grantedPlanEnd(NOW, 30, farAway, false).getTime(), thirty.getTime(), "troca de nível não herda a data do outro");
});

test("destaque na vitrine vem antes do plano, e a ordem é estável", () => {
  const items = [
    { name: "master", featured: false, tierRank: 2, index: 0 },
    { name: "free-destacado", featured: true, tierRank: 0, index: 1 },
    { name: "pro", featured: false, tierRank: 1, index: 2 },
    { name: "pro2", featured: false, tierRank: 1, index: 3 },
  ];
  assert.deepEqual([...items].sort(vitrineRank).map((i) => i.name), ["free-destacado", "master", "pro", "pro2"]);
});
