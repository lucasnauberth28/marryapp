// Texturas procedurais (cor e relevo desenhados pixel a pixel), guardadas em cache até o motor ser destruído.
import * as THREE from "three";
import { degrauSuave, escurecer, hashDoPonto, misturar, ruidoDeValor, ruidoEmOitavas, type RGB } from "./ruido.ts";
import type { DefinicaoDoCenario } from "../scenarios.ts";

const VOLTA_COMPLETA = Math.PI * 2;

export interface ParDeTexturas {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
}

export interface FabricaDeTexturas {
  cache: Record<string, ParDeTexturas | THREE.Texture>;
}

export function criarFabricaDeTexturas(): FabricaDeTexturas {
  return { cache: {} };
}

/** Libera da memória da placa de vídeo todas as texturas criadas. */
export function liberarTexturas(f: FabricaDeTexturas) {
  for (const t of Object.values(f.cache)) {
    const par = t as ParDeTexturas;
    if (par.map) {
      par.map.dispose();
      par.bump.dispose();
    } else (t as THREE.Texture).dispose();
  }
}

type FuncaoDePixel = (u: number, v: number) => [number, number, number, number];

/** Cor e relevo (bump) desenhados pixel a pixel. */
function texturaPorPixel(f: FabricaDeTexturas, chave: string, w: number, h: number, pixel: FuncaoDePixel, rx: number, ry: number): ParDeTexturas {
  const guardada = f.cache[chave] as ParDeTexturas | undefined;
  if (guardada) return guardada;
  const c1 = document.createElement("canvas"), c2 = document.createElement("canvas");
  c1.width = c2.width = w;
  c1.height = c2.height = h;
  const g1 = c1.getContext("2d")!, g2 = c2.getContext("2d")!;
  const i1 = g1.createImageData(w, h), i2 = g2.createImageData(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const r = pixel(x / w, y / h), i = (y * w + x) * 4, relevo = Math.max(0, Math.min(255, r[3] * 255));
      i1.data[i] = r[0]; i1.data[i + 1] = r[1]; i1.data[i + 2] = r[2]; i1.data[i + 3] = 255;
      i2.data[i] = i2.data[i + 1] = i2.data[i + 2] = relevo; i2.data[i + 3] = 255;
    }
  g1.putImageData(i1, 0, 0);
  g2.putImageData(i2, 0, 0);
  const map = new THREE.CanvasTexture(c1), bump = new THREE.CanvasTexture(c2);
  for (const t of [map, bump]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.anisotropy = 8;
  }
  map.encoding = THREE.sRGBEncoding;
  return (f.cache[chave] = { map, bump });
}

export const texturaDaGrama = (f: FabricaDeTexturas) =>
  texturaPorPixel(f, "grama", 512, 512, (u, v) => {
    const n1 = ruidoEmOitavas(u * 4, v * 4, 4, 1, 4, 4), n2 = ruidoEmOitavas(u * 32, v * 32, 3, 5, 32, 32), n3 = ruidoEmOitavas(u * 14, v * 14, 3, 2, 14, 14), lamina = ruidoDeValor(u * 128, v * 128, 9, 128, 128);
    const c = misturar([92, 128, 66], [130, 162, 90], n1 * 0.55 + n3 * 0.45), k = 0.97 + 0.06 * n2;
    return [c[0] * k, c[1] * k, c[2] * k, 0.7 * n2 + 0.3 * lamina];
  }, 70, 70);

