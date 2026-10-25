// Peças de festa: o arco de flores do jardim e o lustre do salão clássico.
import * as THREE from "three";
import { corLinear, materialLuminoso, materialPadrao } from "./materiais.ts";
import { marcarBrilho } from "./decoracao.ts";
import { adicionar, caixa, cilindro, giroAleatorio, instanciar, numeroAleatorio } from "./pecas.ts";
import type { ContextoDoMotor, InstanciaDeMalha } from "./tipos.ts";

const VOLTA_COMPLETA = Math.PI * 2;

/** Flores e folhas ao longo do arco e nas duas colunas. */
function floresDoArco(ctx: ContextoDoMotor, x: number, z: number, altura: number, flores: string[]) {
  const aleatorio = () => numeroAleatorio(ctx);
  const petalas: InstanciaDeMalha[] = [], folhas: InstanciaDeMalha[] = [];
  for (let i = 0; i <= 90; i++) {
    const a = (i / 90) * Math.PI;
    petalas.push({ x: x + Math.cos(a) * 1.9 + (aleatorio() - 0.5) * 0.4, y: altura + Math.sin(a) * 1.9 + (aleatorio() - 0.5) * 0.4, z: z + (aleatorio() - 0.5) * 0.35, sx: 0.1 + aleatorio() * 0.12, cor: flores[(aleatorio() * flores.length) | 0] });
    folhas.push({ x: x + Math.cos(a) * 1.9, y: altura + Math.sin(a) * 1.9, z: z + (aleatorio() - 0.5) * 0.2, sx: 0.3, sy: 0.07, sz: 0.14, ry: giroAleatorio(ctx), rz: (aleatorio() - 0.5) * 2, cor: "#5E7F4F" });
  }
  for (let k = 0; k < 36; k++) {
    const lado = k % 2 ? 1 : -1;
    petalas.push({ x: x + lado * 1.9 + (aleatorio() - 0.5) * 0.4, y: 0.3 + aleatorio() * altura * 0.85, z: z + (aleatorio() - 0.5) * 0.35, sx: 0.1 + aleatorio() * 0.1, cor: flores[(aleatorio() * flores.length) | 0] });
  }
  instanciar(ctx, new THREE.SphereGeometry(1, 10, 8), materialPadrao("#ffffff", 0.8), petalas, true);
  instanciar(ctx, new THREE.SphereGeometry(1, 8, 6), materialPadrao("#ffffff", 0.9), folhas, false);
}

/** Cortinas de tecido leve nas laterais do arco. */
function cortinasDoArco(ctx: ContextoDoMotor, x: number, z: number, altura: number) {
  const tecido = new THREE.MeshStandardMaterial({ color: corLinear("#FFFFFF"), side: THREE.DoubleSide, transparent: true, opacity: 0.82, roughness: 0.95 });
  for (const lado of [-1, 1]) {
    const plano = new THREE.PlaneGeometry(0.9, altura + 0.6, 24, 6), p = plano.attributes.position;
    for (let q = 0; q < p.count; q++) p.setZ(q, Math.sin(p.getX(q) * 14) * 0.05);
    plano.computeVertexNormals();
    const malha = new THREE.Mesh(plano, tecido);
    malha.position.set(x + lado * 1.55, (altura + 0.6) / 2 - 0.1, z);
    adicionar(ctx, malha, false);
  }
}

export function montarArco(ctx: ContextoDoMotor, x: number, z: number, altura: number, cor: string, flores: string[], comCortinas: boolean) {
  const material = materialPadrao(cor, 0.5);
  caixa(ctx, 0.16, altura, 0.16, material, x - 1.9, altura / 2, z, true);
  caixa(ctx, 0.16, altura, 0.16, material, x + 1.9, altura / 2, z, true);
  const topo = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.08, 10, 40, Math.PI), material);
  topo.position.set(x, altura, z);
  adicionar(ctx, topo, true);
  floresDoArco(ctx, x, z, altura, flores);
  if (comCortinas) cortinasDoArco(ctx, x, z, altura);
}

/** Pontos de luz e lâmpadas do lustre, em dois anéis. */
function luzesDoLustre(ctx: ContextoDoMotor, x: number, y: number, z: number) {
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * VOLTA_COMPLETA;
    marcarBrilho(ctx, x + Math.cos(a) * 1.1, y + 0.14, z + Math.sin(a) * 1.1);
  }
  for (let q = 0; q < 8; q++) {
    const a = (q / 8) * VOLTA_COMPLETA;
    marcarBrilho(ctx, x + Math.cos(a) * 0.6, y + 0.62, z + Math.sin(a) * 0.6);
  }
  const lampadas: InstanciaDeMalha[] = [];
  for (let m = 0; m < 14; m++) {
    const a = (m / 14) * VOLTA_COMPLETA;
    lampadas.push({ x: x + Math.cos(a) * 1.1, y: y + 0.12, z: z + Math.sin(a) * 1.1 });
  }
  instanciar(ctx, new THREE.SphereGeometry(0.06, 8, 6), materialLuminoso("#FFE8B8"), lampadas, false);
}

export function montarLustre(ctx: ContextoDoMotor, x: number, y: number, z: number) {
  const dourado = materialPadrao("#C9A66B", 0.3, { metalness: 0.85, envMapIntensity: 1.2 });
  for (const r of [[1.1, 0, 0.07], [0.6, 0.5, 0.06]]) {
    const anel = new THREE.Mesh(new THREE.TorusGeometry(r[0], r[2], 10, 40), dourado);
    anel.rotation.x = Math.PI / 2;
    anel.position.set(x, y + r[1], z);
    adicionar(ctx, anel, true);
  }
  cilindro(ctx, 0.03, 0.03, 1.6, dourado, x, y + 1.3, z, 6, false);
  const cristais: InstanciaDeMalha[] = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * VOLTA_COMPLETA;
    cristais.push({ x: x + Math.cos(a) * 1.1, y: y - 0.12, z: z + Math.sin(a) * 1.1, ry: a, sx: 1, sy: 2.2 });
  }
  for (let j = 0; j < 10; j++) {
    const a = (j / 10) * VOLTA_COMPLETA;
    cristais.push({ x: x + Math.cos(a) * 0.6, y: y + 0.4, z: z + Math.sin(a) * 0.6, ry: a, sx: 0.8, sy: 1.8 });
  }
  const vidro = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.6, envMapIntensity: 2 });
  instanciar(ctx, new THREE.OctahedronGeometry(0.06, 0), vidro, cristais, false);
  luzesDoLustre(ctx, x, y, z);
}
