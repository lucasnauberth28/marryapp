// Onde cada mesa do casamento fica em cada cenário. Puro: recebe as mesas do painel e devolve posições e medidas.
import { cenarioPorId, CENARIOS, type DefinicaoDoCenario, type FormatoDaMesa } from "./scenarios.ts";

export interface MesaDeEntrada {
  id: string;
  name: string;
  capacity: number;
}

export interface PosicaoDaMesa {
  id: string;
  nome: string;
  /** Lugares da mesa no painel (o que conta para sentar convidados). */
  cap: number;
  /** Cadeiras desenhadas: no máximo MAX_CHAIRS, para a cena não pesar. */
  cadeiras: number;
  forma: FormatoDaMesa;
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

export interface Disposicao {
  scene: DefinicaoDoCenario;
  /** Largura e profundidade da sala depois de crescer para caber todas as mesas. */
  sala: [number, number];
  slots: PosicaoDaMesa[];
}

export const MAXIMO_DE_CADEIRAS = 24;
export const ID_DA_MESA_DE_HONRA_DECORATIVA = "__cabeceira";

/** Mesas que o casal chamou de "dos noivos", "principal" etc. viram a cabeceira do cenário. */
export function ehNomeDeMesaDeHonra(name: string): boolean {
  const n = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  return /\bnoiv[oa]s?\b|\bprincipal\b|\bhonra\b|\bpadrinhos?\b/.test(n);
}

export function raioDaMesaRedonda(cap: number): number {
  return cap <= 8 ? 0.97 : Math.min(1.55, 0.97 + (cap - 8) * 0.075);
}

function arredondarParaDecimais(v: number) {
  return Math.round(v * 100) / 100;
}

function posicaoDaMesaDeHonra(scene: DefinicaoDoCenario, id: string, nome: string, cap: number, decor: boolean): PosicaoDaMesa {
  const cadeiras = decor ? 2 : Math.min(cap, MAXIMO_DE_CADEIRAS);
  const w = Math.max(decor ? 3.4 : 3.4, arredondarParaDecimais(Math.max(1, cadeiras) * 0.64));
  const d = 1.1;
  return { id, nome, cap: decor ? 0 : cap, cadeiras, forma: "rect", x: 0, z: scene.noivosZ, noivos: true, decor, r: 0, w, d, hx: w / 2 + 0.9, hz: d / 2 + 1.1 };
}

function posicaoDaMesaDeConvidados(scene: DefinicaoDoCenario, t: MesaDeEntrada, x: number, z: number): PosicaoDaMesa {
  const cap = Math.max(1, Math.round(t.capacity));
  const cadeiras = Math.min(cap, MAXIMO_DE_CADEIRAS);
  if (scene.forma === "round") {
    const r = arredondarParaDecimais(raioDaMesaRedonda(cadeiras));
    return { id: t.id, nome: t.name, cap, cadeiras, forma: "round", x, z, noivos: false, decor: false, r, w: 0, d: 0, hx: arredondarParaDecimais(r + 1.43), hz: arredondarParaDecimais(r + 1.43) };
  }
  const lado = Math.ceil(cadeiras / 2);
  const w = arredondarParaDecimais(Math.max(5.4, lado * 0.9 + 0.9));
  const d = 1.3;
  return { id: t.id, nome: t.name, cap, cadeiras, forma: "rect", x, z, noivos: false, decor: false, r: 0, w, d, hx: arredondarParaDecimais(w / 2 + 0.9), hz: arredondarParaDecimais(d / 2 + 1.1) };
}

/**
 * Distribui as mesas do casal no cenário: a cabeceira ao fundo e as demais em fileiras, preenchendo de dentro para
 * fora e alternando os lados, para um número ímpar ou pequeno de mesas continuar simétrico. Se faltar espaço, a sala cresce.
 */
export function calcularDisposicao(sceneId: string, tables: MesaDeEntrada[]): Disposicao {
  const scene = cenarioPorId(sceneId) ?? CENARIOS[0];
  const headIdx = tables.findIndex((t) => ehNomeDeMesaDeHonra(t.name));
  const slots: PosicaoDaMesa[] = [];

  if (headIdx >= 0) {
    const h = tables[headIdx];
    slots.push(posicaoDaMesaDeHonra(scene, h.id, h.name, Math.max(1, Math.round(h.capacity)), false));
  } else {
    slots.push(posicaoDaMesaDeHonra(scene, ID_DA_MESA_DE_HONRA_DECORATIVA, "Mesa dos noivos", 2, true));
  }

  const others = tables.filter((_, i) => i !== headIdx);
  const cols = scene.colunas.length;
  // Fileiras com tampos largos pedem mais espaço entre si
  const passo = scene.passoZ;
  let lastZ = scene.z0;
  others.forEach((t, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const z = arredondarParaDecimais(scene.z0 + row * passo);
    lastZ = z;
    slots.push(posicaoDaMesaDeConvidados(scene, t, scene.colunas[col], z));
  });

  const need = 2 * (lastZ + 7);
  const D = Math.max(scene.sala[1], arredondarParaDecimais(need));
  return { scene, sala: [scene.sala[0], D], slots };
}
