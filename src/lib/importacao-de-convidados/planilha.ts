// Importação de convidados: do texto do arquivo às linhas prontas para a prévia.
import { MAXIMO_DE_LINHAS_NA_IMPORTACAO } from "./limites.ts";
import { interpretarTextoDelimitado } from "./arquivo.ts";
import { type MapaDeColunas, deduzirColunas, detectarCabecalho } from "./colunas.ts";
import { type LinhaImportada, montarLinhaImportada } from "./linhas.ts";

export type PlanilhaInterpretada =
  | { ok: true; rows: LinhaImportada[]; hasHeader: boolean; columns: MapaDeColunas }
  | { ok: false; error: string };

/** Do texto do arquivo às linhas prontas para a prévia. */
export function interpretarPlanilhaDeConvidados(text: string): PlanilhaInterpretada {
  const table = interpretarTextoDelimitado(text);
  if (table.length === 0) return { ok: false, error: "A planilha está vazia." };

  const header = detectarCabecalho(table[0].cells);
  const dataRows = header ? table.slice(1) : table;
  if (dataRows.length === 0) return { ok: false, error: "A planilha só tem o cabeçalho, sem nenhum convidado." };
  if (dataRows.length > MAXIMO_DE_LINHAS_NA_IMPORTACAO) {
    return {
      ok: false,
      error: `A planilha tem ${dataRows.length} linhas e dá para importar até ${MAXIMO_DE_LINHAS_NA_IMPORTACAO} por vez. Divida em partes menores.`,
    };
  }

  const columns = header ?? deduzirColunas(dataRows.map((r) => r.cells));
  if (columns.name === undefined) return { ok: false, error: "Não achamos a coluna com os nomes dos convidados." };

  return { ok: true, rows: dataRows.map((r) => montarLinhaImportada(r, columns)), hasHeader: header !== null, columns };
}
