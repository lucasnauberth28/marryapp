// Os modelos prontos do site do casal. Puro (sem React): o editor, o site público e os testes leem daqui.
// Cada modelo é uma combinação de paleta, tipo de letra, capa e forma das fotos; o casal só envia fotos e preenche os dados.

export type IdDoModelo = "classico" | "arco" | "floral" | "editorial" | "monocromo" | "noturno" | "campo" | "papel";
export type CapaDoModelo = "arco-central" | "dividida" | "tela-cheia";
export type FonteDoModelo = "padrao" | "playfair" | "cormorant" | "bodoni" | "italiana";
export type FormaDasFotos = "arco" | "reta" | "suave" | "oval";

export interface ModeloDoSite {
  id: IdDoModelo;
  nome: string;
  descricao: string;
  /** Cor de destaque inicial (o casal pode trocar). */
  destaque: string;
  /** Fundo da página, faixa de apoio (áreas em destaque), cartão (cartões e faixas claras), texto, texto de apoio e fios. */
  paleta: { fundo: string; faixa: string; cartao: string; texto: string; apoio: string; linha: string };
  fonte: FonteDoModelo;
  /** Fonte de assinatura (nomes grandes na capa), quando difere do título. */
  fonteDosNomes?: "great-vibes";
  capa: CapaDoModelo;
  /** Capa de tela cheia: texto à esquerda ou ao centro. */
  alinhamento: "esquerda" | "centro";
  fotos: FormaDasFotos;
  escuro: boolean;
  /** Divisor entre faixas: borda de papel rasgado. */
  divisor: "reto" | "rasgado";
}

export const MODELOS_DO_SITE: readonly ModeloDoSite[] = [
  {
    id: "classico", nome: "Clássico", descricao: "O desenho do Aceito: arco no topo, tons claros e letras limpas.", destaque: "#5E2B4E",
    paleta: { fundo: "#FCFBFA", faixa: "#F7F1F5", cartao: "#FFFFFF", texto: "#1F1A1D", apoio: "#5F585C", linha: "#E8E2E5" },
    fonte: "padrao", capa: "arco-central", alinhamento: "centro", fotos: "arco", escuro: false, divisor: "reto",
  },
  {
    id: "arco", nome: "Arco bege", descricao: "Bege quente e fotos em arco, com a capa dividida em texto e foto.", destaque: "#8A7A4F",
    paleta: { fundo: "#F3EBE3", faixa: "#EDE2D6", cartao: "#FAF5EF", texto: "#2E211C", apoio: "#6B5A50", linha: "#DCCDBE" },
    fonte: "playfair", capa: "dividida", alinhamento: "esquerda", fotos: "arco", escuro: false, divisor: "reto",
  },
  {
    id: "floral", nome: "Floral rosé", descricao: "Rosa suave, cantos arredondados e capa com contagem regressiva.", destaque: "#C9706A",
    paleta: { fundo: "#FFF7F2", faixa: "#FBEDE6", cartao: "#FFFFFF", texto: "#33241F", apoio: "#7A5F57", linha: "#F0D9D0" },
    fonte: "cormorant", capa: "dividida", alinhamento: "esquerda", fotos: "suave", escuro: false, divisor: "reto",
  },
  {
    id: "editorial", nome: "Editorial", descricao: "Revista de casamento: foto grande na capa, letras com serifa e muito respiro.", destaque: "#5B1F2B",
    paleta: { fundo: "#F5F0E6", faixa: "#EFE8DA", cartao: "#FBF8F1", texto: "#1C1411", apoio: "#645850", linha: "#DDD3C1" },
    fonte: "playfair", capa: "tela-cheia", alinhamento: "esquerda", fotos: "reta", escuro: false, divisor: "reto",
  },
  {
    id: "monocromo", nome: "Monocromático", descricao: "Preto e branco com cantos retos e letras de alto contraste.", destaque: "#111111",
    paleta: { fundo: "#F1F1EE", faixa: "#E7E7E3", cartao: "#FFFFFF", texto: "#111111", apoio: "#555555", linha: "#CFCFCB" },
    fonte: "bodoni", capa: "tela-cheia", alinhamento: "esquerda", fotos: "reta", escuro: false, divisor: "reto",
  },
  {
    id: "noturno", nome: "Noturno", descricao: "Fundo escuro, detalhes dourados e cartões de vidro.", destaque: "#C9A86A",
    paleta: { fundo: "#0F0C0A", faixa: "#17120F", cartao: "#1E1814", texto: "#F1E8DC", apoio: "#B8AA98", linha: "#3A2F25" },
    fonte: "cormorant", capa: "tela-cheia", alinhamento: "esquerda", fotos: "suave", escuro: true, divisor: "reto",
  },
  {
    id: "campo", nome: "Campo", descricao: "Verde sálvia, nomes em letra manuscrita e capa com a paisagem.", destaque: "#4F6B45",
    paleta: { fundo: "#F2F3EA", faixa: "#E8EBDD", cartao: "#FAFBF5", texto: "#2B3727", apoio: "#5C6B55", linha: "#D3D9C4" },
    fonte: "cormorant", fonteDosNomes: "great-vibes", capa: "tela-cheia", alinhamento: "centro", fotos: "oval", escuro: false, divisor: "reto",
  },
  {
    id: "papel", nome: "Papel rasgado", descricao: "Papel craft com bordas rasgadas e azul-ardósia.", destaque: "#3F4C54",
    paleta: { fundo: "#E9E3D6", faixa: "#F2EEE4", cartao: "#F8F5EE", texto: "#2A2F32", apoio: "#5C6469", linha: "#D2CABA" },
    fonte: "italiana", capa: "tela-cheia", alinhamento: "centro", fotos: "suave", escuro: false, divisor: "rasgado",
  },
];

export const MODELO_PADRAO: IdDoModelo = "classico";

/** Quantas fotos cabem na galeria do site. */
export const MAXIMO_DE_FOTOS_DA_GALERIA = 8;

export function ehIdDeModelo(valor: unknown): valor is IdDoModelo {
  return typeof valor === "string" && MODELOS_DO_SITE.some((m) => m.id === valor);
}

/** O modelo pelo id; id desconhecido (ou vazio) cai no padrão, para um site nunca ficar sem desenho. */
export function modeloDoSite(id: unknown): ModeloDoSite {
  return MODELOS_DO_SITE.find((m) => m.id === id) ?? MODELOS_DO_SITE[0];
}

/** Lê a lista de fotos da galeria (JSON no banco): só endereços de texto, sem repetir, até o máximo. */
export function fotosDaGaleria(bruto: string | null | undefined): string[] {
  if (!bruto) return [];
  try {
    const lista = JSON.parse(bruto);
    if (!Array.isArray(lista)) return [];
    const unicas = [...new Set(lista.filter((u): u is string => typeof u === "string" && u.trim() !== "").map((u) => u.trim()))];
    return unicas.slice(0, MAXIMO_DE_FOTOS_DA_GALERIA);
  } catch {
    return [];
  }
}

export function textoDaGaleria(fotos: readonly string[]): string {
  return JSON.stringify(fotos.slice(0, MAXIMO_DE_FOTOS_DA_GALERIA));
}
