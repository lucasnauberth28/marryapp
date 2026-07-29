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
import { Plus, Trash2, Loader2, CheckCircle, Clock, CalendarRange, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface InstallmentBlock {
  id: number;
  count: number;
  amount: string; // Ex: "300.00"
  startDate: string; // Ex: "2026-08-10"
}

export function ExpensesClient({ initialExpenses, vendors }: { initialExpenses: any[], vendors: any[] }) {
  const [expenses, setExpenses] = useState<any[]>(initialExpenses);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

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
      <div className="flex justify-between items-center">
        <Input placeholder="Buscar despesa..." className="max-w-xs" />
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nova Despesa</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-[#8C6D45]" />
                Cadastrar Despesa
              </DialogTitle>
            </DialogHeader>

            {/* Seletor de Modo */}
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
                    <SelectTrigger>
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
                    <SelectTrigger>
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
                              className="text-red-500 hover:text-red-700 text-xs"
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

      <div className="bg-white rounded-lg border border-zinc-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vencimento</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                  Nenhuma despesa cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => {
                const isPaid = expense.status === "PAID";
                return (
                  <TableRow key={expense.id} className={isPaid ? "bg-zinc-50/50" : ""}>
                    <TableCell className={isPaid ? "text-zinc-400" : ""}>
                      {new Date(expense.dueDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className={`font-medium ${isPaid ? "text-zinc-400" : ""}`}>
                      {expense.vendor.name}
                    </TableCell>
                    <TableCell className={isPaid ? "text-zinc-400 line-through" : ""}>
                      {expense.description}
                    </TableCell>
                    <TableCell className={`font-bold ${isPaid ? "text-zinc-400" : "text-zinc-900"}`}>
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleStatus(expense.id, expense.status)}
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
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
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
