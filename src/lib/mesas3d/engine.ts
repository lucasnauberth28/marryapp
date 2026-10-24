// Motor das mesas em 3D (Three.js): monta o cenário escolhido, as mesas postas com as cadeiras do casamento e as câmeras.
// Só roda no navegador. Tudo é desenhado por código (texturas e modelos procedurais, sem arquivos de imagem ou de modelo).
// Leve de propósito: peças repetidas são instâncias, as sombras são assadas (só recalculam quando o cenário muda) e o
// quadro só é desenhado quando algo muda (câmera, mesa ou seleção), então a tela parada não gasta bateria.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { computeLayout, type Layout, type TableInput, type TableSlot } from "./layout.ts";
import type { SceneDef, SceneId } from "./scenarios.ts";

const TAU = Math.PI * 2;

export type CameraPreset = "cenario" | "panoramica" | "topo";

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  /** Elemento que dá o tamanho do desenho; observado para redimensionar. */
  host: HTMLElement;
  /** Chamado depois de cada quadro desenhado (a tela usa para reposicionar os rótulos). */
  onRender?: (info: { calls: number; triangles: number }) => void;
  /** Toque ou clique (sem arrastar) na cena. Recebe a mesa sob o ponto, ou null. */
  onTablePick?: (table: TableSlot | null) => void;
  /** A pessoa começou a girar ou mover a câmera com a mão. */
  onCameraGrab?: () => void;
  onContextLost?: () => void;
}

interface Inst {
  x: number;
  y: number;
  z: number;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
  cor?: string;
}

interface ChairGroup {
  tableId: string;
  start: number;
  n: number;
  pos: { x: number; z: number; ry: number; px: number; pz: number }[];
}

