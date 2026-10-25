import { importarConvidados } from "@/actions/guest-actions";
import type { PlanoDaImportacao } from "@/lib/importacao-de-convidados/repetidos";
import { NOME_DO_ARQUIVO_MODELO_DA_PLANILHA, csvDaPlanilhaModelo } from "@/lib/importacao-de-convidados/modelo";
import { decodificarBytesDaPlanilha } from "@/lib/importacao-de-convidados/arquivo";
import { interpretarPlanilhaDeConvidados } from "@/lib/importacao-de-convidados/planilha";
import type { PlanilhaLida } from "./tipos";

const TAMANHO_MAXIMO_DO_ARQUIVO_EM_BYTES = 2 * 1024 * 1024;

export function baixarPlanilhaModelo() {
  const blob = new Blob([csvDaPlanilhaModelo()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = NOME_DO_ARQUIVO_MODELO_DA_PLANILHA;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

type LeituraDoArquivo = { ok: true; planilha: PlanilhaLida } | { ok: false; error: string };

/** Confere o arquivo escolhido e o lê como planilha de convidados. */
export async function lerArquivoDaPlanilha(file: File): Promise<LeituraDoArquivo> {
  if (/\.(xlsx|xls|ods)$/i.test(file.name)) {
    return { ok: false, error: "Esse é um arquivo de Excel. Salve como CSV (no Excel: Arquivo, Salvar como, CSV UTF-8) e escolha o arquivo de novo." };
  }
  if (file.size > TAMANHO_MAXIMO_DO_ARQUIVO_EM_BYTES) {
    return { ok: false, error: "O arquivo é grande demais (o máximo é 2 MB). Divida a lista em partes." };
  }
  try {
    const bytes = await file.arrayBuffer();
    // Arquivo do Excel (xlsx) é um zip, mesmo com outro nome
    const head = new Uint8Array(bytes.slice(0, 2));
    if (head[0] === 0x50 && head[1] === 0x4b) {
      return { ok: false, error: "Esse arquivo parece ser uma planilha do Excel. Salve como CSV e escolha o arquivo de novo." };
    }
    const parsed = interpretarPlanilhaDeConvidados(decodificarBytesDaPlanilha(bytes));
    if (!parsed.ok) return { ok: false, error: parsed.error };
    return { ok: true, planilha: { fileName: file.name, rows: parsed.rows, hasHeader: parsed.hasHeader, columns: parsed.columns } };
  } catch {
    return { ok: false, error: "Não conseguimos ler esse arquivo. Confira se é um CSV ou um texto separado por vírgula e tente de novo." };
  }
}

const ERRO_DE_CONEXAO = "Não conseguimos falar com o servidor. Nada foi salvo. Confira a internet e tente de novo.";

type ResultadoDoEnvio = { ok: true; added: number; duplicates: number } | { ok: false; error: string };

/** Grava no servidor os convidados novos que a prévia mostrou. */
export async function enviarPlanoDaImportacao(plan: PlanoDaImportacao): Promise<ResultadoDoEnvio> {
  try {
    const res = await importarConvidados(plan.toAdd.map(({ line, name, phone, email, companions, category, dietary }) => ({ line, name, phone, email, companions, category, dietary })));
    return res.success ? { ok: true, added: res.added, duplicates: res.duplicates } : { ok: false, error: res.error };
  } catch {
    return { ok: false, error: ERRO_DE_CONEXAO };
  }
}
