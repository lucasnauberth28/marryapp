// Mesas postas: tampo, toalha ou pés, flores, velas e a posição de cada cadeira e de cada lugar à mesa.
import * as THREE from "three";
import type { PosicaoDaMesa } from "../layout.ts";
import type { DefinicaoDoCenario } from "../scenarios.ts";
import { materialPadrao } from "./materiais.ts";
import { adicionar, cilindro, giroAleatorio, numeroAleatorio } from "./pecas.ts";
import type { ContextoDoMotor, InstanciaDeMalha, PosicaoDeCadeira } from "./tipos.ts";

const VOLTA_COMPLETA = Math.PI * 2;

/** Tudo que se repete em várias mesas e vira instâncias no fim. */
export interface PecasDasMesas {
  flor: InstanciaDeMalha[];
  folha: InstanciaDeMalha[];
  vela: InstanciaDeMalha[];
  tampos: InstanciaDeMalha[];
  saias: InstanciaDeMalha[];
  pes: InstanciaDeMalha[];
  prato: InstanciaDeMalha[];
  carga: InstanciaDeMalha[];
  guardanapo: InstanciaDeMalha[];
  copo: InstanciaDeMalha[];
}

export function pecasVazias(): PecasDasMesas {
  return { flor: [], folha: [], vela: [], tampos: [], saias: [], pes: [], prato: [], carga: [], guardanapo: [], copo: [] };
}

export interface MateriaisDasMesas {
  toalha: THREE.MeshStandardMaterial | null;
  mesa: THREE.MeshStandardMaterial;
  bumpDoLinho: THREE.Texture;
}

/** Mesa redonda: tampo e saia (ou pés) instanciados, arranjo de flores, velas e cadeiras em círculo. */
function mesaRedonda(ctx: ContextoDoMotor, c: DefinicaoDoCenario, t: PosicaoDaMesa, pecas: PecasDasMesas): PosicaoDeCadeira[] {
  const k = t.r / 0.97;
  pecas.tampos.push({ x: t.x, y: 0.76, z: t.z, ry: giroAleatorio(ctx), sx: k, sy: 1, sz: k });
  if (c.toalha) pecas.saias.push({ x: t.x, y: 0.38, z: t.z, ry: giroAleatorio(ctx), sx: k, sy: 1, sz: k });
  else pecas.pes.push({ x: t.x, y: 0.38, z: t.z });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * VOLTA_COMPLETA;
    pecas.flor.push({ x: t.x + Math.cos(a) * 0.15, y: 0.98 + (i % 2) * 0.05, z: t.z + Math.sin(a) * 0.15, sx: 0.085 + (i % 3) * 0.015, cor: c.flores[i % c.flores.length] });
    pecas.folha.push({ x: t.x + Math.cos(a + 0.4) * 0.22, y: 0.92, z: t.z + Math.sin(a + 0.4) * 0.22, sx: 0.12, sy: 0.025, sz: 0.06, ry: -a, rz: 0.4, cor: "#5E7F4F" });
  }
  pecas.flor.push({ x: t.x, y: 1.1, z: t.z, sx: 0.12, cor: c.flores[0] });
  if (c.velas)
    for (let v = 0; v < 3; v++) {
      const av = (v / 3) * VOLTA_COMPLETA + 0.5;
      pecas.vela.push({ x: t.x + Math.cos(av) * 0.5 * k, y: 0.86, z: t.z + Math.sin(av) * 0.5 * k });
    }
  const cadeiras: PosicaoDeCadeira[] = [];
  for (let i = 0; i < t.cadeiras; i++) {
    const ak = (i / t.cadeiras) * VOLTA_COMPLETA;
    cadeiras.push({ x: t.x + Math.cos(ak) * (t.r + 0.35), z: t.z + Math.sin(ak) * (t.r + 0.35), ry: -ak - Math.PI / 2, px: t.x + Math.cos(ak) * t.r * 0.72, pz: t.z + Math.sin(ak) * t.r * 0.72 });
  }
  return cadeiras;
}

