// Importação de convidados: o que será adicionado, o que tem problema e o que já existe.
import { obterVariacoesDoTelefone } from "../convidados/phone-variations.ts";
import { textoSimples } from "./colunas.ts";
import type { LinhaImportada } from "./linhas.ts";

export interface ConvidadoExistente {
  name: string;
  phone: string | null;
}

type MotivoDeDuplicidade = "existing" | "in_file";

export interface PlanoDaImportacao {
  toAdd: LinhaImportada[];
  invalid: LinhaImportada[];
  duplicates: Array<{ row: LinhaImportada; reason: MotivoDeDuplicidade }>;
}

const chaveDoNome = (name: string) => textoSimples(name);

/**
 * Separa o que será adicionado, o que tem problema e o que já existe. Repetido = telefone igual
 * (em qualquer formato: com ou sem 55 e 9) ao de um convidado do casamento ou de outra linha da
 * planilha. Sem telefone, vale o mesmo nome entre quem também não tem telefone.
 */
export function planejarImportacao(rows: LinhaImportada[], existing: ConvidadoExistente[]): PlanoDaImportacao {
  const phones = new Map<string, MotivoDeDuplicidade>();
  const names = new Map<string, MotivoDeDuplicidade>();

  for (const g of existing) {
    if (g.phone) for (const v of obterVariacoesDoTelefone(g.phone)) phones.set(v, "existing");
    else names.set(chaveDoNome(g.name), "existing");
  }

  const plan: PlanoDaImportacao = { toAdd: [], invalid: [], duplicates: [] };
  for (const row of rows) {
    if (row.problem) {
      plan.invalid.push(row);
      continue;
    }
    const variations = row.phone ? obterVariacoesDoTelefone(row.phone) : [];
    const hit = variations.map((v) => phones.get(v)).find(Boolean) ?? (row.phone ? undefined : names.get(chaveDoNome(row.name)));
    if (hit) {
      plan.duplicates.push({ row, reason: hit });
      continue;
    }
    plan.toAdd.push(row);
    if (row.phone) for (const v of variations) phones.set(v, "in_file");
    else names.set(chaveDoNome(row.name), "in_file");
  }
  return plan;
}
