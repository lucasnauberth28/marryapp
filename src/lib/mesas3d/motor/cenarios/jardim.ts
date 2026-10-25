// Cenário do jardim: céu pintado, gramado, deque com pergolado, árvores e flores.
import * as THREE from "three";
import type { DefinicaoDoCenario } from "../../scenarios.ts";
import { cordaoDeLuzes, marcarBrilho, plantarArvores } from "../decoracao.ts";
import { montarArco } from "../festa.ts";
import { materialPadrao } from "../materiais.ts";
import { adicionar, caixa, giroAleatorio, instanciar, numeroAleatorio } from "../pecas.ts";
import { texturaDaGrama, texturaDeTabuas, texturaDoCeu } from "../texturas.ts";
import type { ContextoDoMotor, InstanciaDeMalha } from "../tipos.ts";

const VOLTA_COMPLETA = Math.PI * 2;

function ceuEGramado(ctx: ContextoDoMotor, c: DefinicaoDoCenario) {
  const grama = texturaDaGrama(ctx.texturas);
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: texturaDoCeu(ctx.texturas, c), side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false }));
  ctx.raiz.add(ceu);
  const gramado = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), materialPadrao("#ffffff", 1, { map: grama.map, bumpMap: grama.bump, bumpScale: 0.2, envMapIntensity: 0.3 }));
  gramado.rotation.x = -Math.PI / 2;
  adicionar(ctx, gramado, false, true);
}

function dequeEPergolado(ctx: ContextoDoMotor) {
  const deque = texturaDeTabuas(ctx.texturas, "deque", false, [[160, 120, 82], [190, 148, 104]], 8, 3, 2.5);
  caixa(ctx, 12.4, 0.12, 10.4, materialPadrao("#ffffff", 0.72, { map: deque.map, bumpMap: deque.bump, bumpScale: 0.5 }), 0, 0.06, 5, false, true);
  const madeira = materialPadrao("#F1EBE1", 0.62);
  for (const p of [[-6, 0], [6, 0], [-6, 10], [6, 10]]) caixa(ctx, 0.3, 4.2, 0.3, madeira, p[0], 2.1, p[1], true);
  for (const z of [0, 10]) caixa(ctx, 12.6, 0.28, 0.3, madeira, 0, 4.2, z, true);
  for (let i = -5; i <= 5; i += 1.25) caixa(ctx, 0.16, 0.16, 10.6, madeira, i, 4.4, 5, true);
}

function luzesDoPergolado(ctx: ContextoDoMotor) {
  cordaoDeLuzes(ctx, [[[-6, 4.1, 0], [6, 4.1, 10], 0.6], [[6, 4.1, 0], [-6, 4.1, 10], 0.6], [[-6, 4.1, 5], [6, 4.1, 5], 0.8], [[-6, 4.1, 2.5], [6, 4.1, 2.5], 0.7], [[-6, 4.1, 7.5], [6, 4.1, 7.5], 0.7]]);
  const lanternas: InstanciaDeMalha[] = [];
  for (const p of [[-6, 1], [6, 1], [-6, 9], [6, 9]]) lanternas.push({ x: p[0] * 0.98, y: 3.2, z: p[1] });
  instanciar(ctx, new THREE.CylinderGeometry(0.11, 0.11, 0.3, 10), materialPadrao("#2b2527", 0.5, { metalness: 0.4 }), lanternas, true);
  lanternas.forEach((p) => marcarBrilho(ctx, p.x, p.y, p.z));
}

function arvoredo(ctx: ContextoDoMotor, sala: [number, number]) {
  const aleatorio = () => numeroAleatorio(ctx);
  const W = sala[0], D = sala[1], posicoes: number[][] = [];
  for (let a = 0; a < 34; a++) {
    const t = Math.PI * (1 + 1.18 * (a / 34)) - 0.09 * Math.PI, rx = W / 2 + 6 + aleatorio() * 9, rz = D / 2 + 3 + aleatorio() * 9;
    posicoes.push([Math.cos(t) * rx, Math.sin(t) * rz - 2]);
  }
  plantarArvores(ctx, posicoes, 1.15, ["#4A7545", "#5A8650", "#68934F", "#3F6B3D", "#7A9C58"]);
}

function floresDoGramado(ctx: ContextoDoMotor, c: DefinicaoDoCenario, sala: [number, number]) {
  const aleatorio = () => numeroAleatorio(ctx);
  const W = sala[0], D = sala[1], flores: InstanciaDeMalha[] = [], folhas: InstanciaDeMalha[] = [];
  for (let k = 0; k < 150; k++) {
    const tt = aleatorio() * VOLTA_COMPLETA, rr = W / 2 - 0.5 + aleatorio() * 2, fx = Math.cos(tt) * rr * 0.98, fz = Math.sin(tt) * (D / 2 - 1) - 2;
    flores.push({ x: fx, y: 0.28, z: fz, sx: 0.14 + aleatorio() * 0.1, cor: c.flores[(aleatorio() * 3) | 0] });
    folhas.push({ x: fx, y: 0.12, z: fz, sx: 0.3, sy: 0.12, sz: 0.3, ry: giroAleatorio(ctx), cor: "#58774A" });
  }
  instanciar(ctx, new THREE.SphereGeometry(1, 8, 6), materialPadrao("#ffffff", 0.8), flores, false);
  instanciar(ctx, new THREE.SphereGeometry(1, 8, 6), materialPadrao("#ffffff", 0.9), folhas, false);
}

export function montarJardim(ctx: ContextoDoMotor, c: DefinicaoDoCenario, sala: [number, number]) {
  ceuEGramado(ctx, c);
  dequeEPergolado(ctx);
  luzesDoPergolado(ctx);
  montarArco(ctx, 0, -12, 3.6, "#FFFFFF", c.flores, true);
  arvoredo(ctx, sala);
  floresDoGramado(ctx, c, sala);
}
