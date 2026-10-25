import type { ConvidadoLocal } from "@/types/local";

export type LinhaDoConvidado = ConvidadoLocal & { table?: { name: string } | null };

export type FiltroDaLista = "all" | "CONFIRMED" | "PENDING" | "DECLINED";

// Quantos convidados aparecem por vez; "Carregar mais" mostra o resto aos poucos.
export const TAMANHO_DA_PAGINA = 30;

export const CATEGORIAS_DE_CONVIDADO = [
  "Padrinho/Madrinha",
  "Participantes de cerimônia",
  "Pais",
  "Família",
  "Amigo/Colega",
] as const;
