// Câmera: poses prontas (salão, panorâmica, de cima), vista de uma mesa e a animação suave entre elas.
import * as THREE from "three";
import { pedirDesenho } from "./desenho.ts";
import type { PredefinicaoDaCamera, ContextoDoMotor } from "./tipos.ts";

type Pose = { pos: THREE.Vector3; alvo: THREE.Vector3 };

export function encontrarMesa(ctx: ContextoDoMotor, id: string | null | undefined) {
  return ctx.estado.layout.slots.find((s) => s.id === id) ?? null;
}

/** Leva a câmera até a pose; com "reduzir movimento" ligado, pula direto. */
function irPara(ctx: ContextoDoMotor, pos: THREE.Vector3, alvo: THREE.Vector3, ms: number) {
  const { camera, controles, estado } = ctx;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    camera.position.copy(pos);
    controles.target.copy(alvo);
    controles.update();
    pedirDesenho(ctx);
    return;
  }
  estado.animacao = { t0: performance.now(), ms: ms || 700, p0: camera.position.clone(), a0: controles.target.clone(), p1: pos, a1: alvo };
  pedirDesenho(ctx);
}

function distanciaDaCamera(ctx: ContextoDoMotor) {
  const s = ctx.estado.layout.sala;
  return Math.max(s[0] * 1.0, s[1] * 1.15) * (ctx.opcoes.host.clientWidth < 700 ? 1.6 : 1);
}

function poseDoSalao(ctx: ContextoDoMotor): Pose {
  const d = distanciaDaCamera(ctx);
  return { pos: new THREE.Vector3(d * 0.26, d * 0.4, d * 0.8), alvo: new THREE.Vector3(0, 0.6, 1) };
}

function posePanoramica(ctx: ContextoDoMotor): Pose {
  const { layout } = ctx.estado, c = layout.scene, D = layout.sala[1], cz = c.externo ? D / 2 + 10 : D / 2 - 1.5;
  return { pos: new THREE.Vector3(0, c.externo ? 3.6 : 3.3, cz), alvo: new THREE.Vector3(0, c.externo ? 2.6 : 2.4, -D / 2 + (c.externo ? 6 : 4)) };
}

function poseDeCima(ctx: ContextoDoMotor): Pose {
  const d = distanciaDaCamera(ctx);
  return { pos: new THREE.Vector3(0.001, d * 1.18, 0.8), alvo: new THREE.Vector3(0, 0, 0.5) };
}

const DURACAO_DA_ANIMACAO: Record<PredefinicaoDaCamera, number> = { cenario: 900, panoramica: 1100, topo: 800 };

export function aplicarPredefinicao(ctx: ContextoDoMotor, nome: PredefinicaoDaCamera, rapido?: boolean) {
  const pose = nome === "cenario" ? poseDoSalao(ctx) : nome === "panoramica" ? posePanoramica(ctx) : poseDeCima(ctx);
  if (!rapido) return irPara(ctx, pose.pos, pose.alvo, DURACAO_DA_ANIMACAO[nome]);
  ctx.camera.position.copy(pose.pos);
  ctx.controles.target.copy(pose.alvo);
  ctx.controles.update();
  pedirDesenho(ctx);
}

/** Câmera na altura dos olhos de quem senta na mesa, olhando para a cabeceira. */
export function vistaDaMesa(ctx: ContextoDoMotor, id: string) {
  const t = encontrarMesa(ctx, id), cabeceira = ctx.estado.layout.slots[0];
  if (!t) return;
  const dx = cabeceira.x - t.x, dz = cabeceira.z - t.z, len = Math.hypot(dx, dz) || 1, ux = dx / len, uz = dz / len;
  irPara(ctx, new THREE.Vector3(t.x - ux * 1.9, 1.3, t.z - uz * 1.9), new THREE.Vector3(cabeceira.x, 1.5, cabeceira.z - 2), 1000);
}

export function irParaMesa(ctx: ContextoDoMotor, id: string) {
  const t = encontrarMesa(ctx, id);
  if (t) irPara(ctx, new THREE.Vector3(t.x + 5, 7, t.z + 9), new THREE.Vector3(t.x, 0.5, t.z), 900);
}
