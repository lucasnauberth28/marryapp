"use client";

import { useState } from "react";
import { ExpenseStatus } from "@/types/local";
import { createExpense, deleteExpense, updateExpenseStatus } from "@/actions/expense-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ExpensesClient({ initialExpenses, vendors }: { initialExpenses: any[], vendors: any[] }) {
  const [expenses, setExpenses] = useState<any[]>(initialExpenses);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Converte o valor digitado (ex: 150.00) para centavos
    const amountVal = formData.get("amount") as string;
    const amountInCents = Math.round(parseFloat(amountVal.replace(',', '.')) * 100);
    formData.set("amount", amountInCents.toString());

    const res = await createExpense(formData);
    
    if (res.success) {
      setOpen(false);
      window.location.reload();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta despesa?")) return;
    const res = await deleteExpense(id);
    if (res.success) {
      setExpenses(expenses.filter(e => e.id !== id));
    } else {
      alert(res.error);
    }
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nova Despesa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Despesa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <Input name="description" placeholder="Descrição (ex: Sinal do Buffet)" required />
              
              <select name="vendorId" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Selecione o Fornecedor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-4">
                <Input name="amount" placeholder="Valor (ex: 1500.00)" type="number" step="0.01" required />
                <Input name="dueDate" type="date" required />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
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
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          isPaid 
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        }`}
                      >
                        {isPaid ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {isPaid ? "Pago" : "Pendente"}
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
    </div>
  );
}