/** O navegador consegue criar um contexto WebGL? Para mostrar um aviso em vez de uma tela em branco. */
export function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function createMesas3DEngine(opts: EngineOptions) {
  const { canvas, host } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // sombras assadas
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 600);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.maxPolarAngle = Math.PI / 2.08;
  controls.minDistance = 2.5;
  controls.maxDistance = 95;
  controls.screenSpacePanning = false;
  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 0.6);
  scene.add(hemi);
  const sol = new THREE.DirectionalLight(0xffffff, 1);
  sol.castShadow = true;
  const shadowSize = host.clientWidth < 700 ? 2048 : 4096;
  sol.shadow.mapSize.set(shadowSize, shadowSize);
  sol.shadow.bias = -0.00025;
  sol.shadow.normalBias = 0.035;
  scene.add(sol);
  scene.add(sol.target);
  const raiz = new THREE.Group();
  scene.add(raiz);
  const dummy = new THREE.Object3D();
  const tmpC = new THREE.Color();
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT: THREE.WebGLRenderTarget | null = null;
  let disposed = false;

  // Estado do cenário atual
  let layout: Layout = computeLayout("jardim", []);
  let tablesInput: TableInput[] = [];
  let fills: Record<string, string[]> = {};
  let chairGroups: ChairGroup[] = [];
  let ribbons: THREE.InstancedMesh | null = null;
  let ribbonBase: { x: number; z: number; ry: number }[] = [];
  let targetRing: THREE.Mesh | null = null;
  let searchRing: THREE.Mesh | null = null;
  let glows: number[] = [];
  let built = false;

  // Gerador pseudoaleatório fixo: o cenário sai igual toda vez que é montado
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  function K(h: string) {
    return new THREE.Color(h).convertSRGBToLinear(); // cores da marca e do cenário vêm em sRGB
  }
  function std(cor: string, rug?: number, extra?: THREE.MeshStandardMaterialParameters) {
    return new THREE.MeshStandardMaterial({ color: K(cor), roughness: rug == null ? 0.85 : rug, metalness: 0, envMapIntensity: 0.6, ...(extra ?? {}) });
  }
  function emis(cor: string) {
    return new THREE.MeshBasicMaterial({ color: K(cor) });
  }

  /* ---------- Ruído e texturas procedurais (em cache) ---------- */
  function hsh(ix: number, iy: number, s: number) {
    let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(s, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  }
  function vn(x: number, y: number, s: number, px: number, py: number) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const x0 = ((ix % px) + px) % px, x1 = (((ix + 1) % px) + px) % px, y0 = ((iy % py) + py) % py, y1 = (((iy + 1) % py) + py) % py;
    const a = hsh(x0, y0, s), b = hsh(x1, y0, s), c = hsh(x0, y1, s), d = hsh(x1, y1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fb(x: number, y: number, oct: number, s: number, px: number, py: number) {
    let t = 0, a = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) {
      t += a * vn(x * f, y * f, s + i, px * f, py * f);
      n += a;
      f *= 2;
      a *= 0.5;
    }
    return t / n;
  }
  const sm = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  type RGB = [number, number, number];
  const mx = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  interface TexPair { map: THREE.CanvasTexture; bump: THREE.CanvasTexture }
  const texCache: Record<string, TexPair | THREE.Texture> = {};
  /** Cor e relevo (bump) desenhados pixel a pixel. */
  function pixTex(key: string, w: number, h: number, fn: (u: number, v: number) => [number, number, number, number], rx: number, ry: number): TexPair {
    const hit = texCache[key] as TexPair | undefined;
    if (hit) return hit;
    const c1 = document.createElement("canvas"), c2 = document.createElement("canvas");
    c1.width = c2.width = w;
    c1.height = c2.height = h;
    const g1 = c1.getContext("2d")!, g2 = c2.getContext("2d")!;
    const i1 = g1.createImageData(w, h), i2 = g2.createImageData(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const r = fn(x / w, y / h), i = (y * w + x) * 4, hv = Math.max(0, Math.min(255, r[3] * 255));
        i1.data[i] = r[0]; i1.data[i + 1] = r[1]; i1.data[i + 2] = r[2]; i1.data[i + 3] = 255;
        i2.data[i] = i2.data[i + 1] = i2.data[i + 2] = hv; i2.data[i + 3] = 255;
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
    const pair = { map, bump };
    texCache[key] = pair;
    return pair;
  }
  const tGrama = () =>
    pixTex("grama", 512, 512, (u, v) => {
      const n1 = fb(u * 4, v * 4, 4, 1, 4, 4), n2 = fb(u * 32, v * 32, 3, 5, 32, 32), n3 = fb(u * 14, v * 14, 3, 2, 14, 14), bl = vn(u * 128, v * 128, 9, 128, 128);
      const c = mx([92, 128, 66], [130, 162, 90], n1 * 0.55 + n3 * 0.45), k = 0.97 + 0.06 * n2;
      return [c[0] * k, c[1] * k, c[2] * k, 0.7 * n2 + 0.3 * bl];
    }, 70, 70);
  const tTabuas = (chave: string, horiz: boolean, paleta: [RGB, RGB], nb: number, rx: number, ry: number) =>
    pixTex(chave, 512, 512, (u, v) => {
      const a = horiz ? v : u, b = horiz ? u : v, board = Math.floor(a * nb), lv = a * nb - board, tone = hsh(board, 3, 4), off = hsh(board, 9, 5) * 40;
      const g = fb(b * 2 + off, a * nb * 5, 4, 6, 2, nb * 5), g2 = fb(b * 5, a * nb * 22, 2, 8, 5, nb * 22);
      let c = mx(paleta[0], paleta[1], tone * 0.6 + g * 0.4);
      const k = 0.9 + 0.16 * g2 + 0.05 * Math.sin(g * 14);
      c = [c[0] * k, c[1] * k, c[2] * k];
      const seam = lv < 0.014 || lv > 0.986;
      if (seam) c = [c[0] * 0.5, c[1] * 0.5, c[2] * 0.5];
      return [c[0], c[1], c[2], seam ? 0.1 : 0.5 + 0.35 * g];
    }, rx, ry);
  const tMarmore = () =>
    pixTex("marmore", 512, 512, (u, v) => {
      const tx = Math.floor(u * 2), ty = Math.floor(v * 2), esc = (tx + ty) % 2, base: RGB = esc ? [226, 216, 208] : [243, 238, 231];
      const n = fb(u * 3 + tx * 0.7, v * 3 + ty * 1.3, 5, 11, 3, 3), r = 1 - Math.abs(n * 2 - 1), vein = Math.pow(r, 16), n2 = fb(u * 30, v * 30, 3, 3, 30, 30);
      const k = (0.96 + 0.07 * n2) * (1 - 0.14 * vein);
      const fx = (u * 2) % 1, fy = (v * 2) % 1, edge = Math.min(fx, 1 - fx, fy, 1 - fy) < 0.004;
      const c: RGB = edge ? [150, 140, 136] : [base[0] * k, base[1] * k, base[2] * k];
      return [c[0], c[1], c[2], edge ? 0 : 0.6 + 0.2 * vein];
    }, 1, 1);
  const tParquet = () =>
    pixTex("parquet", 512, 512, (u, v) => {
      const sx = Math.floor(u * 8), sy = Math.floor(v * 8), lu = u * 8 - sx, lv = v * 8 - sy, o = (sx + sy) % 2, p = o ? lu : lv, q = o ? lv : lu, k = Math.floor(p * 4), tone = hsh(sx, sy * 7 + k, 12);
      const g = fb(q * 4 + tone * 13, p * 40, 3, 15, 1000, 1000);
      let c = mx([92, 58, 38], [150, 102, 68], tone * 0.6 + g * 0.4);
      const kk = 0.82 + 0.3 * g;
      c = [c[0] * kk, c[1] * kk, c[2] * kk];
      const pf = (p * 4) % 1, seam = pf < 0.05 || pf > 0.95;
      if (seam) c = [c[0] * 0.4, c[1] * 0.4, c[2] * 0.4];
      return [c[0], c[1], c[2], seam ? 0.05 : 0.55 + 0.3 * g];
    }, 1, 1);
  const tReboco = (chave: string, base: RGB, rx: number, ry: number) =>
    pixTex(chave, 256, 256, (u, v) => {
      const n = fb(u * 6, v * 6, 4, 17, 6, 6), k = 0.975 + 0.05 * n;
      return [base[0] * k, base[1] * k, base[2] * k, n * 0.5];
    }, rx, ry);
  const tLinho = (chave: string, rx: number, ry: number) =>
    pixTex(chave, 256, 256, (u, v) => {
      const h = 0.5 + 0.28 * Math.sin(u * 32 * TAU) * Math.sin(v * 32 * TAU) + 0.2 * fb(u * 16, v * 16, 3, 2, 16, 16), s = 0.94 + 0.06 * h;
      return [255 * s, 255 * s, 255 * s, h];
    }, rx, ry);
  function tCeuImagem(c: SceneDef): THREE.Texture {
    const key = "ceu" + c.id;
    const hit = texCache[key] as THREE.Texture | undefined;
    if (hit) return hit;
    const w = 1024, h = 512, cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const g = cv.getContext("2d")!, im = g.createImageData(w, h);
    const topo = new THREE.Color(c.ceu!.topo), hor = new THREE.Color(c.ceu!.horiz), nuv = new THREE.Color(c.ceu!.nuvem), sc = new THREE.Color(c.sol.cor), chao = new THREE.Color(c.chao!);
    const sp = c.sol.pos, sl = Math.hypot(sp[0], sp[1], sp[2]), sd = [sp[0] / sl, sp[1] / sl, sp[2] / sl];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const u = x / w, v = y / h, th = v * Math.PI, ph = u * TAU, dx = -Math.cos(ph) * Math.sin(th), dy = Math.cos(th), dz = Math.sin(ph) * Math.sin(th);
        const t = Math.max(0, Math.min(1, (0.5 - v) / 0.5)), col = hor.clone().lerp(topo, Math.pow(t, 0.55));
        if (v > 0.5) col.lerp(chao, Math.min(1, (v - 0.5) * 3));
        const dot = Math.max(0, dx * sd[0] + dy * sd[1] + dz * sd[2]), glow = Math.pow(dot, 90) * 1.3 + Math.pow(dot, 7) * 0.32;
        const m = fb(u * 5, v * 14, 5, 21, 5, 1000), cl = sm(0.5, 0.78, m) * sm(0.5, 0.12, v) * 0.85, cc = nuv.clone().lerp(sc, Math.min(1, dot * 1.4));
        col.lerp(cc, cl);
        col.r += sc.r * glow; col.g += sc.g * glow; col.b += sc.b * glow;
        const i = (y * w + x) * 4;
        im.data[i] = Math.min(255, col.r * 255); im.data[i + 1] = Math.min(255, col.g * 255); im.data[i + 2] = Math.min(255, col.b * 255); im.data[i + 3] = 255;
      }
    g.putImageData(im, 0, 0);
    const t2 = new THREE.CanvasTexture(cv);
    t2.encoding = THREE.sRGBEncoding;
    texCache[key] = t2;
    return t2;
  }
  function glowTex(): THREE.Texture {
    const hit = texCache.glow as THREE.Texture | undefined;
    if (hit) return hit;
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!, gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.18, "rgba(255,255,255,.55)");
    gr.addColorStop(0.5, "rgba(255,255,255,.12)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return (texCache.glow = new THREE.CanvasTexture(cv));
  }

  /* ---------- Peças de modelagem ---------- */
  function add<T extends THREE.Object3D>(obj: T, cast?: boolean, receive?: boolean): T {
    obj.castShadow = !!cast;
    obj.receiveShadow = !!receive;
    raiz.add(obj);
    return obj;
  }
  function caixa(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, cast?: boolean, rec?: boolean) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    return add(m, cast, rec);
  }
  function cil(rt: number, rb: number, h: number, mat: THREE.Material, x: number, y: number, z: number, seg?: number, cast?: boolean) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 16), mat);
    m.position.set(x, y, z);
    return add(m, cast !== false, true);
  }
  function instanciar(geo: THREE.BufferGeometry, mat: THREE.Material, itens: Inst[], cast?: boolean) {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, itens.length));
    im.count = itens.length;
    itens.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z);
      dummy.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
      dummy.scale.set(it.sx || 1, it.sy || it.sx || 1, it.sz || it.sx || 1);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
      if (it.cor) {
        tmpC.set(it.cor).convertSRGBToLinear();
        im.setColorAt(i, tmpC);
      }
    });
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = !!cast;
    im.receiveShadow = true;
    raiz.add(im);
    return im;
  }
  function comCor(geo: THREE.BufferGeometry, cor: string) {
    const n = geo.attributes.position.count, cs = new Float32Array(n * 3), c = K(cor);
    for (let i = 0; i < n; i++) {
      cs[i * 3] = c.r; cs[i * 3 + 1] = c.g; cs[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(cs, 3));
    return geo;
  }
  const juntar = (lista: THREE.BufferGeometry[]) => BufferGeometryUtils.mergeBufferGeometries(lista, false);
  function pc(g: THREE.BufferGeometry, x: number, y: number, z: number, cor: string) {
    g.translate(x, y, z);
    return comCor(g, cor);
  }
  function geoCadeira(c: SceneDef) { // cadeira com travessas e almofada, encosto para trás (-z) e frente em +z
    const m = c.cadeira;
    const partes = [pc(new THREE.BoxGeometry(0.46, 0.04, 0.46), 0, 0.43, 0, m), pc(new THREE.BoxGeometry(0.42, 0.06, 0.42), 0, 0.48, 0.005, c.almofada)];
    for (const s of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) partes.push(pc(new THREE.CylinderGeometry(0.017, 0.024, 0.43, 8), s[0] * 0.2, 0.215, s[1] * 0.2, m));
    for (const s of [-1, 1]) partes.push(pc(new THREE.BoxGeometry(0.03, 0.56, 0.03), s * 0.2, 0.73, -0.2, m));
    for (const y of [0.62, 0.78, 0.94]) partes.push(pc(new THREE.BoxGeometry(0.4, 0.03, 0.022), 0, y, -0.2, m));
    for (const x of [-0.12, 0, 0.12]) partes.push(pc(new THREE.BoxGeometry(0.018, 0.3, 0.018), x, 0.78, -0.2, m));
    return juntar(partes);
  }
  const geoFita = () =>
    juntar([pc(new THREE.BoxGeometry(0.43, 0.13, 0.02), 0, 0.8, -0.215, "#ffffff"), pc(new THREE.BoxGeometry(0.09, 0.09, 0.03), 0, 0.8, -0.235, "#ffffff"), pc(new THREE.BoxGeometry(0.05, 0.16, 0.012), 0.03, 0.7, -0.222, "#ffffff")]);
  function geoCopo() {
    const pts = [[0.0, 0.0], [0.035, 0.0], [0.035, 0.008], [0.008, 0.02], [0.006, 0.09], [0.03, 0.12], [0.046, 0.17], [0.045, 0.2], [0.04, 0.2], [0.04, 0.17], [0.028, 0.13], [0.0, 0.11]].map((p) => new THREE.Vector2(p[0], p[1]));
    return new THREE.LatheGeometry(pts, 14);
  }
  function geoSaia(rTop: number, rBot: number, h: number) { // saia da toalha com dobras que crescem para baixo
    const g = new THREE.CylinderGeometry(rTop, rBot, h, 120, 14, true), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = (h / 2 - y) / h, a = Math.atan2(z, x);
      const f = (Math.sin(a * 24) * 0.5 + Math.sin(a * 41 + 1.3) * 0.3 + Math.sin(a * 9 + 0.4) * 0.2) * 0.05 * t * t, r = Math.hypot(x, z) + f;
      p.setXYZ(i, Math.cos(a) * r, y, Math.sin(a) * r);
    }
    g.computeVertexNormals();
    return g;
  }
  function brilho(x: number, y: number, z: number) {
    glows.push(x, y, z);
  }
  function criarBrilhos(cor: string, tam: number) {
    if (!glows.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(glows, 3));
    raiz.add(new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex(), size: tam, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: K(cor) })));
  }
  function luzes(pontos: [number[], number[], number?][], cor?: string) { // cordão de luzes entre dois pontos, com a curva natural do fio
    const seg: number[] = [], bulbs: Inst[] = [];
    for (const p of pontos) {
      const a = p[0], b = p[1], n = Math.max(8, Math.round(Math.hypot(b[0] - a[0], b[2] - a[2]) * 1.4)), sag = p[2] == null ? 0.7 : p[2];
      let prev: number[] | null = null;
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t, y = a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t);
        if (prev) seg.push(prev[0], prev[1], prev[2], x, y, z);
        prev = [x, y, z];
        if (i > 0 && i < n) {
          bulbs.push({ x, y: y - 0.1, z });
          brilho(x, y - 0.1, z);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
    raiz.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: K("#2a2427") })));
    instanciar(new THREE.SphereGeometry(0.06, 8, 6), emis(cor || "#FFE0A6"), bulbs, false);
  }
  let geoFolhaCache: THREE.BufferGeometry | null = null;
  function geoFolha() { // copa de árvore: esfera irregular, normais suaves e sombreada embaixo
    if (geoFolhaCache) return geoFolhaCache;
    let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 2);
    g.deleteAttribute("normal");
    g.deleteAttribute("uv");
    g = BufferGeometryUtils.mergeVertices(g);
    const p = g.attributes.position, cs: number[] = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = vn(x * 1.7 + y * 1.1 + 5, z * 1.7 + y * 0.9 + 9, 3, 1000, 1000), r = 1 + (n - 0.5) * 0.75;
      p.setXYZ(i, x * r, y * r * 0.88, z * r);
      const k = 0.5 + 0.5 * ((y + 1) / 2);
      cs.push(k, k, k);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cs, 3));
    g.computeVertexNormals();
    return (geoFolhaCache = g);
  }
  function arvores(pos: number[][], escala: number, cores: string[]) {
    const tr: Inst[] = [], fo: Inst[] = [];
    for (const p of pos) {
      const s = (escala || 1) * (0.8 + rnd() * 0.6);
      tr.push({ x: p[0], y: 1.8 * s, z: p[1], sx: s, ry: rnd() * TAU });
      for (let k = 0; k < 5; k++)
        fo.push({ x: p[0] + (rnd() - 0.5) * 2.6 * s, y: (3.5 + k * 0.8) * s, z: p[1] + (rnd() - 0.5) * 2.6 * s, sx: (2.0 - k * 0.2) * s * (0.85 + rnd() * 0.3), ry: rnd() * TAU, cor: cores[(rnd() * cores.length) | 0] });
    }
    instanciar(new THREE.CylinderGeometry(0.26, 0.42, 3.6, 10), std("#5C4330", 0.95), tr, true);
    instanciar(geoFolha(), std("#ffffff", 0.9, { vertexColors: true }), fo, true);
  }
  function arco(x: number, z: number, h: number, cor: string, flores: string[], drape: boolean) {
    const m = std(cor, 0.5);
    caixa(0.16, h, 0.16, m, x - 1.9, h / 2, z, true);
    caixa(0.16, h, 0.16, m, x + 1.9, h / 2, z, true);
    const top = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.08, 10, 40, Math.PI), m);
    top.position.set(x, h, z);
    add(top, true);
    const fl: Inst[] = [], fo: Inst[] = [];
    for (let i = 0; i <= 90; i++) {
      const a = (i / 90) * Math.PI;
      fl.push({ x: x + Math.cos(a) * 1.9 + (rnd() - 0.5) * 0.4, y: h + Math.sin(a) * 1.9 + (rnd() - 0.5) * 0.4, z: z + (rnd() - 0.5) * 0.35, sx: 0.1 + rnd() * 0.12, cor: flores[(rnd() * flores.length) | 0] });
      fo.push({ x: x + Math.cos(a) * 1.9, y: h + Math.sin(a) * 1.9, z: z + (rnd() - 0.5) * 0.2, sx: 0.3, sy: 0.07, sz: 0.14, ry: rnd() * TAU, rz: (rnd() - 0.5) * 2, cor: "#5E7F4F" });
    }
    for (let k = 0; k < 36; k++) {
      const s = k % 2 ? 1 : -1;
      fl.push({ x: x + s * 1.9 + (rnd() - 0.5) * 0.4, y: 0.3 + rnd() * h * 0.85, z: z + (rnd() - 0.5) * 0.35, sx: 0.1 + rnd() * 0.1, cor: flores[(rnd() * flores.length) | 0] });
    }
    instanciar(new THREE.SphereGeometry(1, 10, 8), std("#ffffff", 0.8), fl, true);
    instanciar(new THREE.SphereGeometry(1, 8, 6), std("#ffffff", 0.9), fo, false);
    if (drape) {
      const tec = new THREE.MeshStandardMaterial({ color: K("#FFFFFF"), side: THREE.DoubleSide, transparent: true, opacity: 0.82, roughness: 0.95 });
      for (const s2 of [-1, 1]) {
        const d = new THREE.PlaneGeometry(0.9, h + 0.6, 24, 6), p = d.attributes.position;
        for (let q = 0; q < p.count; q++) p.setZ(q, Math.sin(p.getX(q) * 14) * 0.05);
        d.computeVertexNormals();
        const dm = new THREE.Mesh(d, tec);
        dm.position.set(x + s2 * 1.55, (h + 0.6) / 2 - 0.1, z);
        add(dm, false);
      }
    }
  }
  function lustre(x: number, y: number, z: number) {
    const dour = std("#C9A66B", 0.3, { metalness: 0.85, envMapIntensity: 1.2 });
    for (const r of [[1.1, 0, 0.07], [0.6, 0.5, 0.06]]) {
      const rg = new THREE.Mesh(new THREE.TorusGeometry(r[0], r[2], 10, 40), dour);
      rg.rotation.x = Math.PI / 2;
      rg.position.set(x, y + r[1], z);
      add(rg, true);
    }
    cil(0.03, 0.03, 1.6, dour, x, y + 1.3, z, 6, false);
    const cr: Inst[] = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU;
      cr.push({ x: x + Math.cos(a) * 1.1, y: y - 0.12, z: z + Math.sin(a) * 1.1, ry: a, sx: 1, sy: 2.2 });
    }
    for (let j = 0; j < 10; j++) {
      const a2 = (j / 10) * TAU;
      cr.push({ x: x + Math.cos(a2) * 0.6, y: y + 0.4, z: z + Math.sin(a2) * 0.6, ry: a2, sx: 0.8, sy: 1.8 });
    }
    instanciar(new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.6, envMapIntensity: 2 }), cr, false);
    for (let k = 0; k < 14; k++) {
      const a3 = (k / 14) * TAU;
      brilho(x + Math.cos(a3) * 1.1, y + 0.14, z + Math.sin(a3) * 1.1);
    }
    for (let q = 0; q < 8; q++) {
      const a4 = (q / 8) * TAU;
      brilho(x + Math.cos(a4) * 0.6, y + 0.62, z + Math.sin(a4) * 0.6);
    }
    const b: Inst[] = [];
    for (let m = 0; m < 14; m++) {
      const a5 = (m / 14) * TAU;
      b.push({ x: x + Math.cos(a5) * 1.1, y: y + 0.12, z: z + Math.sin(a5) * 1.1 });
    }
    instanciar(new THREE.SphereGeometry(0.06, 8, 6), emis("#FFE8B8"), b, false);
  }

  /* ---------- Ambiente: luz refletida por todo o cenário (reflexos nos pratos, copos e mármore) ---------- */
  function ambiente(c: SceneDef) {
    const es = new THREE.Scene();
    if (c.externo) {
      es.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ map: tCeuImagem(c), side: THREE.BackSide })));
      const ch = new THREE.Mesh(new THREE.CircleGeometry(60, 24), new THREE.MeshBasicMaterial({ color: K(c.chao!) }));
      ch.rotation.x = -Math.PI / 2;
      ch.position.y = -0.4;
      es.add(ch);
    } else {
      es.add(new THREE.Mesh(new THREE.SphereGeometry(60, 24, 12), new THREE.MeshBasicMaterial({ color: K(c.fundo!).multiplyScalar(1.6), side: THREE.BackSide })));
      for (const p of [[-20, 30, -10], [20, 30, -10], [0, 30, 14], [-25, 20, 18], [25, 20, 18]]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 14), new THREE.MeshBasicMaterial({ color: K(c.sol.cor).multiplyScalar(5) }));
        b.position.set(p[0], p[1], p[2]);
        b.lookAt(0, 0, 0);
        es.add(b);
      }
    }
    if (envRT) envRT.dispose();
    envRT = pmrem.fromScene(es, 0.03);
    scene.environment = envRT.texture;
    es.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) (m.material as THREE.Material).dispose();
    });
  }

  /* ---------- Construtores dos cenários (ambiente; as mesas vêm depois) ---------- */
  const CONS: Record<SceneId, (c: SceneDef, sala: [number, number]) => void> = {
    jardim(c, sala) {
      const W = sala[0], D = sala[1], gr = tGrama();
      const ceu = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: tCeuImagem(c), side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false }));
      raiz.add(ceu);
      const gram = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), std("#ffffff", 1, { map: gr.map, bumpMap: gr.bump, bumpScale: 0.2, envMapIntensity: 0.3 }));
      gram.rotation.x = -Math.PI / 2;
      add(gram, false, true);
      const dq = tTabuas("deque", false, [[160, 120, 82], [190, 148, 104]], 8, 3, 2.5);
      caixa(12.4, 0.12, 10.4, std("#ffffff", 0.72, { map: dq.map, bumpMap: dq.bump, bumpScale: 0.5 }), 0, 0.06, 5, false, true);
      const mad = std("#F1EBE1", 0.62);
      for (const p of [[-6, 0], [6, 0], [-6, 10], [6, 10]]) caixa(0.3, 4.2, 0.3, mad, p[0], 2.1, p[1], true);
      for (const z of [0, 10]) caixa(12.6, 0.28, 0.3, mad, 0, 4.2, z, true);
      for (let i = -5; i <= 5; i += 1.25) caixa(0.16, 0.16, 10.6, mad, i, 4.4, 5, true);
      luzes([[[-6, 4.1, 0], [6, 4.1, 10], 0.6], [[6, 4.1, 0], [-6, 4.1, 10], 0.6], [[-6, 4.1, 5], [6, 4.1, 5], 0.8], [[-6, 4.1, 2.5], [6, 4.1, 2.5], 0.7], [[-6, 4.1, 7.5], [6, 4.1, 7.5], 0.7]]);
      const lan: Inst[] = [];
      for (const p of [[-6, 1], [6, 1], [-6, 9], [6, 9]]) lan.push({ x: p[0] * 0.98, y: 3.2, z: p[1] });
      instanciar(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 10), std("#2b2527", 0.5, { metalness: 0.4 }), lan, true);
      lan.forEach((p) => brilho(p.x, p.y, p.z));
      arco(0, -12, 3.6, "#FFFFFF", c.flores, true);
      const ps: number[][] = [];
      for (let a = 0; a < 34; a++) {
        const t = Math.PI * (1 + 1.18 * (a / 34)) - 0.09 * Math.PI, rx = W / 2 + 6 + rnd() * 9, rz = D / 2 + 3 + rnd() * 9;
        ps.push([Math.cos(t) * rx, Math.sin(t) * rz - 2]);
      }
      arvores(ps, 1.15, ["#4A7545", "#5A8650", "#68934F", "#3F6B3D", "#7A9C58"]);
      const fl: Inst[] = [], fo: Inst[] = [];
      for (let k = 0; k < 150; k++) {
        const tt = rnd() * TAU, rr = W / 2 - 0.5 + rnd() * 2, fx = Math.cos(tt) * rr * 0.98, fz = Math.sin(tt) * (D / 2 - 1) - 2;
        fl.push({ x: fx, y: 0.28, z: fz, sx: 0.14 + rnd() * 0.1, cor: c.flores[(rnd() * 3) | 0] });
        fo.push({ x: fx, y: 0.12, z: fz, sx: 0.3, sy: 0.12, sz: 0.3, ry: rnd() * TAU, cor: "#58774A" });
      }
      instanciar(new THREE.SphereGeometry(1, 8, 6), std("#ffffff", 0.8), fl, false);
      instanciar(new THREE.SphereGeometry(1, 8, 6), std("#ffffff", 0.9), fo, false);
    },
    classico(c, sala) {
      const W = sala[0], D = sala[1], H = 9, mm = tMarmore(), pq = tParquet();
      const piso = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std("#ffffff", 0.2, { map: mm.map, bumpMap: mm.bump, bumpScale: 0.4, envMapIntensity: 1.1 }));
      piso.rotation.x = -Math.PI / 2;
      mm.map.repeat.set(W / 3.6, D / 3.6);
      mm.bump.repeat.set(W / 3.6, D / 3.6);
      add(piso, false, true);
      const pt = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), std("#ffffff", 0.3, { map: pq.map, bumpMap: pq.bump, bumpScale: 0.5, envMapIntensity: 0.9 }));
      pq.map.repeat.set(2.8, 2.2);
      pq.bump.repeat.set(2.8, 2.2);
      pt.rotation.x = -Math.PI / 2;
      pt.position.set(0, 0.02, 4);
      add(pt, false, true);
      const rb = tReboco("reboco", [238, 229, 220], 8, 3), pm = std("#ffffff", 0.9, { map: rb.map, bumpMap: rb.bump, bumpScale: 0.08, envMapIntensity: 0.4 });
      caixa(W, H, 0.4, pm, 0, H / 2, -D / 2, false, true);
      caixa(0.4, H, D, pm, -W / 2, H / 2, 0, false, true);
      caixa(0.4, H, D, pm, W / 2, H / 2, 0, false, true);
      const mold = std("#F7F2EA", 0.55);
      caixa(W, 0.7, 0.18, mold, 0, 0.35, -D / 2 + 0.28, false, true);
      caixa(0.18, 0.7, D, mold, -W / 2 + 0.28, 0.35, 0, false, true);
      caixa(0.18, 0.7, D, mold, W / 2 - 0.28, 0.35, 0, false, true);
      for (let z0 = -D / 2 + 2; z0 <= D / 2 - 2; z0 += 6) {
        caixa(0.1, 3.4, 4, mold, -W / 2 + 0.3, 2.6, z0 + 3, false, true);
        caixa(0.1, 3.4, 4, mold, W / 2 - 0.3, 2.6, z0 + 3, false, true);
      }
      const col: Inst[] = [];
      for (const s of [-1, 1]) for (let z = -D / 2 + 3; z <= D / 2 - 2; z += 6) col.push({ x: s * (W / 2 - 1.2), y: H / 2, z });
      const mc = std("#F6F0E8", 0.45, { envMapIntensity: 0.8 });
      instanciar(new THREE.CylinderGeometry(0.55, 0.62, H, 28), mc, col, true);
      instanciar(new THREE.BoxGeometry(1.5, 0.5, 1.5), mc, col.map((p) => ({ x: p.x, y: 0.25, z: p.z })), true);
      instanciar(new THREE.BoxGeometry(1.5, 0.5, 1.5), mc, col.map((p) => ({ x: p.x, y: H - 0.25, z: p.z })), true);
      // cortinas de veludo com pregas de verdade
      const cg = new THREE.PlaneGeometry(2.4, H - 1.3, 60, 6), cp = cg.attributes.position;
      for (let q = 0; q < cp.count; q++) cp.setZ(q, Math.sin(cp.getX(q) * 11) * 0.16 + Math.sin(cp.getX(q) * 27) * 0.04);
      cg.computeVertexNormals();
      const cortina = std("#6B2A45", 0.72, { side: THREE.DoubleSide, envMapIntensity: 0.5 }), cs2: Inst[] = [];
      for (let i = -3; i <= 3; i++) cs2.push({ x: i * 2.45, y: (H - 1.3) / 2 + 0.3, z: -D / 2 + 1.1 });
      instanciar(cg, cortina, cs2, true);
      caixa(W - 6, 0.5, 0.5, std("#C9A66B", 0.3, { metalness: 0.8 }), 0, H - 0.8, -D / 2 + 1.1, true);
      caixa(9, 0.7, 4, std("#5E2B4E", 0.6), 0, 0.35, -D / 2 + 3.4, true, true);
      caixa(9.4, 0.08, 4.4, std("#E8DDD1", 0.5), 0, 0.72, -D / 2 + 3.4, false, true);
      for (const p of [[0, 3], [-9, 3], [9, 3], [0, -4], [-10, -4], [10, -4]]) lustre(p[0], H - 1.7, p[1]);
      void c;
    },
    rustico(c, sala) {
      const W = sala[0], D = sala[1], H = 8;
      const fl = tTabuas("piso_r", true, [[122, 90, 64], [150, 114, 82]], 8, W / 8, D / 8), pa = tTabuas("parede_r", false, [[104, 74, 52], [128, 94, 66]], 8, 6, 2);
      const piso = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std("#ffffff", 0.62, { map: fl.map, bumpMap: fl.bump, bumpScale: 0.6, envMapIntensity: 0.5 }));
      piso.rotation.x = -Math.PI / 2;
      fl.map.repeat.set(W / 8, D / 8);
      fl.bump.repeat.set(W / 8, D / 8);
      add(piso, false, true);
      const pm = std("#ffffff", 0.85, { map: pa.map, bumpMap: pa.bump, bumpScale: 0.6, envMapIntensity: 0.3 });
      caixa(W, H, 0.4, pm, 0, H / 2, -D / 2, false, true);
      caixa(0.4, H, D, pm, -W / 2, H / 2, 0, false, true);
      caixa(0.4, H, D, pm, W / 2, H / 2, 0, false, true);
      const vig = std("#3E2C20", 0.85);
      for (let x = -W / 2 + 4; x <= W / 2 - 3; x += 6) caixa(0.5, 0.6, D, vig, x, H - 0.4, 0, true);
      for (let z = -D / 2 + 3; z <= D / 2; z += 7) caixa(W, 0.4, 0.4, vig, 0, H - 1.1, z, true);
      // portão de celeiro ao fundo
      const port = std("#2E2019", 0.8);
      caixa(5.2, 5.4, 0.2, port, -2.7, 2.7, -D / 2 + 0.3, false, true);
      caixa(5.2, 5.4, 0.2, port, 2.7, 2.7, -D / 2 + 0.3, false, true);
      for (const px of [-2.7, 2.7]) {
        for (const d of [-1, 1]) {
          const br = caixa(0.18, 6.4, 0.1, vig, px, 2.7, -D / 2 + 0.45, false, true);
          br.rotation.z = d * 0.77;
        }
        caixa(5.2, 0.2, 0.1, vig, px, 4.6, -D / 2 + 0.45, false, true);
        caixa(5.2, 0.2, 0.1, vig, px, 0.9, -D / 2 + 0.45, false, true);
      }
      const lz: [number[], number[], number][] = [];
      for (let q = -D / 2 + 4; q <= D / 2 - 2; q += 5) lz.push([[-W / 2 + 1, H - 1.3, q], [W / 2 - 1, H - 1.3, q], 1.1]);
      lz.push([[-W / 2 + 1, H - 1.3, -D / 2 + 2], [W / 2 - 1, H - 1.3, D / 2 - 2], 1.2], [[W / 2 - 1, H - 1.3, -D / 2 + 2], [-W / 2 + 1, H - 1.3, D / 2 - 2], 1.2]);
      luzes(lz);
      const bar: Inst[] = [];
      for (let b = 0; b < 6; b++) bar.push({ x: -W / 2 + 2.2 + (b % 3) * 1.3, y: 0.55, z: D / 2 - 3 - Math.floor(b / 3) * 1.4 });
      instanciar(new THREE.CylinderGeometry(0.5, 0.45, 1.1, 18), std("#6A4429", 0.7), bar, true);
      instanciar(new THREE.TorusGeometry(0.48, 0.02, 6, 24), std("#2B2527", 0.4, { metalness: 0.6 }), bar.map((p) => ({ x: p.x, y: p.y + 0.3, z: p.z, rx: Math.PI / 2 })), false);
      const fd: Inst[] = [];
      for (let f = 0; f < 5; f++) fd.push({ x: W / 2 - 2.5 - (f % 3) * 1.1, y: 0.3 + Math.floor(f / 3) * 0.6, z: D / 2 - 3 });
      instanciar(new THREE.BoxGeometry(1, 0.6, 0.6), std("#D8B96A", 0.95), fd, true);
      caixa(8, 0.5, 3.2, std("#5E4330", 0.8), 0, 0.25, -D / 2 + 2.4 + 0.8, true, true);
      const pend: Inst[] = [];
      for (const x of [-8, 0, 8])
        for (const z of [-3, 4]) {
          pend.push({ x, y: H - 2.6, z });
          brilho(x, H - 2.9, z);
        }
      instanciar(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 5), std("#2B2527", 0.5), pend.map((p) => ({ x: p.x, y: H - 1.4, z: p.z })), false);
      instanciar(new THREE.ConeGeometry(0.4, 0.4, 16, 1, true), std("#2B2527", 0.5, { side: THREE.DoubleSide, metalness: 0.4 }), pend.map((p) => ({ x: p.x, y: p.y - 0.1, z: p.z })), true);
      void c;
    },
  };

  /* ---------- Montagem: ambiente, mesas postas e cadeiras ---------- */
  function limpar() {
    while (raiz.children.length) {
      const o = raiz.children.pop()!;
      o.traverse((n) => {
        const m = n as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) => mt.dispose());
      });
    }
    geoFolhaCache = null; // a geometria da copa foi descartada junto
    chairGroups = [];
    ribbonBase = [];
    glows = [];
    ribbons = null;
    targetRing = null;
    searchRing = null;
  }

  function construir() {
    limpar();
    seed = 7;
    const c = layout.scene, sala = layout.sala;
    renderer.toneMappingExposure = c.expo || 1;
    if (c.externo) {
      scene.background = K(c.ceu!.horiz);
      scene.fog = new THREE.Fog(K(c.neblina!), 90, 270);
    } else {
      scene.background = K(c.fundo!);
      scene.fog = null;
    }
    hemi.color.copy(K(c.hemi[0]));
    hemi.groundColor.copy(K(c.hemi[1]));
    hemi.intensity = c.hemi[2];
    sol.color.copy(K(c.sol.cor));
    sol.intensity = c.sol.int;
    sol.position.set(c.sol.pos[0], c.sol.pos[1], c.sol.pos[2]);
    sol.target.position.set(0, 0, 2);
    const sc = sol.shadow.camera, R = Math.max(sala[0], sala[1]) * 0.62;
    sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = 150;
    sc.updateProjectionMatrix();
    ambiente(c);
    CONS[c.id](c, sala);

    // toalha, pratos, copos, flores e velas
    const lin = tLinho("linho", 30, 4), lin2 = tLinho("linho2", 6, 1);
    const toalha = c.toalha ? std(c.toalha, 0.9, { bumpMap: lin.bump, bumpScale: 0.6 }) : null;
    const madT = tTabuas("mesa_r", false, [[86, 56, 36], [124, 84, 56]], 5, 2, 1);
    const mesaMat = toalha || std("#ffffff", 0.55, { map: madT.map, bumpMap: madT.bump, bumpScale: 1.2 });
    const flor: Inst[] = [], folha: Inst[] = [], vela: Inst[] = [], tampos: Inst[] = [], saias: Inst[] = [], pes: Inst[] = [], prato: Inst[] = [], carga: Inst[] = [], gua: Inst[] = [], copo: Inst[] = [];
    let totalCad = 0;
    for (const t of layout.slots) {
      const pos: ChairGroup["pos"] = [];
      if (t.forma === "round") {
        const k = t.r / 0.97;
        tampos.push({ x: t.x, y: 0.76, z: t.z, ry: rnd() * TAU, sx: k, sy: 1, sz: k });
        if (c.toalha) saias.push({ x: t.x, y: 0.38, z: t.z, ry: rnd() * TAU, sx: k, sy: 1, sz: k });
        else pes.push({ x: t.x, y: 0.38, z: t.z });
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * TAU;
          flor.push({ x: t.x + Math.cos(a) * 0.15, y: 0.98 + (i % 2) * 0.05, z: t.z + Math.sin(a) * 0.15, sx: 0.085 + (i % 3) * 0.015, cor: c.flores[i % c.flores.length] });
          folha.push({ x: t.x + Math.cos(a + 0.4) * 0.22, y: 0.92, z: t.z + Math.sin(a + 0.4) * 0.22, sx: 0.12, sy: 0.025, sz: 0.06, ry: -a, rz: 0.4, cor: "#5E7F4F" });
        }
        flor.push({ x: t.x, y: 1.1, z: t.z, sx: 0.12, cor: c.flores[0] });
        if (c.velas)
          for (let v = 0; v < 3; v++) {
            const av = (v / 3) * TAU + 0.5;
            vela.push({ x: t.x + Math.cos(av) * 0.5 * k, y: 0.86, z: t.z + Math.sin(av) * 0.5 * k });
          }
        for (let i = 0; i < t.cadeiras; i++) {
          const ak = (i / t.cadeiras) * TAU;
          pos.push({ x: t.x + Math.cos(ak) * (t.r + 0.35), z: t.z + Math.sin(ak) * (t.r + 0.35), ry: -ak - Math.PI / 2, px: t.x + Math.cos(ak) * t.r * 0.72, pz: t.z + Math.sin(ak) * t.r * 0.72 });
        }
      } else {
        const w = t.w, d = t.d;
        const tp = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, d), mesaMat);
        tp.position.set(t.x, 0.77, t.z);
        add(tp, true, true);
        if (c.toalha) {
          const sk = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.74, d - 0.04), toalha!);
          sk.position.set(t.x, 0.38, t.z);
          add(sk, true, true);
        } else {
          for (const s of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cil(0.06, 0.06, 0.75, std("#4A3223", 0.8), t.x + s[0] * (w / 2 - 0.2), 0.37, t.z + s[1] * (d / 2 - 0.2), 8, true);
        }
        const runner = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.015, 0.32), std(c.id === "rustico" ? "#EBDCC3" : "#F2D7E7", 0.9, { bumpMap: lin2.bump, bumpScale: 0.5 }));
        runner.position.set(t.x, 0.81, t.z);
        add(runner, false, true);
        const n = Math.round(w / 1.4);
        for (let f = 0; f < n; f++) {
          const fx = t.x - w / 2 + (f + 0.5) * (w / n);
          for (let q = 0; q < 5; q++) {
            flor.push({ x: fx + (rnd() - 0.5) * 0.28, y: 0.93 + rnd() * 0.1, z: t.z + (rnd() - 0.5) * 0.2, sx: 0.08 + rnd() * 0.04, cor: c.flores[(rnd() * c.flores.length) | 0] });
            folha.push({ x: fx + (rnd() - 0.5) * 0.4, y: 0.86, z: t.z + (rnd() - 0.5) * 0.25, sx: 0.14, sy: 0.025, sz: 0.06, ry: rnd() * TAU, cor: "#5E7F4F" });
          }
          if (c.velas) vela.push({ x: fx + 0.35, y: 0.86, z: t.z });
        }
        if (t.noivos) {
          for (let j = 0; j < t.cadeiras; j++) {
            const cx = t.x - w / 2 + 0.35 + (j + 0.5) * ((w - 0.7) / t.cadeiras);
            pos.push({ x: cx, z: t.z + d / 2 + 0.55, ry: Math.PI, px: cx, pz: t.z + d / 2 - 0.3 });
          }
        } else {
          const lado = Math.ceil(t.cadeiras / 2);
          for (let l = 0; l < t.cadeiras; l++) {
            const up = l < lado, idx = up ? l : l - lado, cx2 = t.x - w / 2 + 0.45 + (idx + 0.5) * ((w - 0.9) / lado);
            pos.push({ x: cx2, z: t.z + (up ? -1 : 1) * (d / 2 + 0.55), ry: up ? 0 : Math.PI, px: cx2, pz: t.z + (up ? -1 : 1) * (d / 2 - 0.3) });
          }
        }
      }
      const yt = t.forma === "round" ? 0.797 : 0.808;
      for (const p of pos) {
        const fx2 = Math.sin(p.ry), fz2 = Math.cos(p.ry), rx2 = Math.cos(p.ry), rz2 = -Math.sin(p.ry);
        carga.push({ x: p.px, y: yt + 0.004, z: p.pz });
        prato.push({ x: p.px, y: yt + 0.016, z: p.pz });
        gua.push({ x: p.px, y: yt + 0.03, z: p.pz, ry: 0.5 + p.px });
        copo.push({ x: p.px + fx2 * 0.2 + rx2 * 0.1, y: yt, z: p.pz + fz2 * 0.2 + rz2 * 0.1 });
        copo.push({ x: p.px + fx2 * 0.18 + rx2 * 0.2, y: yt, z: p.pz + fz2 * 0.18 + rz2 * 0.2 });
      }
      chairGroups.push({ tableId: t.id, start: totalCad, n: pos.length, pos });
      totalCad += pos.length;
    }
    if (tampos.length) {
      instanciar(new THREE.CylinderGeometry(0.97, 0.97, 0.07, 48), mesaMat, tampos, true);
      if (saias.length) instanciar(geoSaia(0.97, 1.07, 0.74), toalha!, saias, true);
      if (pes.length) {
        instanciar(new THREE.CylinderGeometry(0.1, 0.1, 0.74, 12), std("#4A3223", 0.8), pes, true);
        instanciar(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 24), std("#4A3223", 0.8), pes.map((p) => ({ x: p.x, y: 0.03, z: p.z })), true);
      }
    }
    instanciar(new THREE.CylinderGeometry(0.18, 0.18, 0.008, 28), std(c.carga, 0.3, { metalness: 0.5, envMapIntensity: 1 }), carga, true);
    instanciar(new THREE.CylinderGeometry(0.15, 0.1, 0.022, 28), std("#FFFFFF", 0.18, { envMapIntensity: 1 }), prato, true);
    instanciar(new THREE.BoxGeometry(0.12, 0.014, 0.12), std(c.guardanapo, 0.9, { bumpMap: lin2.bump, bumpScale: 0.5 }), gua, true);
    instanciar(geoCopo(), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.32, envMapIntensity: 1.8, depthWrite: false }), copo, false);
    instanciar(new THREE.SphereGeometry(1, 10, 8), std("#ffffff", 0.75), flor, true);
    instanciar(new THREE.SphereGeometry(1, 8, 6), std("#ffffff", 0.9), folha, false);
    if (vela.length) {
      instanciar(new THREE.CylinderGeometry(0.025, 0.025, 0.14, 10), std("#FFF6E8", 0.7), vela, false);
      instanciar(new THREE.SphereGeometry(0.022, 8, 6), emis("#FFD08A"), vela.map((p) => ({ x: p.x, y: p.y + 0.1, z: p.z, sy: 1.5 })), false);
      vela.forEach((p) => brilho(p.x, p.y + 0.1, p.z));
    }
    // cadeiras de verdade (frame e almofada) e a fita colorida do convidado
    if (totalCad > 0) {
      const cadIM = new THREE.InstancedMesh(geoCadeira(c), std("#ffffff", 0.55, { vertexColors: true }), totalCad);
      ribbons = new THREE.InstancedMesh(geoFita(), std("#ffffff", 0.7, { vertexColors: true }), totalCad);
      for (const g of chairGroups)
        g.pos.forEach((p, i) => {
          const id = g.start + i;
          dummy.scale.set(1, 1, 1);
          dummy.rotation.set(0, p.ry, 0);
          dummy.position.set(p.x, 0, p.z);
          dummy.updateMatrix();
          cadIM.setMatrixAt(id, dummy.matrix);
          ribbonBase[id] = { x: p.x, z: p.z, ry: p.ry };
        });
      cadIM.castShadow = true;
      cadIM.receiveShadow = true;
      ribbons.castShadow = true;
      raiz.add(cadIM, ribbons);
    }
    const ag = new THREE.RingGeometry(1.75, 1.95, 48);
    targetRing = new THREE.Mesh(ag, new THREE.MeshBasicMaterial({ color: K("#E8B4D5"), side: THREE.DoubleSide, transparent: true, opacity: 0.95 }));
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.position.y = 0.2;
    targetRing.visible = false;
    raiz.add(targetRing);
    searchRing = new THREE.Mesh(ag.clone(), new THREE.MeshBasicMaterial({ color: K("#FFFFFF"), side: THREE.DoubleSide, transparent: true, opacity: 0.95 }));
    searchRing.rotation.x = -Math.PI / 2;
    searchRing.position.y = 0.21;
    searchRing.visible = false;
    raiz.add(searchRing);
    criarBrilhos(c.id === "classico" ? "#FFE2A8" : c.id === "rustico" ? "#FFD59A" : "#FFD79A", c.id === "classico" ? 1.4 : 1.0);
    paintRibbons();
    renderer.shadowMap.needsUpdate = true;
    built = true;
  }

  /** A fita do encosto ganha a cor do grupo de quem senta; cadeira vazia fica sem fita. */
  function paintRibbons() {
    if (!ribbons) return;
    const c = new THREE.Color();
    for (const g of chairGroups) {
      const colors = fills[g.tableId] ?? [];
      for (let i = 0; i < g.n; i++) {
        const b = ribbonBase[g.start + i], ocup = i < colors.length;
        dummy.position.set(b.x, 0, b.z);
        dummy.rotation.set(0, b.ry, 0);
        dummy.scale.setScalar(ocup ? 1 : 0.0001);
        dummy.updateMatrix();
        ribbons.setMatrixAt(g.start + i, dummy.matrix);
        if (ocup) c.set(colors[i]).convertSRGBToLinear();
        else c.set(0xffffff);
        ribbons.setColorAt(g.start + i, c);
      }
    }
    ribbons.instanceMatrix.needsUpdate = true;
    if (ribbons.instanceColor) ribbons.instanceColor.needsUpdate = true;
  }

  /* ---------- Render sob demanda ---------- */
  let pedido = false;
  let anim: { t0: number; ms: number; p0: THREE.Vector3; a0: THREE.Vector3; p1: THREE.Vector3; a1: THREE.Vector3 } | null = null;
  const v3 = new THREE.Vector3();
  function pedirRender() {
    if (disposed || pedido) return;
    pedido = true;
    requestAnimationFrame(desenhar);
  }
  function desenhar() {
    pedido = false;
    if (disposed) return;
    if (anim) passoAnim();
    renderer.render(scene, camera);
    opts.onRender?.({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles });
    if (anim) pedirRender();
  }
  controls.addEventListener("change", pedirRender);
  controls.addEventListener("start", () => opts.onCameraGrab?.());
  function redimensionar() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pedirRender();
  }
  const resizeObs = new ResizeObserver(redimensionar);
  resizeObs.observe(host);
  const onContextLost = (e: Event) => {
    e.preventDefault();
    opts.onContextLost?.();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  /* ---------- Câmera ---------- */
  function irPara(pos: THREE.Vector3, alvo: THREE.Vector3, ms: number) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      camera.position.copy(pos);
      controls.target.copy(alvo);
      controls.update();
      pedirRender();
      return;
    }
    anim = { t0: performance.now(), ms: ms || 700, p0: camera.position.clone(), a0: controls.target.clone(), p1: pos, a1: alvo };
    pedirRender();
  }
  function passoAnim() {
    if (!anim) return;
    const k = Math.min(1, (performance.now() - anim.t0) / anim.ms), e = 1 - Math.pow(1 - k, 3);
    camera.position.lerpVectors(anim.p0, anim.p1, e);
    controls.target.lerpVectors(anim.a0, anim.a1, e);
    controls.update();
    if (k >= 1) anim = null;
  }
  function dist() {
    const s = layout.sala;
    return Math.max(s[0] * 1.0, s[1] * 1.15) * (host.clientWidth < 700 ? 1.6 : 1);
  }
  function poseCenario() {
    const d = dist();
    return { pos: new THREE.Vector3(d * 0.26, d * 0.4, d * 0.8), alvo: new THREE.Vector3(0, 0.6, 1) };
  }
  function posePanoramica() {
    const c = layout.scene, D = layout.sala[1], cz = c.externo ? D / 2 + 10 : D / 2 - 1.5;
    return { pos: new THREE.Vector3(0, c.externo ? 3.6 : 3.3, cz), alvo: new THREE.Vector3(0, c.externo ? 2.6 : 2.4, -D / 2 + (c.externo ? 6 : 4)) };
  }
  function poseTopo() {
    const d = dist();
    return { pos: new THREE.Vector3(0.001, d * 1.18, 0.8), alvo: new THREE.Vector3(0, 0, 0.5) };
  }
  function preset(nome: CameraPreset, rapido?: boolean) {
    const q = nome === "cenario" ? poseCenario() : nome === "panoramica" ? posePanoramica() : poseTopo();
    if (rapido) {
      camera.position.copy(q.pos);
      controls.target.copy(q.alvo);
      controls.update();
      pedirRender();
    } else irPara(q.pos, q.alvo, nome === "panoramica" ? 1100 : nome === "topo" ? 800 : 900);
  }
  function slotById(id: string | null | undefined) {
    return layout.slots.find((s) => s.id === id) ?? null;
  }
  /** Câmera na altura dos olhos de quem senta na mesa, olhando para a cabeceira. */
  function vistaDaMesa(id: string) {
    const t = slotById(id), n = layout.slots[0];
    if (!t) return;
    const dx = n.x - t.x, dz = n.z - t.z, len = Math.hypot(dx, dz) || 1, ux = dx / len, uz = dz / len;
    irPara(new THREE.Vector3(t.x - ux * 1.9, 1.3, t.z - uz * 1.9), new THREE.Vector3(n.x, 1.5, n.z - 2), 1000);
  }
  function irParaMesa(id: string) {
    const t = slotById(id);
    if (t) irPara(new THREE.Vector3(t.x + 5, 7, t.z + 9), new THREE.Vector3(t.x, 0.5, t.z), 900);
  }

  /* ---------- Escolher mesa pelo ponto ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  function pontoNoChao(cx: number, cy: number) {
    const r = canvas.getBoundingClientRect();
    if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return null;
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(plano, hit) ? hit.clone() : null;
  }
  function tableAtPoint(cx: number, cy: number): TableSlot | null {
    const p = pontoNoChao(cx, cy);
    if (!p) return null;
    let melhor: TableSlot | null = null, d2 = 1e9;
    for (const t of layout.slots) {
      const dx = Math.abs(p.x - t.x), dz = Math.abs(p.z - t.z);
      if (dx <= t.hx && dz <= t.hz) {
        const d = dx * dx + dz * dz;
        if (d < d2) { d2 = d; melhor = t; }
      }
    }
    return melhor;
  }
  let down: { x: number; y: number } | null = null;
  const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
  const onUp = (e: PointerEvent) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) { down = null; return; }
    down = null;
    opts.onTablePick?.(tableAtPoint(e.clientX, e.clientY));
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);

  function ringAt(ring: THREE.Mesh | null, t: TableSlot | null, grow: number) {
    if (!ring) return;
    if (!t) { ring.visible = false; return; }
    ring.position.x = t.x;
    ring.position.z = t.z;
    ring.scale.setScalar(t.forma === "round" ? grow * (t.r / 0.97) : Math.max(t.w, t.d + 2) / (grow > 1 ? 3 : 3.2));
    ring.visible = true;
  }

  /* ---------- API ---------- */
  function rebuild(sceneId: string) {
    layout = computeLayout(sceneId, tablesInput);
    construir();
    pedirRender();
  }
  return {
    /** Troca o cenário (ou monta pela primeira vez) e leva a câmera para a vista do salão. */
    setScene(id: string, mover = true) {
      rebuild(id);
      if (mover) preset("cenario", !built ? true : false);
      else pedirRender();
    },
    /** Mesas do painel. Refaz o cenário quando muda a quantidade, os nomes ou as capacidades. */
    setTables(tables: TableInput[]) {
      const same = tables.length === tablesInput.length && tables.every((t, i) => t.id === tablesInput[i].id && t.name === tablesInput[i].name && t.capacity === tablesInput[i].capacity);
      tablesInput = tables;
      if (!same && built) rebuild(layout.scene.id);
    },
    /** Cor de cada cadeira ocupada, por mesa. Só repinta as fitas. */
    setSeating(next: Record<string, string[]>) {
      fills = next;
      paintRibbons();
      pedirRender();
    },
    setDropTarget(id: string | null) {
      ringAt(targetRing, slotById(id), 1);
      pedirRender();
    },
    setSearchRing(id: string | null) {
      ringAt(searchRing, slotById(id), 1.15);
      pedirRender();
    },
    preset,
    irParaMesa,
    vistaDaMesa,
    tableAtPoint,
    slots: () => layout.slots,
    sala: () => layout.sala,
    /** Posição na tela (em px dentro do elemento do desenho) do rótulo de uma mesa. */
    project(id: string): { x: number; y: number; visible: boolean } | null {
      const t = slotById(id);
      if (!t) return null;
      v3.set(t.x, 1.7, t.z).project(camera);
      return { x: ((v3.x + 1) / 2) * host.clientWidth, y: ((1 - v3.y) / 2) * host.clientHeight, visible: v3.z <= 1 && v3.z >= -1 };
    },
    redraw: pedirRender,
    dispose() {
      disposed = true;
      resizeObs.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      controls.dispose();
      limpar();
      for (const t of Object.values(texCache)) {
        const pair = t as TexPair;
        if (pair.map) { pair.map.dispose(); pair.bump.dispose(); } else (t as THREE.Texture).dispose();
      }
      if (envRT) envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

export type Mesas3DEngine = ReturnType<typeof createMesas3DEngine>;
