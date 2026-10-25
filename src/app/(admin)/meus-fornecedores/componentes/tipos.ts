import type { obterFornecedores } from "@/actions/vendor-actions";
import { formatarReaisEnxuto } from "@/lib/formatacao/dinheiro";

export type FornecedorDoCasamento = Awaited<ReturnType<typeof obterFornecedores>>[number];

/** Categorias comuns de casamento (as mesmas da vitrine) para lembrar o que ainda falta escolher. */
export const CATEGORIAS_COMUNS = ["Espaço", "Buffet", "Fotografia", "Decoração", "DJ & Som", "Doces & Bolo", "Vestidos"];

export interface FormularioDoFornecedor {
  name: string;
  category: string;
  contact: string;
  notes: string;
  contractUrl: string;
}
export const FORMULARIO_VAZIO: FormularioDoFornecedor = { name: "", category: "", contact: "", notes: "", contractUrl: "" };

const normalizarTexto = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

/** As categorias comuns em que ainda não há fornecedor contratado. */
export function categoriasQueFaltam(fornecedores: FornecedorDoCasamento[]) {
  const contratadas = fornecedores.map((v) => normalizarTexto(v.category));
  return CATEGORIAS_COMUNS.filter((c) => !contratadas.some((h) => h === normalizarTexto(c) || h.includes(normalizarTexto(c))));
}

/** Resumo do dinheiro do fornecedor a partir das despesas ligadas a ele. */
export function resumoDoPagamento(v: FornecedorDoCasamento) {
  const list = v.expenses ?? [];
  if (list.length === 0) return "Sem despesas lançadas";
  const total = list.reduce((acc, e) => acc + e.amount, 0);
  const paid = list.filter((e) => e.status === "PAID").length;
  if (paid === list.length) return `${formatarReaisEnxuto(total)} · pago`;
  if (list.length === 1) return `${formatarReaisEnxuto(total)} · a pagar`;
  return `${formatarReaisEnxuto(total)} · ${paid} de ${list.length} parcelas pagas`;
}
