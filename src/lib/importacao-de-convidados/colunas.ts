// Importação de convidados: que coluna da planilha é cada campo (pelo título ou pelo conteúdo).
import { somenteDigitos } from "../formatacao/telefone.ts";

export type CampoDaImportacao = "name" | "phone" | "email" | "companions" | "seats" | "category" | "dietary";
export type MapaDeColunas = Partial<Record<CampoDaImportacao, number>>;

/** Minúsculas, sem acento, só letras e números separados por espaço. */
export function textoSimples(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

// Cada campo tem palavras que reconhecem o título da coluna (por palavra inteira ou começo dela).
// A ordem importa: "e-mail do convidado" é e-mail, não nome.
const PALAVRAS_DE_CABECALHO: Array<[CampoDaImportacao, string[]]> = [
  ["email", ["email", "mail", "correio"]],
  ["phone", ["telefone", "whatsapp", "whats", "zap", "celular", "fone", "tel", "phone", "mobile"]],
  ["dietary", ["restricao", "restricoes", "alimentar", "alimentares", "dieta", "alergia", "alergias"]],
  ["companions", ["acompanhante", "acompanhantes", "companions", "+1"]],
  ["seats", ["lugares", "lugar", "vagas", "assentos", "cadeiras"]],
  ["category", ["grupo", "categoria", "grupos", "tipo", "relacao", "lado"]],
  ["name", ["nome", "convidado", "name", "convite"]],
];

function campoParaCabecalho(header: string): CampoDaImportacao | null {
  const words = textoSimples(header).split(" ").filter(Boolean);
  if (words.length === 0) return null;
  for (const [field, keys] of PALAVRAS_DE_CABECALHO) {
    if (words.some((w) => keys.includes(w))) return field;
  }
  return null;
}

export const parecEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const parecTelefone = (v: string) => /^[+()\d\s.-]+$/.test(v) && somenteDigitos(v).length >= 8;
const parecNumeroPequeno = (v: string) => /^\d{1,2}$/.test(v);

/** Mapeia as colunas pelo título; só vale como cabeçalho se acharmos a coluna de nome. */
export function detectarCabecalho(cells: string[]): MapaDeColunas | null {
  // Uma linha com telefone ou e-mail é de convidado, não de títulos (mesmo que o nome pareça um título)
  if (cells.some((c) => parecEmail(c) || parecTelefone(c))) return null;
  const map: MapaDeColunas = {};
  cells.forEach((cell, index) => {
    const field = campoParaCabecalho(cell);
    if (field && map[field] === undefined) map[field] = index;
  });
  return map.name !== undefined ? map : null;
}

/** Sem cabeçalho: descobre o papel de cada coluna olhando o conteúdo (e-mail, telefone, número, texto). */
export function deduzirColunas(rows: string[][]): MapaDeColunas {
  const width = Math.max(0, ...rows.map((r) => r.length));
  const map: MapaDeColunas = {};
  const used = new Set<number>();
  const sample = rows.slice(0, 20);

  const share = (col: number, test: (v: string) => boolean) => {
    const values = sample.map((r) => r[col] ?? "").filter((v) => v !== "");
    if (values.length === 0) return 0;
    return values.filter(test).length / values.length;
  };

  for (let col = 0; col < width; col++) {
    if (map.email === undefined && share(col, parecEmail) >= 0.6) {
      map.email = col;
      used.add(col);
    }
  }
  for (let col = 0; col < width; col++) {
    if (!used.has(col) && map.phone === undefined && share(col, parecTelefone) >= 0.6) {
      map.phone = col;
      used.add(col);
    }
  }
  for (let col = 0; col < width; col++) {
    if (!used.has(col) && map.companions === undefined && share(col, parecNumeroPequeno) >= 0.8) {
      map.companions = col;
      used.add(col);
    }
  }
  const text = Array.from({ length: width }, (_, i) => i).filter((c) => !used.has(c));
  if (text[0] !== undefined) map.name = text[0];
  if (text[1] !== undefined) map.category = text[1];
  if (text[2] !== undefined) map.dietary = text[2];
  return map;
}
