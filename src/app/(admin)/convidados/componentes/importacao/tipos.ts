import type { CampoDaImportacao, LinhaImportada, MapaDeColunas } from "@/lib/guest-import";

export const ROTULO_DO_CAMPO: Record<CampoDaImportacao, string> = {
  name: "Nome",
  phone: "Telefone",
  email: "E-mail",
  companions: "Acompanhantes",
  seats: "Lugares",
  category: "Grupo",
  dietary: "Restrição alimentar",
};

export type EtapaDoFluxo = "escolher" | "previa" | "importando" | "pronto";

export interface PlanilhaLida {
  fileName: string;
  rows: LinhaImportada[];
  hasHeader: boolean;
  columns: MapaDeColunas;
}

export interface ResultadoDaImportacao {
  added: number;
  duplicates: number;
  invalid: number;
}

export const CLASSE_DO_TITULO = "font-display text-[22px] font-medium leading-7 text-tinta outline-none";