export const texturaDeTabuas = (f: FabricaDeTexturas, chave: string, horizontal: boolean, paleta: [RGB, RGB], tabuas: number, rx: number, ry: number) =>
  texturaPorPixel(f, chave, 512, 512, (u, v) => {
    const a = horizontal ? v : u, b = horizontal ? u : v, tabua = Math.floor(a * tabuas), lv = a * tabuas - tabua, tom = hashDoPonto(tabua, 3, 4), deslocamento = hashDoPonto(tabua, 9, 5) * 40;
    const veio = ruidoEmOitavas(b * 2 + deslocamento, a * tabuas * 5, 4, 6, 2, tabuas * 5), fino = ruidoEmOitavas(b * 5, a * tabuas * 22, 2, 8, 5, tabuas * 22);
    const k = 0.9 + 0.16 * fino + 0.05 * Math.sin(veio * 14);
    let c = escurecer(misturar(paleta[0], paleta[1], tom * 0.6 + veio * 0.4), k);
    const emenda = lv < 0.014 || lv > 0.986;
    if (emenda) c = escurecer(c, 0.5);
    return [c[0], c[1], c[2], emenda ? 0.1 : 0.5 + 0.35 * veio];
  }, rx, ry);

export const texturaDeMarmore = (f: FabricaDeTexturas) =>
  texturaPorPixel(f, "marmore", 512, 512, (u, v) => {
    const tx = Math.floor(u * 2), ty = Math.floor(v * 2), xadrez = (tx + ty) % 2, base: RGB = xadrez ? [226, 216, 208] : [243, 238, 231];
    const n = ruidoEmOitavas(u * 3 + tx * 0.7, v * 3 + ty * 1.3, 5, 11, 3, 3), r = 1 - Math.abs(n * 2 - 1), veio = Math.pow(r, 16), fino = ruidoEmOitavas(u * 30, v * 30, 3, 3, 30, 30);
    const k = (0.96 + 0.07 * fino) * (1 - 0.14 * veio);
    const fx = (u * 2) % 1, fy = (v * 2) % 1, borda = Math.min(fx, 1 - fx, fy, 1 - fy) < 0.004;
    const c: RGB = borda ? [150, 140, 136] : escurecer(base, k);
    return [c[0], c[1], c[2], borda ? 0 : 0.6 + 0.2 * veio];
  }, 1, 1);

export const texturaDeParquet = (f: FabricaDeTexturas) =>
  texturaPorPixel(f, "parquet", 512, 512, (u, v) => {
    const sx = Math.floor(u * 8), sy = Math.floor(v * 8), lu = u * 8 - sx, lv = v * 8 - sy, o = (sx + sy) % 2, p = o ? lu : lv, q = o ? lv : lu, k = Math.floor(p * 4), tom = hashDoPonto(sx, sy * 7 + k, 12);
    const veio = ruidoEmOitavas(q * 4 + tom * 13, p * 40, 3, 15, 1000, 1000);
    let c = escurecer(misturar([92, 58, 38], [150, 102, 68], tom * 0.6 + veio * 0.4), 0.82 + 0.3 * veio);
    const pf = (p * 4) % 1, emenda = pf < 0.05 || pf > 0.95;
    if (emenda) c = escurecer(c, 0.4);
    return [c[0], c[1], c[2], emenda ? 0.05 : 0.55 + 0.3 * veio];
  }, 1, 1);

export const texturaDeReboco = (f: FabricaDeTexturas, chave: string, base: RGB, rx: number, ry: number) =>
  texturaPorPixel(f, chave, 256, 256, (u, v) => {
    const n = ruidoEmOitavas(u * 6, v * 6, 4, 17, 6, 6), k = 0.975 + 0.05 * n;
    return [base[0] * k, base[1] * k, base[2] * k, n * 0.5];
  }, rx, ry);

export const texturaDeLinho = (f: FabricaDeTexturas, chave: string, rx: number, ry: number) =>
  texturaPorPixel(f, chave, 256, 256, (u, v) => {
    const h = 0.5 + 0.28 * Math.sin(u * 32 * VOLTA_COMPLETA) * Math.sin(v * 32 * VOLTA_COMPLETA) + 0.2 * ruidoEmOitavas(u * 16, v * 16, 3, 2, 16, 16), s = 0.94 + 0.06 * h;
    return [255 * s, 255 * s, 255 * s, h];
  }, rx, ry);

