import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { LIZ_ASSETS, lizAssetSrc, lizTipPose, type LizPose } from "../pose.ts";
import { decideLizTip, type LizTipInput } from "../tip.ts";
import { dicaDeConfirmacaoUrgente } from "../../liz-tips.ts";

const base: LizTipInput = {
  pendingGuests: 0,
  deadlineKey: null,
  todayKey: "2027-03-06",
  weddingDays: null,
  notInvitedYet: 0,
  canWhatsApp: true,
  overdueExpenses: 0,
  overdueTasks: 0,
  allowedPaths: ["*"],
};
const poseOf = (over: Partial<LizTipInput>) => lizTipPose(decideLizTip({ ...base, ...over }));

test("sem sugestão a Liz fica tranquila", () => {
  assert.equal(poseOf({}), "tranquila");
});

test("próximo passo sem prazo apertado: sugerindo", () => {
  assert.equal(poseOf({ notInvitedYet: 3 }), "sugerindo");
  assert.equal(poseOf({ pendingGuests: 5 }), "sugerindo");
  assert.equal(poseOf({ pendingGuests: 5, deadlineKey: "2027-04-30" }), "sugerindo");
  assert.equal(poseOf({ pendingGuests: 5, weddingDays: 60 }), "sugerindo");
});

test("motivo de prazo (vencido, hoje ou perto) pede atenção", () => {
  assert.equal(poseOf({ pendingGuests: 5, deadlineKey: "2027-03-01" }), "atencao");
  assert.equal(poseOf({ pendingGuests: 5, deadlineKey: "2027-03-06" }), "atencao");
  assert.equal(poseOf({ pendingGuests: 5, deadlineKey: "2027-03-13" }), "atencao");
  assert.equal(poseOf({ pendingGuests: 5, weddingDays: 7 }), "atencao");
  assert.equal(poseOf({ overdueExpenses: 1 }), "atencao");
  assert.equal(poseOf({ overdueTasks: 2 }), "atencao");
});

test("prazo do casal manda sobre a data do casamento, como no texto", () => {
  // Prazo longe, casamento perto: o texto cita o prazo, então a pose segue o prazo
  assert.equal(dicaDeConfirmacaoUrgente({ deadlineKey: "2027-03-14", todayKey: "2027-03-06", weddingDays: 3 }), false);
  assert.equal(dicaDeConfirmacaoUrgente({ deadlineKey: null, todayKey: "2027-03-06", weddingDays: 8 }), false);
  // Casamento que já passou não é prazo
  assert.equal(dicaDeConfirmacaoUrgente({ deadlineKey: null, todayKey: "2027-03-06", weddingDays: -1 }), false);
});

test("arquivo pela largura pedida: o menor que cobre, senão o maior", () => {
  assert.equal(lizAssetSrc("rosto", 64), "/brand/liz/rosto-112.webp");
  assert.equal(lizAssetSrc("rosto", 128), "/brand/liz/rosto-168.webp");
  assert.equal(lizAssetSrc("sugerindo", 96), "/brand/liz/sugerindo-128.webp");
  assert.equal(lizAssetSrc("sugerindo", 640), "/brand/liz/sugerindo-256.webp");
});

test("todo arquivo listado existe em public/brand/liz", () => {
  const root = new URL("../../../../public", import.meta.url);
  for (const pose of Object.keys(LIZ_ASSETS) as LizPose[]) {
    for (const w of LIZ_ASSETS[pose].widths) {
      const path = new URL(`.${lizAssetSrc(pose, w)}`, `${root.href}/`);
      assert.ok(existsSync(path), `falta ${path.pathname}`);
    }
  }
});
