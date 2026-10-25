// Agrupa as parcelas de uma mesma dívida, contrato ou compra, com o andamento do pagamento de cada grupo.
import type { DespesaAgrupada, ItemDeDespesa, TipoDeDespesa } from "./tipos.ts";

const tempoDe = (data: Date | string) => new Date(data).getTime();

/** "Buffet (2/5)" -> "Buffet": tira o contador de parcelas do fim da descrição. */
const tituloSemParcela = (descricao: string) => descricao.replace(/\s*\(\d+[\/\sde]+\d+\)\s*$/i, "").trim();

function novoGrupo(chave: string, despesa: ItemDeDespesa, titulo: string, tipo: TipoDeDespesa): DespesaAgrupada {
  return {
    id: chave,
    baseDescription: titulo,
    vendorName: despesa.vendor?.name || despesa.storeName || "Compra direta",
    vendorCategory: despesa.vendor?.category || (tipo === "PURCHASE" ? "Compra avulsa" : ""),
    type: tipo,
    storeName: despesa.storeName || null,
    purchaseUrl: despesa.purchaseUrl || null,
    paymentMethod: despesa.paymentMethod || null,
    imageUrl: despesa.imageUrl || null,
    totalAmount: 0, paidAmount: 0, pendingAmount: 0, paidCount: 0, totalCount: 0,
    nextDueDate: null, nextDueAmount: null, nextDueExpenseId: null,
    expenses: [],
  };
}

function somarNoGrupo(grupo: DespesaAgrupada, despesa: ItemDeDespesa) {
  grupo.expenses.push(despesa);
  grupo.totalAmount += despesa.amount;
  grupo.totalCount += 1;
  if (!grupo.imageUrl && despesa.imageUrl) grupo.imageUrl = despesa.imageUrl;
  if (!grupo.purchaseUrl && despesa.purchaseUrl) grupo.purchaseUrl = despesa.purchaseUrl;
  if (!grupo.paymentMethod && despesa.paymentMethod) grupo.paymentMethod = despesa.paymentMethod;
  if (despesa.status === "PAID") {
    grupo.paidAmount += despesa.amount;
    grupo.paidCount += 1;
    return;
  }
  grupo.pendingAmount += despesa.amount;
  if (!grupo.nextDueDate || tempoDe(despesa.dueDate) < tempoDe(grupo.nextDueDate)) {
    grupo.nextDueDate = despesa.dueDate;
    grupo.nextDueAmount = despesa.amount;
    grupo.nextDueExpenseId = despesa.id;
  }
}

/** Os grupos com vencimento mais próximo primeiro; os quitados, por ordem alfabética. */
function compararGrupos(a: DespesaAgrupada, b: DespesaAgrupada) {
  if (a.nextDueDate && b.nextDueDate) return tempoDe(a.nextDueDate) - tempoDe(b.nextDueDate);
  if (a.nextDueDate) return -1;
  if (b.nextDueDate) return 1;
  return a.baseDescription.localeCompare(b.baseDescription);
}

export function agruparDespesas(despesas: ItemDeDespesa[]): DespesaAgrupada[] {
  const grupos = new Map<string, DespesaAgrupada>();
  for (const despesa of despesas) {
    const titulo = tituloSemParcela(despesa.description), tipo = despesa.type || "CONTRACT";
    const chave = `${tipo}_${despesa.vendorId || despesa.storeName || titulo.toLowerCase()}_${titulo.toLowerCase()}`;
    if (!grupos.has(chave)) grupos.set(chave, novoGrupo(chave, despesa, titulo, tipo));
    somarNoGrupo(grupos.get(chave)!, despesa);
  }
  for (const grupo of grupos.values()) grupo.expenses.sort((a, b) => tempoDe(a.dueDate) - tempoDe(b.dueDate));
  return Array.from(grupos.values()).sort(compararGrupos);
}

export function filtrarPorTipo(despesas: ItemDeDespesa[], tipo: "ALL" | TipoDeDespesa) {
  return tipo === "ALL" ? despesas : despesas.filter((e) => (e.type || "CONTRACT") === tipo);
}

export function filtrarGruposPorBusca(grupos: DespesaAgrupada[], busca: string) {
  if (!busca.trim()) return grupos;
  const q = busca.toLowerCase();
  return grupos.filter((g) => g.baseDescription.toLowerCase().includes(q) || g.vendorName.toLowerCase().includes(q) || g.vendorCategory.toLowerCase().includes(q));
}
