"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ExpenseStatus } from "@/types/local";
import { createExpense, createBatchExpenses, deleteExpense, updateExpenseStatus } from "@/actions/expense-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  Clock,
  CalendarRange,
  Layers,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  ListFilter,
  CheckCircle2,
  Calendar,
  Building2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface InstallmentBlock {
  id: number;
  count: number;
  amount: string; // Ex: "300.00"
  startDate: string; // Ex: "2026-08-10"
}

interface GroupedExpense {
  id: string;
  baseDescription: string;
  vendorName: string;
  vendorCategory: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  totalCount: number;
  nextDueDate: string | null;
  nextDueAmount: number | null;
  nextDueExpenseId: string | null;
  expenses: any[];
}

export function ExpensesClient({ initialExpenses, vendors }: { initialExpenses: any[], vendors: any[] }) {
  const [expenses, setExpenses] = useState<any[]>(initialExpenses);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Modo de exibição: "grouped" (por Dívida/Contrato com progresso) ou "detailed" (tabela paginada)
  const [viewMode, setViewMode] = useState<"grouped" | "detailed">("grouped");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [groupedPage, setGroupedPage] = useState(1);
  const [groupedSearch, setGroupedSearch] = useState("");
  const GROUP_PAGE_SIZE = 6;

  // Modo de cadastro: única vs parcelada
  const [mode, setMode] = useState<"single" | "installment">("single");
  const [description, setDescription] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [singleVendorId, setSingleVendorId] = useState("");
  const [formKey, setFormKey] = useState(0);

  // Estado para parcelamento em blocos
  const [blocks, setBlocks] = useState<InstallmentBlock[]>([
    { id: 1, count: 3, amount: "300", startDate: new Date().toISOString().split("T")[0] }
  ]);

  const resetForm = () => {
    setMode("single");
    setDescription("");
    setVendorId("");
    setSingleVendorId("");
    setBlocks([{ id: 1, count: 3, amount: "300", startDate: new Date().toISOString().split("T")[0] }]);
    setFormKey(prev => prev + 1);
  };

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Manipulação de blocos de parcelas
  const addBlock = () => {
    const lastBlock = blocks[blocks.length - 1];
    let nextDate = new Date();
    if (lastBlock?.startDate) {
      const d = new Date(lastBlock.startDate);
      d.setMonth(d.getMonth() + (lastBlock.count || 1));
      nextDate = d;
    }
    setBlocks([
      ...blocks,
      {
        id: Date.now(),
        count: 3,
        amount: "500",
        startDate: nextDate.toISOString().split("T")[0],
      }
    ]);
  };

  const removeBlock = (id: number) => {
    if (blocks.length === 1) {
      toast.error("O parcelamento precisa ter ao menos um bloco.");
      return;
    }
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const updateBlock = (id: number, field: keyof InstallmentBlock, value: any) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  // Cálculo das parcelas geradas em tempo real
  const generatedInstallments = useMemo(() => {
    if (mode !== "installment") return [];

    const totalCount = blocks.reduce((sum, b) => sum + (Number(b.count) || 0), 0);
    if (totalCount === 0) return [];

    const items: Array<{ description: string; amount: number; dueDate: string; vendorId: string }> = [];
    let currentIdx = 1;

    for (const block of blocks) {
      const count = Number(block.count) || 0;
      const amountInCents = Math.round(parseFloat((block.amount || "0").replace(',', '.')) * 100);
      const baseDate = block.startDate ? new Date(block.startDate) : new Date();

      for (let i = 0; i < count; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        items.push({
          description: `${description || "Despesa"} (${currentIdx}/${totalCount})`,
          amount: isNaN(amountInCents) ? 0 : amountInCents,
          dueDate: dueDate.toISOString().split("T")[0],
          vendorId,
        });
        currentIdx++;
      }
    }

    return items;
  }, [mode, description, vendorId, blocks]);

  const totalInstallmentsAmount = useMemo(() => {
    return generatedInstallments.reduce((sum, item) => sum + item.amount, 0);
  }, [generatedInstallments]);

  // Agrupamento inteligente de despesas por Dívida/Contrato
  const groupedExpenses = useMemo<GroupedExpense[]>(() => {
    const map = new Map<string, GroupedExpense>();

    for (const exp of expenses) {
      // Extrai o título base removendo sufixos do tipo "(1/12)" ou "(1 de 12)"
      const baseTitle = exp.description.replace(/\s*\(\d+[\/\sde]+\d+\)\s*$/i, "").trim();
      const key = `${exp.vendorId}_${baseTitle.toLowerCase()}`;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          baseDescription: baseTitle,
          vendorName: exp.vendor?.name || "Sem Fornecedor",
          vendorCategory: exp.vendor?.category || "",
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          paidCount: 0,
          totalCount: 0,
          nextDueDate: null,
          nextDueAmount: null,
          nextDueExpenseId: null,
          expenses: [],
        });
      }

      const group = map.get(key)!;
      group.expenses.push(exp);
      group.totalAmount += exp.amount;
      group.totalCount += 1;

      if (exp.status === "PAID") {
        group.paidAmount += exp.amount;
        group.paidCount += 1;
      } else {
        group.pendingAmount += exp.amount;
        // Identifica a próxima parcela pendente (menor data de vencimento)
        if (!group.nextDueDate || new Date(exp.dueDate) < new Date(group.nextDueDate)) {
          group.nextDueDate = exp.dueDate;
          group.nextDueAmount = exp.amount;
          group.nextDueExpenseId = exp.id;
        }
      }
    }

    // Ordenar parcelas dentro de cada grupo por vencimento
    for (const grp of map.values()) {
      grp.expenses.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }

    // Ordena grupos: primeiro os com vencimento pendente mais próximo, depois quitados
    return Array.from(map.values()).sort((a, b) => {
      if (a.nextDueDate && b.nextDueDate) {
        return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
      }
      if (a.nextDueDate) return -1;
      if (b.nextDueDate) return 1;
      return a.baseDescription.localeCompare(b.baseDescription);
    });
  }, [expenses]);

  // Filtragem dos grupos de dívida
  const filteredGroupedExpenses = useMemo(() => {
    if (!groupedSearch.trim()) return groupedExpenses;
    const q = groupedSearch.toLowerCase();
    return groupedExpenses.filter(g =>
      g.baseDescription.toLowerCase().includes(q) ||
      g.vendorName.toLowerCase().includes(q) ||
      g.vendorCategory.toLowerCase().includes(q)
    );
  }, [groupedExpenses, groupedSearch]);

  // Paginação dos grupos
  const totalGroupPages = Math.ceil(filteredGroupedExpenses.length / GROUP_PAGE_SIZE) || 1;
  const safeGroupPage = Math.min(Math.max(1, groupedPage), totalGroupPages);
  const paginatedGroupedExpenses = useMemo(() => {
    const start = (safeGroupPage - 1) * GROUP_PAGE_SIZE;
    return filteredGroupedExpenses.slice(start, start + GROUP_PAGE_SIZE);
  }, [filteredGroupedExpenses, safeGroupPage]);

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "single") {
      const formData = new FormData(e.currentTarget);
      const amountVal = formData.get("amount") as string;
      const amountInCents = Math.round(parseFloat(amountVal.replace(',', '.')) * 100);
      formData.set("amount", amountInCents.toString());

      const res = await createExpense(formData);
      if (res.success) {
        resetForm();
        setOpen(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Erro ao realizar operação.", {
          duration: 6000,
          description: "Ocorreu um erro inesperado no servidor.",
        });
      }
    } else {
      // Modo Parcelamento
      if (!vendorId) {
        toast.error("Selecione um fornecedor.");
        setLoading(false);
        return;
      }
      if (!description) {
        toast.error("Informe a descrição principal da despesa.");
        setLoading(false);
        return;
      }
      if (generatedInstallments.length === 0) {
        toast.error("Configure ao menos uma parcela válida.");
        setLoading(false);
        return;
      }

      const res = await createBatchExpenses(generatedInstallments);
      if (res.success) {
        resetForm();
        setOpen(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Erro ao realizar operação.", {
          duration: 6000,
          description: "Ocorreu um erro inesperado no servidor.",
        });
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setConfirmAction(() => async () => {
      const res = await deleteExpense(id);
      if (res.success) {
        setExpenses(expenses.filter(e => e.id !== id));
        toast.success("Despesa excluída com sucesso");
      } else {
        toast.error(res.error || "Erro ao realizar operação.", {
          duration: 6000,
          description: "Ocorreu um erro inesperado no servidor.",
        });
      }
    });
    setConfirmOpen(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "PAID" ? "PENDING" : "PAID";
    const res = await updateExpenseStatus(id, newStatus as ExpenseStatus);
    if (res.success) {
      setExpenses(expenses.map(e => e.id === id ? { ...e, status: newStatus } : e));
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Controles: Seletor de Visão + Cadastro */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        {/* Toggle de Visão */}
        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 shadow-inner">
          <Button
            type="button"
            variant={viewMode === "grouped" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grouped")}
            className={`flex-1 sm:flex-none h-8 text-xs font-medium rounded-lg transition-all ${
              viewMode === "grouped" ? "bg-white text-zinc-900 shadow-sm font-semibold" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 mr-1.5 text-[#8C6D45]" />
            Visão por Dívida ({groupedExpenses.length})
          </Button>
          <Button
            type="button"
            variant={viewMode === "detailed" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("detailed")}
            className={`flex-1 sm:flex-none h-8 text-xs font-medium rounded-lg transition-all ${
              viewMode === "detailed" ? "bg-white text-zinc-900 shadow-sm font-semibold" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 mr-1.5 text-[#8C6D45]" />
            Todas as Parcelas ({expenses.length})
          </Button>
        </div>

        {/* Modal de Cadastro */}
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#8C6D45] hover:bg-[#755630] text-white font-medium shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-[#8C6D45]" />
                Cadastrar Despesa / Contrato
              </DialogTitle>
            </DialogHeader>

            {/* Seletor de Modo no Form */}
            <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200 mt-2">
              <Button
                type="button"
                variant={mode === "single" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("single")}
                className={`flex-1 h-8 text-xs font-semibold rounded-md ${mode === "single" ? "shadow-sm" : ""}`}
              >
                Despesa Única
              </Button>
              <Button
                type="button"
                variant={mode === "installment" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("installment")}
                className={`flex-1 h-8 text-xs font-semibold rounded-md ${mode === "installment" ? "shadow-sm" : ""}`}
              >
                Parcelamento Flexível
              </Button>
            </div>

            <form key={formKey} onSubmit={handleCreate} className="space-y-4 mt-2">
              {mode === "single" ? (
                <>
                  <Input name="description" placeholder="Descrição (ex: Sinal do Buffet)" required />
                  
                  <input type="hidden" name="vendorId" value={singleVendorId} />
                  <Select value={singleVendorId} onValueChange={setSingleVendorId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o Fornecedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-4">
                    <Input name="amount" placeholder="Valor (ex: 1500.00)" type="number" step="0.01" required />
                    <DatePicker name="dueDate" required />
                  </div>
                </>
              ) : (
                /* Modo Parcelado Flexível */
                <div className="space-y-4">
                  <Input
                    placeholder="Descrição da Despesa (ex: Buffet da Festa)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />

                  <Select value={vendorId} onValueChange={setVendorId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o Fornecedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-[#8C6D45]" />
                        Blocos de Parcelas
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={addBlock} className="text-xs h-7">
                        + Adicionar Bloco
                      </Button>
                    </div>

                    {blocks.map((block, idx) => (
                      <div key={block.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold text-zinc-600">
                          <span>Bloco #{idx + 1}</span>
                          {blocks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBlock(block.id)}
                              className="text-red-500 hover:text-red-700 text-xs cursor-pointer"
                            >
                              Remover Bloco
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-[10px] text-zinc-500">Nº de Parcelas</Label>
                            <Input
                              type="number"
                              min={1}
                              max={60}
                              value={block.count}
                              onChange={(e) => updateBlock(block.id, "count", Number(e.target.value))}
                              placeholder="Ex: 3"
                            />
                          </div>

                          <div>
                            <Label className="text-[10px] text-zinc-500">Valor da Parcela (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={block.amount}
                              onChange={(e) => updateBlock(block.id, "amount", e.target.value)}
                              placeholder="Ex: 300.00"
                            />
                          </div>

                          <div>
                            <Label className="text-[10px] text-zinc-500">1º Vencimento</Label>
                            <DatePicker
                              value={block.startDate}
                              onChange={(e) => updateBlock(block.id, "startDate", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pré-visualização ao vivo */}
                  {generatedInstallments.length > 0 && (
                    <div className="border border-zinc-200 rounded-lg p-3 bg-white space-y-2">
                      <div className="flex justify-between items-center text-xs border-b border-zinc-100 pb-2">
                        <span className="font-bold text-zinc-700">
                          Pré-visualização ({generatedInstallments.length} parcelas)
                        </span>
                        <span className="font-bold text-[#8C6D45]">
                          Total: {formatCurrency(totalInstallmentsAmount)}
                        </span>
                      </div>

                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                        {generatedInstallments.map((inst, i) => (
                          <div key={i} className="flex justify-between items-center text-xs py-1 px-2 hover:bg-zinc-50 rounded">
                            <span className="text-zinc-700 font-medium">{inst.description}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-zinc-500">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</span>
                              <span className="font-bold text-zinc-900">{formatCurrency(inst.amount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full bg-[#8C6D45] hover:bg-[#755630] text-white" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "single" ? "Salvar Despesa" : `Gerar ${generatedInstallments.length} Parcelas`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* CONTEÚDO PRINCIPAL: VISÃO AGRUPADA OU DETALHADA */}
      {viewMode === "grouped" ? (
        <div className="space-y-4">
          {/* Busca na visão agrupada */}
          <div className="relative max-w-xs">
            <Input
              placeholder="Buscar dívida ou fornecedor..."
              value={groupedSearch}
              onChange={(e) => {
                setGroupedSearch(e.target.value);
                setGroupedPage(1);
              }}
              className="bg-white border-zinc-200"
            />
          </div>

          {paginatedGroupedExpenses.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-400">
              {groupedSearch ? "Nenhuma dívida encontrada para a busca." : "Nenhuma despesa cadastrada."}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedGroupedExpenses.map((group) => {
                const percentPaid = Math.round((group.paidCount / group.totalCount) * 100) || 0;
                const isFullyPaid = group.paidCount === group.totalCount;
                const isExpanded = !!expandedGroups[group.id];

                return (
                  <div
                    key={group.id}
                    className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${
                      isFullyPaid ? "border-emerald-200/80 bg-emerald-50/10" : "border-zinc-200"
                    }`}
                  >
                    {/* Header do Card da Dívida */}
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Info Principal */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-zinc-900 truncate">
                            {group.baseDescription}
                          </h4>
                          <Badge variant="outline" className="bg-zinc-50 font-medium text-xs text-zinc-600 border-zinc-200">
                            <Building2 className="w-3 h-3 mr-1 text-zinc-400" />
                            {group.vendorName} {group.vendorCategory && `(${group.vendorCategory})`}
                          </Badge>
                          {isFullyPaid && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Totalmente Pago
                            </Badge>
                          )}
                        </div>

                        {/* Barra de Progresso de Quitação */}
                        <div className="space-y-1 pt-1 max-w-md">
                          <div className="flex justify-between text-xs font-medium text-zinc-600">
                            <span>
                              {group.paidCount} de {group.totalCount} parcelas pagas ({percentPaid}%)
                            </span>
                            <span className="font-semibold text-zinc-900">
                              {formatCurrency(group.paidAmount)} de {formatCurrency(group.totalAmount)}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                isFullyPaid ? "bg-emerald-500" : "bg-[#8C6D45]"
                              }`}
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Resumo & Próximo Vencimento */}
                      <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100 shrink-0">
                        {!isFullyPaid && group.nextDueDate && (
                          <div className="text-right text-xs space-y-0.5">
                            <span className="text-zinc-500 block">Próx. Vencimento:</span>
                            <span className="font-bold text-amber-700 block flex items-center justify-end gap-1">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              {new Date(group.nextDueDate).toLocaleDateString('pt-BR')} ({formatCurrency(group.nextDueAmount || 0)})
                            </span>
                          </div>
                        )}

                        {/* Atalho de Quitar Próxima Parcela */}
                        {!isFullyPaid && group.nextDueExpenseId && (
                          <Button
                            size="sm"
                            onClick={() => handleToggleStatus(group.nextDueExpenseId!, "PENDING")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-lg font-medium shadow-sm transition"
                            title="Marcar próxima parcela como paga"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Quitar Próxima
                          </Button>
                        )}

                        {/* Botão de Expansão (Sanfona) */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleGroupExpand(group.id)}
                          className="h-8 text-xs font-medium border-zinc-200 hover:bg-zinc-100"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1 text-zinc-500" /> Fechar
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1 text-zinc-500" /> Ver Parcelas ({group.totalCount})
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Sub-tabela Expandível com as Parcelas Individuais */}
                    {isExpanded && (
                      <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="bg-white rounded-lg border border-zinc-200/80 overflow-hidden shadow-2xs">
                          <Table>
                            <TableHeader className="bg-zinc-50/80">
                              <TableRow className="text-xs">
                                <TableHead className="py-2.5">Parcela / Vencimento</TableHead>
                                <TableHead className="py-2.5">Descrição</TableHead>
                                <TableHead className="py-2.5">Valor</TableHead>
                                <TableHead className="py-2.5">Status</TableHead>
                                <TableHead className="py-2.5 text-right">Ação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.expenses.map((expense) => {
                                const isPaid = expense.status === "PAID";
                                return (
                                  <TableRow key={expense.id} className={isPaid ? "bg-zinc-50/50" : ""}>
                                    <TableCell className={`text-xs ${isPaid ? "text-zinc-400" : "font-medium text-zinc-700"}`}>
                                      {new Date(expense.dueDate).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell className={`text-xs ${isPaid ? "text-zinc-400 line-through" : "text-zinc-900 font-medium"}`}>
                                      {expense.description}
                                    </TableCell>
                                    <TableCell className={`text-xs font-bold ${isPaid ? "text-zinc-400" : "text-zinc-900"}`}>
                                      {formatCurrency(expense.amount)}
                                    </TableCell>
                                    <TableCell>
                                      <button
                                        onClick={() => handleToggleStatus(expense.id, expense.status)}
                                        className="cursor-pointer"
                                      >
                                        <Badge variant={isPaid ? "default" : "outline"} className={`text-[11px] cursor-pointer transition-colors px-2 py-0.5 ${
                                          isPaid
                                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200"
                                            : "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200"
                                        }`}>
                                          {isPaid ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                                          {isPaid ? "Pago" : "Pendente"}
                                        </Badge>
                                      </button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(expense.id)}>
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Paginação dos Grupos de Dívida */}
              {totalGroupPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-500 shadow-sm">
                  <div>
                    Mostrando página <span className="font-semibold text-zinc-900">{safeGroupPage}</span> de{" "}
                    <span className="font-semibold text-zinc-900">{totalGroupPages}</span> ({filteredGroupedExpenses.length} contratos)
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-zinc-200"
                      onClick={() => setGroupedPage(1)}
                      disabled={safeGroupPage <= 1}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-zinc-200"
                      onClick={() => setGroupedPage(p => Math.max(1, p - 1))}
                      disabled={safeGroupPage <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="px-3 font-medium text-zinc-700">
                      Página {safeGroupPage} de {totalGroupPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-zinc-200"
                      onClick={() => setGroupedPage(p => Math.min(totalGroupPages, p + 1))}
                      disabled={safeGroupPage >= totalGroupPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-zinc-200"
                      onClick={() => setGroupedPage(totalGroupPages)}
                      disabled={safeGroupPage >= totalGroupPages}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* VISÃO DETALHADA: TABELA COMPLETA USANDO DATATABLE COM PAGINAÇÃO DE 15 ITENS */
        <DataTable
          data={expenses}
          pageSize={15}
          keyExtractor={(exp) => exp.id}
          searchPlaceholder="Buscar por descrição ou fornecedor..."
          emptyMessage="Nenhuma despesa cadastrada."
          columns={[
            {
              key: "dueDate",
              header: "Vencimento",
              sortable: true,
              accessor: (exp) => new Date(exp.dueDate).getTime(),
              cell: (exp) => (
                <span className={exp.status === "PAID" ? "text-zinc-400 text-sm font-mono" : "text-zinc-700 text-sm font-mono font-medium"}>
                  {new Date(exp.dueDate).toLocaleDateString('pt-BR')}
                </span>
              ),
            },
            {
              key: "vendor",
              header: "Fornecedor",
              sortable: true,
              accessor: (exp) => exp.vendor?.name || "",
              cell: (exp) => (
                <span className={`text-sm font-medium ${exp.status === "PAID" ? "text-zinc-400" : "text-zinc-900"}`}>
                  {exp.vendor?.name || "—"}
                </span>
              ),
            },
            {
              key: "description",
              header: "Descrição",
              sortable: true,
              accessor: (exp) => exp.description,
              cell: (exp) => (
                <span className={`text-sm ${exp.status === "PAID" ? "text-zinc-400 line-through" : "text-zinc-800"}`}>
                  {exp.description}
                </span>
              ),
            },
            {
              key: "amount",
              header: "Valor",
              sortable: true,
              className: "tabular-nums",
              accessor: (exp) => exp.amount,
              cell: (exp) => (
                <span className={`text-sm font-bold ${exp.status === "PAID" ? "text-zinc-400" : "text-zinc-900"}`}>
                  {formatCurrency(exp.amount)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              sortable: true,
              accessor: (exp) => exp.status,
              cell: (exp) => {
                const isPaid = exp.status === "PAID";
                return (
                  <button
                    onClick={() => handleToggleStatus(exp.id, exp.status)}
                    className="cursor-pointer"
                  >
                    <Badge variant={isPaid ? "default" : "outline"} className={`text-xs cursor-pointer transition-colors ${
                      isPaid
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200"
                    }`}>
                      {isPaid ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                      {isPaid ? "Pago" : "Pendente"}
                    </Badge>
                  </button>
                );
              },
            },
            {
              key: "actions",
              header: "Ações",
              sortable: false,
              searchable: false,
              className: "text-right pr-4",
              headerClassName: "text-right pr-4",
              cell: (exp) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          confirmAction?.();
        }}
        title="Excluir Despesa"
        description="Tem certeza de que deseja excluir esta despesa?"
      />
    </div>
  );
}
