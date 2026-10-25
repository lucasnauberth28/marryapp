// Cenários das mesas em 3D: só dados (cores, luz, medidas e a grade onde as mesas se distribuem).
// Sem dependências de navegador nem de Three.js, para o layout poder ser testado no Node.

export type IdDoCenario = "jardim" | "classico" | "rustico";
export type FormatoDaMesa = "round" | "rect";

export interface DefinicaoDoCenario {
  id: IdDoCenario;
  nome: string;
  frase: string;
  /** Largura e profundidade da sala (ou do gramado) em metros; a profundidade cresce se faltar espaço para as mesas. */
  sala: [number, number];
  externo: boolean;
  /** Exposição do renderizador (brilho geral do cenário). */
  expo: number;
  ceu?: { topo: string; horiz: string; nuvem: string };
  neblina?: string;
  chao?: string;
  fundo?: string;
  sol: { cor: string; int: number; pos: [number, number, number] };
  hemi: [string, string, number];
  /** Cor da toalha; nulo = mesa de madeira à mostra. */
  toalha: string | null;
  cadeira: string;
  almofada: string;
  carga: string;
  guardanapo: string;
  flores: string[];
  velas: boolean;
  forma: FormatoDaMesa;
  /** Posições x das colunas, na ordem em que são preenchidas (alternando esquerda e direita para ficar simétrico). */
  colunas: number[];
  /** Primeira fileira de mesas (z) e a distância entre fileiras. */
  z0: number;
  passoZ: number;
  /** z da mesa dos noivos. */
  noivosZ: number;
}

export const CENARIOS: readonly DefinicaoDoCenario[] = [
  {
    id: "jardim",
    nome: "Jardim ao entardecer",
    frase: "Gramado, pérgola com luzes e arco de flores sob o céu do fim de tarde.",
    sala: [44, 38],
    externo: true,
    expo: 0.92,
    ceu: { topo: "#4E84C4", horiz: "#F7C79B", nuvem: "#FFE2CC" },
    neblina: "#EBC8AA",
    chao: "#6F8F55",
    sol: { cor: "#FFD2A0", int: 2.3, pos: [-24, 15, 16] },
    hemi: ["#BFD6F0", "#6E8456", 0.55],
    toalha: "#FFFFFF",
    cadeira: "#EDE6D8",
    almofada: "#F6F1E8",
    carga: "#CDBA92",
    guardanapo: "#F2D7E7",
    flores: ["#F2D7E7", "#FFFFFF", "#D79BBB"],
    velas: true,
    forma: "round",
    colunas: [-9, 9, -14.5, 14.5],
    z0: -1,
    passoZ: 6.5,
    noivosZ: -8.4,
  },
  {
    id: "classico",
    nome: "Salão clássico",
    frase: "Colunas, lustres de cristal, mármore e cortinas de veludo em um salão de festas.",
    sala: [42, 30],
    externo: false,
    expo: 1.0,
    fundo: "#2A2025",
    sol: { cor: "#FFE6C4", int: 1.5, pos: [-9, 24, 8] },
    hemi: ["#FFEBD2", "#5B4650", 0.6],
    toalha: "#F6EFE7",
    cadeira: "#C9A66B",
    almofada: "#F4EDE3",
    carga: "#C9A66B",
    guardanapo: "#7A2F52",
    flores: ["#FFFFFF", "#F2D7E7", "#E3C9D8"],
    velas: true,
    forma: "round",
    colunas: [-7.4, 7.4, -13, 13],
    z0: -2.5,
    passoZ: 6,
    noivosZ: -8.2,
  },
  {
    id: "rustico",
    nome: "Galpão rústico",
    frase: "Madeira de verdade, vigas aparentes, mesas compridas e cordões de luz sobre a pista.",
    sala: [40, 28],
    externo: false,
    expo: 1.05,
    fundo: "#241B17",
    sol: { cor: "#FFD8A4", int: 1.3, pos: [-10, 22, 9] },
    hemi: ["#FFE3C0", "#503D31", 0.6],
    toalha: null,
    cadeira: "#8A6039",
    almofada: "#E4D3B8",
    carga: "#6E4B30",
    guardanapo: "#EBDCC3",
    flores: ["#F2D7E7", "#FFFFFF", "#8DA070"],
    velas: true,
    forma: "rect",
    colunas: [-8, 8],
    z0: -2.5,
    passoZ: 5,
    noivosZ: -8.5,
  },
];

export const CENARIO_PADRAO: IdDoCenario = "jardim";

export function ehIdDeCenario(v: unknown): v is IdDoCenario {
  return typeof v === "string" && CENARIOS.some((s) => s.id === v);
}

export function cenarioPorId(id: string | null | undefined): DefinicaoDoCenario | null {
  return CENARIOS.find((s) => s.id === id) ?? null;
}