interface PaletaDoCeu {
  topo: THREE.Color;
  horizonte: THREE.Color;
  nuvem: THREE.Color;
  corDoSol: THREE.Color;
  chao: THREE.Color;
  direcaoDoSol: number[];
}

function paletaDoCeu(c: DefinicaoDoCenario): PaletaDoCeu {
  const sp = c.sol.pos, tamanho = Math.hypot(sp[0], sp[1], sp[2]);
  return {
    topo: new THREE.Color(c.ceu!.topo),
    horizonte: new THREE.Color(c.ceu!.horiz),
    nuvem: new THREE.Color(c.ceu!.nuvem),
    corDoSol: new THREE.Color(c.sol.cor),
    chao: new THREE.Color(c.chao!),
    direcaoDoSol: [sp[0] / tamanho, sp[1] / tamanho, sp[2] / tamanho],
  };
}

/** Cor de um ponto do céu: degradê do horizonte ao topo, nuvens e o brilho do sol. */
function corDoCeu(p: PaletaDoCeu, u: number, v: number) {
  const th = v * Math.PI, ph = u * VOLTA_COMPLETA, dx = -Math.cos(ph) * Math.sin(th), dy = Math.cos(th), dz = Math.sin(ph) * Math.sin(th);
  const t = Math.max(0, Math.min(1, (0.5 - v) / 0.5)), cor = p.horizonte.clone().lerp(p.topo, Math.pow(t, 0.55));
  if (v > 0.5) cor.lerp(p.chao, Math.min(1, (v - 0.5) * 3));
  const d = p.direcaoDoSol, alinhamento = Math.max(0, dx * d[0] + dy * d[1] + dz * d[2]);
  const brilho = Math.pow(alinhamento, 90) * 1.3 + Math.pow(alinhamento, 7) * 0.32;
  const m = ruidoEmOitavas(u * 5, v * 14, 5, 21, 5, 1000), cobertura = degrauSuave(0.5, 0.78, m) * degrauSuave(0.5, 0.12, v) * 0.85;
  cor.lerp(p.nuvem.clone().lerp(p.corDoSol, Math.min(1, alinhamento * 1.4)), cobertura);
  cor.r += p.corDoSol.r * brilho; cor.g += p.corDoSol.g * brilho; cor.b += p.corDoSol.b * brilho;
  return cor;
}

export function texturaDoCeu(f: FabricaDeTexturas, c: DefinicaoDoCenario): THREE.Texture {
  const chave = "ceu" + c.id;
  const guardada = f.cache[chave] as THREE.Texture | undefined;
  if (guardada) return guardada;
  const w = 1024, h = 512, canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!, imagem = g.createImageData(w, h), paleta = paletaDoCeu(c);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const cor = corDoCeu(paleta, x / w, y / h), i = (y * w + x) * 4;
      imagem.data[i] = Math.min(255, cor.r * 255); imagem.data[i + 1] = Math.min(255, cor.g * 255); imagem.data[i + 2] = Math.min(255, cor.b * 255); imagem.data[i + 3] = 255;
    }
  g.putImageData(imagem, 0, 0);
  const textura = new THREE.CanvasTexture(canvas);
  textura.encoding = THREE.sRGBEncoding;
  return (f.cache[chave] = textura);
}

/** Pontinho de luz com borda suave, usado nas luzes e velas. */
export function texturaDoBrilho(f: FabricaDeTexturas): THREE.Texture {
  const guardada = f.cache.brilho as THREE.Texture | undefined;
  if (guardada) return guardada;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const g = canvas.getContext("2d")!, gradiente = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradiente.addColorStop(0, "rgba(255,255,255,1)");
  gradiente.addColorStop(0.18, "rgba(255,255,255,.55)");
  gradiente.addColorStop(0.5, "rgba(255,255,255,.12)");
  gradiente.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gradiente;
  g.fillRect(0, 0, 128, 128);
  return (f.cache.brilho = new THREE.CanvasTexture(canvas));
}
