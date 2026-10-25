import type { ConvidadoLocal } from "@/types/local";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import type { FiltroDaLista, LinhaDoConvidado } from "./tipos";

const textoSemAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function quantidadeDeLugares(g: ConvidadoLocal) {
  return 1 + (g.allowedCompanions || 0);
}

export function rotuloDosLugares(g: ConvidadoLocal) {
  const n = quantidadeDeLugares(g);
  return `${n} ${n === 1 ? "lugar" : "lugares"}`;
}

export function iniciaisDoNome(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "")).toUpperCase();
}

/** Aplica a resposta, o grupo e a busca (por nome, e-mail, acompanhantes ou telefone) à lista. */
export function filtrarConvidados(convidados: LinhaDoConvidado[], filtro: FiltroDaLista, grupo: string, busca: string) {
  const q = textoSemAcentos(busca.trim());
  const digits = somenteDigitos(busca);
  return convidados.filter((g) => {
    if (filtro !== "all" && g.rsvpStatus !== filtro) return false;
    if (grupo && g.category !== grupo) return false;
    if (!q) return true;
    if (textoSemAcentos(g.name).includes(q)) return true;
    if (g.email && textoSemAcentos(g.email).includes(q)) return true;
    if (g.companionsNames && textoSemAcentos(g.companionsNames).includes(q)) return true;
    return digits.length >= 3 && !!g.phone && somenteDigitos(g.phone).includes(digits);
  });
}
