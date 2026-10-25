// Geometrias das peças (cadeira, fita, copo, saia da toalha, copa de árvore). Cada cor vai em vértice, para as peças
// repetidas virarem uma só instância.
import * as THREE from "three";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { DefinicaoDoCenario } from "../scenarios.ts";
import { corLinear } from "./materiais.ts";
import { ruidoDeValor } from "./ruido.ts";

function comCor(geo: THREE.BufferGeometry, cor: string) {
  const n = geo.attributes.position.count, cs = new Float32Array(n * 3), c = corLinear(cor);
  for (let i = 0; i < n; i++) {
    cs[i * 3] = c.r; cs[i * 3 + 1] = c.g; cs[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cs, 3));
  return geo;
}

const juntar = (lista: THREE.BufferGeometry[]) => BufferGeometryUtils.mergeBufferGeometries(lista, false);

/** Peça já deslocada e pintada, pronta para ser juntada às outras. */
function peca(g: THREE.BufferGeometry, x: number, y: number, z: number, cor: string) {
  g.translate(x, y, z);
  return comCor(g, cor);
}

/** Cadeira com travessas e almofada, encosto para trás (-z) e frente em +z. */
export function geometriaDaCadeira(c: DefinicaoDoCenario) {
  const m = c.cadeira;
  const partes = [peca(new THREE.BoxGeometry(0.46, 0.04, 0.46), 0, 0.43, 0, m), peca(new THREE.BoxGeometry(0.42, 0.06, 0.42), 0, 0.48, 0.005, c.almofada)];
  for (const s of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) partes.push(peca(new THREE.CylinderGeometry(0.017, 0.024, 0.43, 8), s[0] * 0.2, 0.215, s[1] * 0.2, m));
  for (const s of [-1, 1]) partes.push(peca(new THREE.BoxGeometry(0.03, 0.56, 0.03), s * 0.2, 0.73, -0.2, m));
  for (const y of [0.62, 0.78, 0.94]) partes.push(peca(new THREE.BoxGeometry(0.4, 0.03, 0.022), 0, y, -0.2, m));
  for (const x of [-0.12, 0, 0.12]) partes.push(peca(new THREE.BoxGeometry(0.018, 0.3, 0.018), x, 0.78, -0.2, m));
  return juntar(partes);
}

/** Fita do encosto, que ganha a cor do grupo de quem senta. */
export const geometriaDaFita = () =>
  juntar([
    peca(new THREE.BoxGeometry(0.43, 0.13, 0.02), 0, 0.8, -0.215, "#ffffff"),
    peca(new THREE.BoxGeometry(0.09, 0.09, 0.03), 0, 0.8, -0.235, "#ffffff"),
    peca(new THREE.BoxGeometry(0.05, 0.16, 0.012), 0.03, 0.7, -0.222, "#ffffff"),
  ]);

export function geometriaDoCopo() {
  const pontos = [[0.0, 0.0], [0.035, 0.0], [0.035, 0.008], [0.008, 0.02], [0.006, 0.09], [0.03, 0.12], [0.046, 0.17], [0.045, 0.2], [0.04, 0.2], [0.04, 0.17], [0.028, 0.13], [0.0, 0.11]];
  return new THREE.LatheGeometry(pontos.map((p) => new THREE.Vector2(p[0], p[1])), 14);
}

/** Saia da toalha com dobras que crescem para baixo. */
export function geometriaDaSaia(raioDeCima: number, raioDeBaixo: number, altura: number) {
  const g = new THREE.CylinderGeometry(raioDeCima, raioDeBaixo, altura, 120, 14, true), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = (altura / 2 - y) / altura, a = Math.atan2(z, x);
    const dobra = (Math.sin(a * 24) * 0.5 + Math.sin(a * 41 + 1.3) * 0.3 + Math.sin(a * 9 + 0.4) * 0.2) * 0.05 * t * t, r = Math.hypot(x, z) + dobra;
    p.setXYZ(i, Math.cos(a) * r, y, Math.sin(a) * r);
  }
  g.computeVertexNormals();
  return g;
}

/** Copa de árvore: esfera irregular, normais suaves e sombreada embaixo. */
export function geometriaDaFolha() {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 2);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = BufferGeometryUtils.mergeVertices(g);
  const p = g.attributes.position, cores: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = ruidoDeValor(x * 1.7 + y * 1.1 + 5, z * 1.7 + y * 0.9 + 9, 3, 1000, 1000), r = 1 + (n - 0.5) * 0.75;
    p.setXYZ(i, x * r, y * r * 0.88, z * r);
    const k = 0.5 + 0.5 * ((y + 1) / 2);
    cores.push(k, k, k);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
  g.computeVertexNormals();
  return g;
}
