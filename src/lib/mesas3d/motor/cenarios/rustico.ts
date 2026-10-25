// Cenário rústico: celeiro de madeira com vigas, portão ao fundo, luzes no teto, barris e fardos de feno.
import * as THREE from "three";
import { cordaoDeLuzes, marcarBrilho } from "../decoracao.ts";
import { materialPadrao } from "../materiais.ts";
import { adicionar, caixa, instanciar } from "../pecas.ts";
import { texturaDeTabuas } from "../texturas.ts";
import type { ContextoDoMotor, InstanciaDeMalha } from "../tipos.ts";

const ALTURA = 8;

function pisoEParedes(ctx: ContextoDoMotor, W: number, D: number) {
  const chao = texturaDeTabuas(ctx.texturas, "piso_r", true, [[122, 90, 64], [150, 114, 82]], 8, W / 8, D / 8);
  const madeiraDaParede = texturaDeTabuas(ctx.texturas, "parede_r", false, [[104, 74, 52], [128, 94, 66]], 8, 6, 2);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(W, D), materialPadrao("#ffffff", 0.62, { map: chao.map, bumpMap: chao.bump, bumpScale: 0.6, envMapIntensity: 0.5 }));
  piso.rotation.x = -Math.PI / 2;
  chao.map.repeat.set(W / 8, D / 8);
  chao.bump.repeat.set(W / 8, D / 8);
  adicionar(ctx, piso, false, true);
  const parede = materialPadrao("#ffffff", 0.85, { map: madeiraDaParede.map, bumpMap: madeiraDaParede.bump, bumpScale: 0.6, envMapIntensity: 0.3 });
  caixa(ctx, W, ALTURA, 0.4, parede, 0, ALTURA / 2, -D / 2, false, true);
  caixa(ctx, 0.4, ALTURA, D, parede, -W / 2, ALTURA / 2, 0, false, true);
  caixa(ctx, 0.4, ALTURA, D, parede, W / 2, ALTURA / 2, 0, false, true);
}

function vigas(ctx: ContextoDoMotor, W: number, D: number) {
  const viga = materialPadrao("#3E2C20", 0.85);
  for (let x = -W / 2 + 4; x <= W / 2 - 3; x += 6) caixa(ctx, 0.5, 0.6, D, viga, x, ALTURA - 0.4, 0, true);
  for (let z = -D / 2 + 3; z <= D / 2; z += 7) caixa(ctx, W, 0.4, 0.4, viga, 0, ALTURA - 1.1, z, true);
}

/** Portão de celeiro ao fundo, com as travessas em X. */
function portaoDoCeleiro(ctx: ContextoDoMotor, D: number) {
  const viga = materialPadrao("#3E2C20", 0.85), portao = materialPadrao("#2E2019", 0.8);
  caixa(ctx, 5.2, 5.4, 0.2, portao, -2.7, 2.7, -D / 2 + 0.3, false, true);
  caixa(ctx, 5.2, 5.4, 0.2, portao, 2.7, 2.7, -D / 2 + 0.3, false, true);
  for (const px of [-2.7, 2.7]) {
    for (const d of [-1, 1]) {
      const travessa = caixa(ctx, 0.18, 6.4, 0.1, viga, px, 2.7, -D / 2 + 0.45, false, true);
      travessa.rotation.z = d * 0.77;
    }
    caixa(ctx, 5.2, 0.2, 0.1, viga, px, 4.6, -D / 2 + 0.45, false, true);
    caixa(ctx, 5.2, 0.2, 0.1, viga, px, 0.9, -D / 2 + 0.45, false, true);
  }
}

function luzesDoTeto(ctx: ContextoDoMotor, W: number, D: number) {
  const trechos: [number[], number[], number][] = [];
  for (let q = -D / 2 + 4; q <= D / 2 - 2; q += 5) trechos.push([[-W / 2 + 1, ALTURA - 1.3, q], [W / 2 - 1, ALTURA - 1.3, q], 1.1]);
  trechos.push([[-W / 2 + 1, ALTURA - 1.3, -D / 2 + 2], [W / 2 - 1, ALTURA - 1.3, D / 2 - 2], 1.2], [[W / 2 - 1, ALTURA - 1.3, -D / 2 + 2], [-W / 2 + 1, ALTURA - 1.3, D / 2 - 2], 1.2]);
  cordaoDeLuzes(ctx, trechos);
}

function barrisEFenos(ctx: ContextoDoMotor, W: number, D: number) {
  const barris: InstanciaDeMalha[] = [];
  for (let b = 0; b < 6; b++) barris.push({ x: -W / 2 + 2.2 + (b % 3) * 1.3, y: 0.55, z: D / 2 - 3 - Math.floor(b / 3) * 1.4 });
  instanciar(ctx, new THREE.CylinderGeometry(0.5, 0.45, 1.1, 18), materialPadrao("#6A4429", 0.7), barris, true);
  instanciar(ctx, new THREE.TorusGeometry(0.48, 0.02, 6, 24), materialPadrao("#2B2527", 0.4, { metalness: 0.6 }), barris.map((p) => ({ x: p.x, y: p.y + 0.3, z: p.z, rx: Math.PI / 2 })), false);
  const fenos: InstanciaDeMalha[] = [];
  for (let f = 0; f < 5; f++) fenos.push({ x: W / 2 - 2.5 - (f % 3) * 1.1, y: 0.3 + Math.floor(f / 3) * 0.6, z: D / 2 - 3 });
  instanciar(ctx, new THREE.BoxGeometry(1, 0.6, 0.6), materialPadrao("#D8B96A", 0.95), fenos, true);
}

function palcoEPendentes(ctx: ContextoDoMotor, D: number) {
  caixa(ctx, 8, 0.5, 3.2, materialPadrao("#5E4330", 0.8), 0, 0.25, -D / 2 + 2.4 + 0.8, true, true);
  const pendentes: InstanciaDeMalha[] = [];
  for (const x of [-8, 0, 8])
    for (const z of [-3, 4]) {
      pendentes.push({ x, y: ALTURA - 2.6, z });
      marcarBrilho(ctx, x, ALTURA - 2.9, z);
    }
  const metal = materialPadrao("#2B2527", 0.5);
  instanciar(ctx, new THREE.CylinderGeometry(0.02, 0.02, 2.2, 5), metal, pendentes.map((p) => ({ x: p.x, y: ALTURA - 1.4, z: p.z })), false);
  instanciar(ctx, new THREE.ConeGeometry(0.4, 0.4, 16, 1, true), materialPadrao("#2B2527", 0.5, { side: THREE.DoubleSide, metalness: 0.4 }), pendentes.map((p) => ({ x: p.x, y: p.y - 0.1, z: p.z })), true);
}

export function montarCeleiroRustico(ctx: ContextoDoMotor, sala: [number, number]) {
  const W = sala[0], D = sala[1];
  pisoEParedes(ctx, W, D);
  vigas(ctx, W, D);
  portaoDoCeleiro(ctx, D);
  luzesDoTeto(ctx, W, D);
  barrisEFenos(ctx, W, D);
  palcoEPendentes(ctx, D);
}
