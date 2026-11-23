// Mapa do salão visto de cima: onde fica cada mesa e cada cadeira. Puro (sem banco nem navegador), roda nos testes.
// As mesas não têm posição guardada: entram em fileiras centralizadas, na ordem em que foram criadas.

export interface MesaDoMapa {
  id: string;
  name: string;
  capacity: number;
  /** Lugares já ocupados (convidado e acompanhantes). */
  occupied: number;
}

export interface MesaPosicionada extends MesaDoMapa {
  number: number;
  x: number;
  y: number;
}

export const RAIO_DA_MESA = 34;
const FOLGA_ENTRE_MESAS = 52;
const PASSO = RAIO_DA_MESA * 2 + FOLGA_ENTRE_MESAS;
/** Entre fileiras sobra espaço para o nome da mesa, que fica embaixo das cadeiras. */
const PASSO_VERTICAL = PASSO + 24;
const MARGEM = 56;

export interface PlantaDoSalao {
  mesas: MesaPosicionada[];
  largura: number;
  altura: number;
}

/** Quantas mesas por fileira: perto de um retângulo de 4:3, de 2 a 6. */
export function mesasPorFileira(total: number): number {
  return Math.min(6, Math.max(2, Math.ceil(Math.sqrt((total * 4) / 3))));
}

/** Entra cada mesa na sua fileira; a última fileira, se incompleta, fica centralizada. */
export function montarPlanta(mesas: MesaDoMapa[]): PlantaDoSalao {
  const porFileira = mesasPorFileira(mesas.length);
  const fileiras = Math.max(1, Math.ceil(mesas.length / porFileira));
  const largura = MARGEM * 2 + (Math.min(porFileira, Math.max(1, mesas.length)) - 1) * PASSO;
  const altura = MARGEM * 2 + (fileiras - 1) * PASSO_VERTICAL;
  const posicionadas = mesas.map((mesa, i) => {
    const fileira = Math.floor(i / porFileira);
    const naFileira = Math.min(porFileira, mesas.length - fileira * porFileira);
    const coluna = i % porFileira;
    const x = largura / 2 + (coluna - (naFileira - 1) / 2) * PASSO;
    return { ...mesa, number: i + 1, x, y: MARGEM + fileira * PASSO_VERTICAL };
  });
  return { mesas: posicionadas, largura: Math.max(largura, MARGEM * 2), altura };
}

export interface Cadeira {
  x: number;
  y: number;
  ocupada: boolean;
  /** Passou da capacidade da mesa. */
  excedente: boolean;
}

/** Cadeiras em volta da mesa, a primeira no topo, andando no sentido horário. Ocupadas primeiro; o que passa da capacidade vira cadeira extra. */
export function cadeirasDaMesa(cx: number, cy: number, capacity: number, occupied: number): Cadeira[] {
  const lugares = Math.max(capacity, occupied);
  const raio = RAIO_DA_MESA + 11;
  return Array.from({ length: lugares }, (_, i) => {
    const angulo = (2 * Math.PI * i) / Math.max(lugares, 1) - Math.PI / 2;
    return { x: cx + raio * Math.cos(angulo), y: cy + raio * Math.sin(angulo), ocupada: i < occupied, excedente: i >= capacity };
  });
}

/** "João Álvares" → "joao alvares": busca sem acento nem maiúscula. */
export const textoDaBusca = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Convidados cujo nome contém todas as palavras digitadas; só a partir de 2 letras, para a lista inteira não ficar à mostra. */
export function acharConvidados<T extends { name: string }>(convidados: T[], busca: string, maximo = 8): T[] {
  const palavras = textoDaBusca(busca).split(" ").filter(Boolean);
  if (palavras.join("").length < 2) return [];
  return convidados.filter((c) => palavras.every((p) => textoDaBusca(c.name).includes(p))).slice(0, maximo);
}
