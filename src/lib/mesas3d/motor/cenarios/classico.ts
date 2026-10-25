// Cenário do salão clássico: piso de mármore, tablado de parquet, paredes com molduras, colunas, cortinas e lustres.
import * as THREE from "three";
import { montarLustre } from "../festa.ts";
import { materialPadrao } from "../materiais.ts";
import { adicionar, caixa, instanciar } from "../pecas.ts";
import { texturaDeMarmore, texturaDeParquet, texturaDeReboco } from "../texturas.ts";
import type { ContextoDoMotor, InstanciaDeMalha } from "../tipos.ts";

const ALTURA = 9;

function pisos(ctx: ContextoDoMotor, W: number, D: number) {
  const marmore = texturaDeMarmore(ctx.texturas), parquet = texturaDeParquet(ctx.texturas);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(W, D), materialPadrao("#ffffff", 0.2, { map: marmore.map, bumpMap: marmore.bump, bumpScale: 0.4, envMapIntensity: 1.1 }));
  piso.rotation.x = -Math.PI / 2;
  marmore.map.repeat.set(W / 3.6, D / 3.6);
  marmore.bump.repeat.set(W / 3.6, D / 3.6);
  adicionar(ctx, piso, false, true);
  const tablado = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), materialPadrao("#ffffff", 0.3, { map: parquet.map, bumpMap: parquet.bump, bumpScale: 0.5, envMapIntensity: 0.9 }));
  parquet.map.repeat.set(2.8, 2.2);
  parquet.bump.repeat.set(2.8, 2.2);
  tablado.rotation.x = -Math.PI / 2;
  tablado.position.set(0, 0.02, 4);
  adicionar(ctx, tablado, false, true);
}

function paredesEMolduras(ctx: ContextoDoMotor, W: number, D: number) {
  const reboco = texturaDeReboco(ctx.texturas, "reboco", [238, 229, 220], 8, 3);
  const parede = materialPadrao("#ffffff", 0.9, { map: reboco.map, bumpMap: reboco.bump, bumpScale: 0.08, envMapIntensity: 0.4 });
  caixa(ctx, W, ALTURA, 0.4, parede, 0, ALTURA / 2, -D / 2, false, true);
  caixa(ctx, 0.4, ALTURA, D, parede, -W / 2, ALTURA / 2, 0, false, true);
  caixa(ctx, 0.4, ALTURA, D, parede, W / 2, ALTURA / 2, 0, false, true);
  const moldura = materialPadrao("#F7F2EA", 0.55);
  caixa(ctx, W, 0.7, 0.18, moldura, 0, 0.35, -D / 2 + 0.28, false, true);
  caixa(ctx, 0.18, 0.7, D, moldura, -W / 2 + 0.28, 0.35, 0, false, true);
  caixa(ctx, 0.18, 0.7, D, moldura, W / 2 - 0.28, 0.35, 0, false, true);
  for (let z0 = -D / 2 + 2; z0 <= D / 2 - 2; z0 += 6) {
    caixa(ctx, 0.1, 3.4, 4, moldura, -W / 2 + 0.3, 2.6, z0 + 3, false, true);
    caixa(ctx, 0.1, 3.4, 4, moldura, W / 2 - 0.3, 2.6, z0 + 3, false, true);
  }
}

function colunas(ctx: ContextoDoMotor, W: number, D: number) {
  const posicoes: InstanciaDeMalha[] = [];
  for (const s of [-1, 1]) for (let z = -D / 2 + 3; z <= D / 2 - 2; z += 6) posicoes.push({ x: s * (W / 2 - 1.2), y: ALTURA / 2, z });
  const marmore = materialPadrao("#F6F0E8", 0.45, { envMapIntensity: 0.8 });
  instanciar(ctx, new THREE.CylinderGeometry(0.55, 0.62, ALTURA, 28), marmore, posicoes, true);
  instanciar(ctx, new THREE.BoxGeometry(1.5, 0.5, 1.5), marmore, posicoes.map((p) => ({ x: p.x, y: 0.25, z: p.z })), true);
  instanciar(ctx, new THREE.BoxGeometry(1.5, 0.5, 1.5), marmore, posicoes.map((p) => ({ x: p.x, y: ALTURA - 0.25, z: p.z })), true);
}

/** Cortinas de veludo com pregas de verdade, varão dourado e o palco ao fundo. */
function cortinasEPalco(ctx: ContextoDoMotor, W: number, D: number) {
  const geometria = new THREE.PlaneGeometry(2.4, ALTURA - 1.3, 60, 6), p = geometria.attributes.position;
  for (let q = 0; q < p.count; q++) p.setZ(q, Math.sin(p.getX(q) * 11) * 0.16 + Math.sin(p.getX(q) * 27) * 0.04);
  geometria.computeVertexNormals();
  const cortina = materialPadrao("#6B2A45", 0.72, { side: THREE.DoubleSide, envMapIntensity: 0.5 }), cortinas: InstanciaDeMalha[] = [];
  for (let i = -3; i <= 3; i++) cortinas.push({ x: i * 2.45, y: (ALTURA - 1.3) / 2 + 0.3, z: -D / 2 + 1.1 });
  instanciar(ctx, geometria, cortina, cortinas, true);
  caixa(ctx, W - 6, 0.5, 0.5, materialPadrao("#C9A66B", 0.3, { metalness: 0.8 }), 0, ALTURA - 0.8, -D / 2 + 1.1, true);
  caixa(ctx, 9, 0.7, 4, materialPadrao("#5E2B4E", 0.6), 0, 0.35, -D / 2 + 3.4, true, true);
  caixa(ctx, 9.4, 0.08, 4.4, materialPadrao("#E8DDD1", 0.5), 0, 0.72, -D / 2 + 3.4, false, true);
}

export function montarSalaoClassico(ctx: ContextoDoMotor, sala: [number, number]) {
  const W = sala[0], D = sala[1];
  pisos(ctx, W, D);
  paredesEMolduras(ctx, W, D);
  colunas(ctx, W, D);
  cortinasEPalco(ctx, W, D);
  for (const p of [[0, 3], [-9, 3], [9, 3], [0, -4], [-10, -4], [10, -4]]) montarLustre(ctx, p[0], ALTURA - 1.7, p[1]);
}
