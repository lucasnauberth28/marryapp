// Decoração do ambiente: pontos de luz, cordões de luzes e árvores.
import * as THREE from "three";
import { geometriaDaFolha } from "./geometrias.ts";
import { corLinear, materialLuminoso, materialPadrao } from "./materiais.ts";
import { giroAleatorio, instanciar, numeroAleatorio } from "./pecas.ts";
import { texturaDoBrilho } from "./texturas.ts";
import type { ContextoDoMotor, InstanciaDeMalha } from "./tipos.ts";

export function marcarBrilho(ctx: ContextoDoMotor, x: number, y: number, z: number) {
  ctx.estado.brilhos.push(x, y, z);
}

/** Desenha de uma vez todos os pontos de luz marcados. */
export function criarBrilhos(ctx: ContextoDoMotor, cor: string, tamanho: number) {
  if (!ctx.estado.brilhos.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(ctx.estado.brilhos, 3));
  const material = new THREE.PointsMaterial({ map: texturaDoBrilho(ctx.texturas), size: tamanho, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: corLinear(cor) });
  ctx.raiz.add(new THREE.Points(g, material));
}

type TrechoDeLuzes = [number[], number[], number?];

/** Cordão de luzes entre dois pontos, com a curva natural do fio. */
export function cordaoDeLuzes(ctx: ContextoDoMotor, trechos: TrechoDeLuzes[], cor?: string) {
  const segmentos: number[] = [], lampadas: InstanciaDeMalha[] = [];
  for (const [a, b, curva] of trechos) {
    const n = Math.max(8, Math.round(Math.hypot(b[0] - a[0], b[2] - a[2]) * 1.4)), sag = curva == null ? 0.7 : curva;
    let anterior: number[] | null = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t, y = a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t);
      if (anterior) segmentos.push(anterior[0], anterior[1], anterior[2], x, y, z);
      anterior = [x, y, z];
      if (i > 0 && i < n) {
        lampadas.push({ x, y: y - 0.1, z });
        marcarBrilho(ctx, x, y - 0.1, z);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(segmentos, 3));
  ctx.raiz.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: corLinear("#2a2427") })));
  instanciar(ctx, new THREE.SphereGeometry(0.06, 8, 6), materialLuminoso(cor || "#FFE0A6"), lampadas, false);
}

function geometriaDaCopaEmCache(ctx: ContextoDoMotor) {
  return (ctx.estado.geometriaDaFolha ??= geometriaDaFolha());
}

/** Árvores (tronco e cinco tufos de folhas) nas posições dadas. */
export function plantarArvores(ctx: ContextoDoMotor, posicoes: number[][], escala: number, cores: string[]) {
  const aleatorio = () => numeroAleatorio(ctx);
  const troncos: InstanciaDeMalha[] = [], folhas: InstanciaDeMalha[] = [];
  for (const p of posicoes) {
    const s = (escala || 1) * (0.8 + aleatorio() * 0.6);
    troncos.push({ x: p[0], y: 1.8 * s, z: p[1], sx: s, ry: giroAleatorio(ctx) });
    for (let k = 0; k < 5; k++)
      folhas.push({ x: p[0] + (aleatorio() - 0.5) * 2.6 * s, y: (3.5 + k * 0.8) * s, z: p[1] + (aleatorio() - 0.5) * 2.6 * s, sx: (2.0 - k * 0.2) * s * (0.85 + aleatorio() * 0.3), ry: giroAleatorio(ctx), cor: cores[(aleatorio() * cores.length) | 0] });
  }
  instanciar(ctx, new THREE.CylinderGeometry(0.26, 0.42, 3.6, 10), materialPadrao("#5C4330", 0.95), troncos, true);
  instanciar(ctx, geometriaDaCopaEmCache(ctx), materialPadrao("#ffffff", 0.9, { vertexColors: true }), folhas, true);
}
