// Onde cada mesa do casamento fica em cada cenário. Puro: recebe as mesas do painel e devolve posições e medidas.
import { sceneById, SCENES, type SceneDef, type TableShape } from "./scenarios.ts";

export interface TableInput {
  id: string;
  name: string;
  capacity: number;
}

export interface TableSlot {
  id: string;
  nome: string;
  /** Lugares da mesa no painel (o que conta para sentar convidados). */
  cap: number;
  /** Cadeiras desenhadas: no máximo MAX_CHAIRS, para a cena não pesar. */
  cadeiras: number;
  forma: TableShape;
  x: number;
  z: number;
  /** Mesa dos noivos (cabeceira). */
  noivos: boolean;
  /** Enfeite: a cabeceira que o cenário desenha quando o casal não tem uma mesa com esse nome. Não recebe convidados. */
  decor: boolean;
  /** Raio do tampo (mesa redonda). */
  r: number;
  /** Largura e profundidade do tampo (mesa retangular). */
  w: number;
  d: number;
  /** Meia-largura e meia-profundidade da área em que o ponteiro "pega" a mesa. */
  hx: number;
  hz: number;
}

export interface Layout {
  scene: SceneDef;
  /** Largura e profundidade da sala depois de crescer para caber todas as mesas. */
  sala: [number, number];
  slots: TableSlot[];
}

export const MAX_CHAIRS = 24;
export const DECOR_HEAD_ID = "__cabeceira";

/** Mesas que o casal chamou de "dos noivos", "principal" etc. viram a cabeceira do cenário. */
export function isHeadTableName(name: string): boolean {
  const n = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  return /\bnoiv[oa]s?\b|\bprincipal\b|\bhonra\b|\bpadrinhos?\b/.test(n);
}

export function roundRadius(cap: number): number {
  return cap <= 8 ? 0.97 : Math.min(1.55, 0.97 + (cap - 8) * 0.075);
}

function round(v: number) {
  return Math.round(v * 100) / 100;
}

function headSlot(scene: SceneDef, id: string, nome: string, cap: number, decor: boolean): TableSlot {
  const cadeiras = decor ? 2 : Math.min(cap, MAX_CHAIRS);
  const w = Math.max(decor ? 3.4 : 3.4, round(Math.max(1, cadeiras) * 0.64));
  const d = 1.1;
  return { id, nome, cap: decor ? 0 : cap, cadeiras, forma: "rect", x: 0, z: scene.noivosZ, noivos: true, decor, r: 0, w, d, hx: w / 2 + 0.9, hz: d / 2 + 1.1 };
}

function guestSlot(scene: SceneDef, t: TableInput, x: number, z: number): TableSlot {
  const cap = Math.max(1, Math.round(t.capacity));
  const cadeiras = Math.min(cap, MAX_CHAIRS);
  if (scene.forma === "round") {
    const r = round(roundRadius(cadeiras));
    return { id: t.id, nome: t.name, cap, cadeiras, forma: "round", x, z, noivos: false, decor: false, r, w: 0, d: 0, hx: round(r + 1.43), hz: round(r + 1.43) };
  }
  const lado = Math.ceil(cadeiras / 2);
  const w = round(Math.max(5.4, lado * 0.9 + 0.9));
  const d = 1.3;
  return { id: t.id, nome: t.name, cap, cadeiras, forma: "rect", x, z, noivos: false, decor: false, r: 0, w, d, hx: round(w / 2 + 0.9), hz: round(d / 2 + 1.1) };
}

/**
 * Distribui as mesas do casal no cenário: a cabeceira ao fundo e as demais em fileiras, preenchendo de dentro para
 * fora e alternando os lados, para um número ímpar ou pequeno de mesas continuar simétrico. Se faltar espaço, a sala cresce.
 */
export function computeLayout(sceneId: string, tables: TableInput[]): Layout {
  const scene = sceneById(sceneId) ?? SCENES[0];
  const headIdx = tables.findIndex((t) => isHeadTableName(t.name));
  const slots: TableSlot[] = [];

  if (headIdx >= 0) {
    const h = tables[headIdx];
    slots.push(headSlot(scene, h.id, h.name, Math.max(1, Math.round(h.capacity)), false));
  } else {
    slots.push(headSlot(scene, DECOR_HEAD_ID, "Mesa dos noivos", 2, true));
  }

  const others = tables.filter((_, i) => i !== headIdx);
  const cols = scene.colunas.length;
  // Fileiras com tampos largos pedem mais espaço entre si
  const passo = scene.passoZ;
  let lastZ = scene.z0;
  others.forEach((t, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const z = round(scene.z0 + row * passo);
    lastZ = z;
    slots.push(guestSlot(scene, t, scene.colunas[col], z));
  });

  const need = 2 * (lastZ + 7);
  const D = Math.max(scene.sala[1], round(need));
  return { scene, sala: [scene.sala[0], D], slots };
}
