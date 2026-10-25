// Ferramentas de modelagem: acrescentam caixas, cilindros e instâncias repetidas à cena do motor.
import * as THREE from "three";
import type { ContextoDoMotor, InstanciaDeMalha } from "./tipos.ts";

const VOLTA_COMPLETA = Math.PI * 2;

/** Gerador pseudoaleatório fixo: o cenário sai igual toda vez que é montado. */
export function numeroAleatorio(ctx: ContextoDoMotor) {
  const e = ctx.estado;
  e.semente = (e.semente * 16807) % 2147483647;
  return (e.semente - 1) / 2147483646;
}

export const giroAleatorio = (ctx: ContextoDoMotor) => numeroAleatorio(ctx) * VOLTA_COMPLETA;

export function adicionar<T extends THREE.Object3D>(ctx: ContextoDoMotor, objeto: T, projetaSombra?: boolean, recebeSombra?: boolean): T {
  objeto.castShadow = !!projetaSombra;
  objeto.receiveShadow = !!recebeSombra;
  ctx.raiz.add(objeto);
  return objeto;
}

export function caixa(ctx: ContextoDoMotor, largura: number, altura: number, profundidade: number, material: THREE.Material, x: number, y: number, z: number, projetaSombra?: boolean, recebeSombra?: boolean) {
  const malha = new THREE.Mesh(new THREE.BoxGeometry(largura, altura, profundidade), material);
  malha.position.set(x, y, z);
  return adicionar(ctx, malha, projetaSombra, recebeSombra);
}

export function cilindro(ctx: ContextoDoMotor, raioDeCima: number, raioDeBaixo: number, altura: number, material: THREE.Material, x: number, y: number, z: number, segmentos?: number, projetaSombra?: boolean) {
  const malha = new THREE.Mesh(new THREE.CylinderGeometry(raioDeCima, raioDeBaixo, altura, segmentos || 16), material);
  malha.position.set(x, y, z);
  return adicionar(ctx, malha, projetaSombra !== false, true);
}

/** Muitas cópias da mesma peça num desenho só (posição, giro, escala e cor de cada uma). */
export function instanciar(ctx: ContextoDoMotor, geometria: THREE.BufferGeometry, material: THREE.Material, itens: InstanciaDeMalha[], projetaSombra?: boolean) {
  const { auxiliar, corAuxiliar } = ctx;
  const instancias = new THREE.InstancedMesh(geometria, material, Math.max(1, itens.length));
  instancias.count = itens.length;
  itens.forEach((it, i) => {
    auxiliar.position.set(it.x, it.y, it.z);
    auxiliar.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
    auxiliar.scale.set(it.sx || 1, it.sy || it.sx || 1, it.sz || it.sx || 1);
    auxiliar.updateMatrix();
    instancias.setMatrixAt(i, auxiliar.matrix);
    if (it.cor) {
      corAuxiliar.set(it.cor).convertSRGBToLinear();
      instancias.setColorAt(i, corAuxiliar);
    }
  });
  if (instancias.instanceColor) instancias.instanceColor.needsUpdate = true;
  instancias.castShadow = !!projetaSombra;
  instancias.receiveShadow = true;
  ctx.raiz.add(instancias);
  return instancias;
}