/** Tampo, toalha (ou quatro pés) e o caminho de mesa da mesa retangular. */
function corpoDaMesaRetangular(ctx: ContextoDoMotor, c: DefinicaoDoCenario, t: PosicaoDaMesa, m: MateriaisDasMesas) {
  const w = t.w, d = t.d;
  const tampo = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, d), m.mesa);
  tampo.position.set(t.x, 0.77, t.z);
  adicionar(ctx, tampo, true, true);
  if (m.toalha) {
    const saia = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.74, d - 0.04), m.toalha);
    saia.position.set(t.x, 0.38, t.z);
    adicionar(ctx, saia, true, true);
  } else {
    for (const s of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cilindro(ctx, 0.06, 0.06, 0.75, materialPadrao("#4A3223", 0.8), t.x + s[0] * (w / 2 - 0.2), 0.37, t.z + s[1] * (d / 2 - 0.2), 8, true);
  }
  const cor = c.id === "rustico" ? "#EBDCC3" : "#F2D7E7";
  const caminho = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.015, 0.32), materialPadrao(cor, 0.9, { bumpMap: m.bumpDoLinho, bumpScale: 0.5 }));
  caminho.position.set(t.x, 0.81, t.z);
  adicionar(ctx, caminho, false, true);
}

function floresEVelasDaMesaRetangular(ctx: ContextoDoMotor, c: DefinicaoDoCenario, t: PosicaoDaMesa, pecas: PecasDasMesas) {
  const aleatorio = () => numeroAleatorio(ctx);
  const w = t.w, n = Math.round(w / 1.4);
  for (let f = 0; f < n; f++) {
    const fx = t.x - w / 2 + (f + 0.5) * (w / n);
    for (let q = 0; q < 5; q++) {
      pecas.flor.push({ x: fx + (aleatorio() - 0.5) * 0.28, y: 0.93 + aleatorio() * 0.1, z: t.z + (aleatorio() - 0.5) * 0.2, sx: 0.08 + aleatorio() * 0.04, cor: c.flores[(aleatorio() * c.flores.length) | 0] });
      pecas.folha.push({ x: fx + (aleatorio() - 0.5) * 0.4, y: 0.86, z: t.z + (aleatorio() - 0.5) * 0.25, sx: 0.14, sy: 0.025, sz: 0.06, ry: giroAleatorio(ctx), cor: "#5E7F4F" });
    }
    if (c.velas) pecas.vela.push({ x: fx + 0.35, y: 0.86, z: t.z });
  }
}

/** Cadeiras só de um lado (mesa dos noivos) ou dos dois lados (mesa de convidados). */
function cadeirasDaMesaRetangular(t: PosicaoDaMesa): PosicaoDeCadeira[] {
  const w = t.w, d = t.d, cadeiras: PosicaoDeCadeira[] = [];
  if (t.noivos) {
    for (let j = 0; j < t.cadeiras; j++) {
      const cx = t.x - w / 2 + 0.35 + (j + 0.5) * ((w - 0.7) / t.cadeiras);
      cadeiras.push({ x: cx, z: t.z + d / 2 + 0.55, ry: Math.PI, px: cx, pz: t.z + d / 2 - 0.3 });
    }
    return cadeiras;
  }
  const lado = Math.ceil(t.cadeiras / 2);
  for (let l = 0; l < t.cadeiras; l++) {
    const cima = l < lado, indice = cima ? l : l - lado, cx = t.x - w / 2 + 0.45 + (indice + 0.5) * ((w - 0.9) / lado);
    cadeiras.push({ x: cx, z: t.z + (cima ? -1 : 1) * (d / 2 + 0.55), ry: cima ? 0 : Math.PI, px: cx, pz: t.z + (cima ? -1 : 1) * (d / 2 - 0.3) });
  }
  return cadeiras;
}

function mesaRetangular(ctx: ContextoDoMotor, c: DefinicaoDoCenario, t: PosicaoDaMesa, pecas: PecasDasMesas, m: MateriaisDasMesas) {
  corpoDaMesaRetangular(ctx, c, t, m);
  floresEVelasDaMesaRetangular(ctx, c, t, pecas);
  return cadeirasDaMesaRetangular(t);
}

/** Põe uma mesa (redonda ou retangular) e devolve a posição das suas cadeiras. */
export function mesaPosta(ctx: ContextoDoMotor, c: DefinicaoDoCenario, t: PosicaoDaMesa, pecas: PecasDasMesas, m: MateriaisDasMesas): PosicaoDeCadeira[] {
  return t.forma === "round" ? mesaRedonda(ctx, c, t, pecas) : mesaRetangular(ctx, c, t, pecas, m);
}
