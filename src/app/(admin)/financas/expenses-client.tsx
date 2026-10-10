"use client";
import { useRouter } from "next/navigation";
import { useSyncedState } from "@/hooks/use-synced-state";

import { useState, useMemo, useRef } from "react";
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
import { btn } from "@/components/landing/styles";
import { Chip } from "@/components/casal/ui";
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
  ListFilter,
  CheckCircle2,
  Calendar,
  Building2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ShoppingBag,
  FileCheck,
  CreditCard,
  QrCode,
  Upload,
  ArrowRight,
  Check,
  ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface InstallmentBlock {
  id: number;
  count: number;
  amount: string; // Ex: "300.00"
  startDate: string; // Ex: "2026-08-10"
}

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  dueDate: Date | string;
  status: string;
  type?: "CONTRACT" | "PURCHASE" | null;
  vendorId?: string | null;
  storeName?: string | null;
  purchaseUrl?: string | null;
  paymentMethod?: string | null;
  imageUrl?: string | null;
  vendor?: { name: string; category: string } | null;
}

interface VendorOption {
  id: string;
  name: string;
  category: string;
}

interface WalletCard {
  id: string;
  bank: string;
  nickname?: string | null;
  lastDigits?: string | null;
}

interface GroupedExpense {
  id: string;
  baseDescription: string;
  vendorName: string;
  vendorCategory: string;
  type: "CONTRACT" | "PURCHASE";
  storeName: string | null;
  purchaseUrl: string | null;
  paymentMethod: string | null;
  imageUrl: string | null;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  totalCount: number;
  nextDueDate: Date | string | null;
  nextDueAmount: number | null;
  nextDueExpenseId: string | null;
  expenses: ExpenseItem[];
}

const PAYMENT_METHODS = [
  { id: "credit_card_nubank", label: "Cartão de Crédito - Nubank", icon: CreditCard },
  { id: "credit_card_itau", label: "Cartão de Crédito - Itaú", icon: CreditCard },
  { id: "credit_card_other", label: "Cartão de Crédito (Outro)", icon: CreditCard },
  { id: "pix_balance", label: "Saldo em Conta / Pix", icon: QrCode },
  { id: "boleto", label: "Boleto Bancário", icon: FileCheck },
];

export function ExpensesClient({ initialExpenses, vendors, userCards = [] }: { initialExpenses: ExpenseItem[], vendors: VendorOption[], userCards?: WalletCard[] }) {
  const router = useRouter();
  const [expenses, setExpenses] = useSyncedState<ExpenseItem[]>(initialExpenses);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Modo de exibição: "grouped" (por Dívida/Contrato com progresso) ou "detailed" (tabela paginada)
  const [viewMode, setViewMode] = useState<"grouped" | "detailed">("grouped");
  const [filterType, setFilterType] = useState<"ALL" | "CONTRACT" | "PURCHASE">("ALL");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [groupedPage, setGroupedPage] = useState(1);
  const [groupedSearch, setGroupedSearch] = useState("");
  const GROUP_PAGE_SIZE = 6;

  // ESTADOS DO WIZARD STEP-BY-STEP (Passos 1, 2, 3)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [expenseType, setExpenseType] = useState<"CONTRACT" | "PURCHASE">("CONTRACT");
  
  // Passo 2: Detalhes & Origem
  const [description, setDescription] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix_balance");
  const [customPaymentMethod, setCustomPaymentMethod] = useState("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageFileName, setImageFileName] = useState<string>("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Passo 3 de 3: condição de pagamento (Única vs Parcelada em blocos)
  const [mode, setMode] = useState<"single" | "installment">("single");
  const [singleAmount, setSingleAmount] = useState("");
  const [singleDueDate, setSingleDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [formKey, setFormKey] = useState(0);

  const [blocks, setBlocks] = useState<InstallmentBlock[]>([
    { id: 1, count: 3, amount: "300", startDate: new Date().toISOString().split("T")[0] }
  ]);

  const resetForm = () => {
    setStep(1);
    setExpenseType("CONTRACT");
    setDescription("");
    setVendorId("");
    setStoreName("");
    setPurchaseUrl("");
    setPaymentMethod("pix_balance");
    setCustomPaymentMethod("");
    setImageBase64("");
    setImageFileName("");
    setMode("single");
    setSingleAmount("");
    setSingleDueDate(new Date().toISOString().split("T")[0]);
    setBlocks([{ id: 1, count: 3, amount: "300", startDate: new Date().toISOString().split("T")[0] }]);
    setFormKey(prev => prev + 1);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { // max 5MB
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageBase64(event.target?.result as string);
      setImageFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const allPaymentMethods = useMemo(() => {
    const list: Array<{ id: string; label: string; icon: typeof CreditCard }> = [
      { id: "pix_balance", label: "Saldo em Conta / Pix", icon: QrCode },
    ];

    if (userCards && userCards.length > 0) {
      for (const card of userCards) {
        list.push({
          id: `card_${card.id}`,
          label: `${card.bank}${card.nickname ? ` (${card.nickname})` : ""}${card.lastDigits ? ` ****${card.lastDigits}` : ""}`,
          icon: CreditCard,
        });
      }
    } else {
      list.push(
        { id: "credit_card_nubank", label: "Cartão Nubank", icon: CreditCard },
        { id: "credit_card_itau", label: "Cartão Itaú", icon: CreditCard }
      );
    }

    list.push({ id: "boleto", label: "Boleto Bancário", icon: FileCheck });
    return list;
  }, [userCards]);

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

  const updateBlock = (id: number, field: keyof InstallmentBlock, value: InstallmentBlock[keyof InstallmentBlock]) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  // Cálculo das parcelas geradas em tempo real
  const generatedInstallments = useMemo(() => {
    if (mode !== "installment") return [];

    const totalCount = blocks.reduce((sum, b) => sum + (Number(b.count) || 0), 0);
    if (totalCount === 0) return [];

    const items: Array<{
      description: string;
      amount: number;
      dueDate: string;
      type: "CONTRACT" | "PURCHASE";
      vendorId?: string | null;
      purchaseUrl?: string | null;
      paymentMethod?: string | null;
      imageUrl?: string | null;
      storeName?: string | null;
    }> = [];
    let currentIdx = 1;

    const finalPaymentMethod = paymentMethod === "custom" ? customPaymentMethod : PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label || paymentMethod;

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
          type: expenseType,
          vendorId: expenseType === "CONTRACT" ? vendorId : null,
          purchaseUrl: expenseType === "PURCHASE" ? purchaseUrl : null,
          paymentMethod: finalPaymentMethod,
          imageUrl: imageBase64 || null,
          storeName: expenseType === "PURCHASE" ? storeName : null,
        });
        currentIdx++;
      }
    }

    return items;
  }, [mode, description, vendorId, blocks, expenseType, purchaseUrl, paymentMethod, customPaymentMethod, imageBase64, storeName]);

  const totalInstallmentsAmount = useMemo(() => {
    return generatedInstallments.reduce((sum, item) => sum + item.amount, 0);
  }, [generatedInstallments]);

  // Filtragem por Tipo de Despesa (Contrato vs Compra)
  const filteredExpensesByType = useMemo(() => {
    if (filterType === "ALL") return expenses;
    return expenses.filter(e => (e.type || "CONTRACT") === filterType);
  }, [expenses, filterType]);

  // Agrupamento inteligente de despesas por Dívida/Contrato/Compra
  const groupedExpenses = useMemo<GroupedExpense[]>(() => {
    const map = new Map<string, GroupedExpense>();

    for (const exp of filteredExpensesByType) {
      const baseTitle = exp.description.replace(/\s*\(\d+[\/\sde]+\d+\)\s*$/i, "").trim();
      const expType = exp.type || "CONTRACT";
      const key = `${expType}_${exp.vendorId || exp.storeName || baseTitle.toLowerCase()}_${baseTitle.toLowerCase()}`;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          baseDescription: baseTitle,
          vendorName: exp.vendor?.name || exp.storeName || "Compra direta",
          vendorCategory: exp.vendor?.category || (expType === "PURCHASE" ? "Compra avulsa" : ""),
          type: expType,
          storeName: exp.storeName || null,
          purchaseUrl: exp.purchaseUrl || null,
          paymentMethod: exp.paymentMethod || null,
          imageUrl: exp.imageUrl || null,
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

      if (!group.imageUrl && exp.imageUrl) group.imageUrl = exp.imageUrl;
      if (!group.purchaseUrl && exp.purchaseUrl) group.purchaseUrl = exp.purchaseUrl;
      if (!group.paymentMethod && exp.paymentMethod) group.paymentMethod = exp.paymentMethod;

      if (exp.status === "PAID") {
        group.paidAmount += exp.amount;
        group.paidCount += 1;
      } else {
        group.pendingAmount += exp.amount;
        if (!group.nextDueDate || new Date(exp.dueDate) < new Date(group.nextDueDate)) {
          group.nextDueDate = exp.dueDate;
          group.nextDueAmount = exp.amount;
          group.nextDueExpenseId = exp.id;
        }
      }
    }

    for (const grp of map.values()) {
      grp.expenses.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.nextDueDate && b.nextDueDate) {
        return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
      }
      if (a.nextDueDate) return -1;
      if (b.nextDueDate) return 1;
      return a.baseDescription.localeCompare(b.baseDescription);
    });
  }, [filteredExpensesByType]);

  // Filtragem dos grupos
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

    const finalPaymentMethod = paymentMethod === "custom" ? customPaymentMethod : PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label || paymentMethod;

    const toastId = toast.loading("Salvando a despesa...");

    if (mode === "single") {
      const formData = new FormData();
      formData.append("description", description);
      const amountInCents = Math.round(parseFloat(singleAmount.replace(',', '.')) * 100);
      formData.append("amount", amountInCents.toString());
      formData.append("dueDate", singleDueDate);
      formData.append("type", expenseType);
      if (expenseType === "CONTRACT" && vendorId) formData.append("vendorId", vendorId);
      if (expenseType === "PURCHASE") {
        if (storeName) formData.append("storeName", storeName);
        if (purchaseUrl) formData.append("purchaseUrl", purchaseUrl);
      }
      if (finalPaymentMethod) formData.append("paymentMethod", finalPaymentMethod);
      if (imageBase64) formData.append("imageUrl", imageBase64);

      const res = await createExpense(formData);
      if (res.success) {
        toast.success("Despesa cadastrada.", { id: toastId });
        resetForm();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Erro ao realizar operação.", {
          id: toastId,
          duration: 6000,
          description: "Ocorreu um erro inesperado no servidor.",
        });
      }
    } else {
      // Modo Parcelamento
      if (expenseType === "CONTRACT" && !vendorId) {
        toast.error("Selecione um fornecedor para contratos.", { id: toastId });
        setLoading(false);
        return;
      }
      if (!description) {
        toast.error("Informe a descrição principal da despesa.", { id: toastId });
        setLoading(false);
        return;
      }
      if (generatedInstallments.length === 0) {
        toast.error("Configure ao menos uma parcela válida.", { id: toastId });
        setLoading(false);
        return;
      }

      const res = await createBatchExpenses(generatedInstallments);
      if (res.success) {
        toast.success(`${generatedInstallments.length} parcelas registradas.`, { id: toastId });
        resetForm();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Erro ao realizar operação.", {
          id: toastId,
          duration: 6000,
          description: "Ocorreu um erro inesperado no servidor.",
        });
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setConfirmAction(() => async () => {
      const toastId = toast.loading("Excluindo despesa...");
      const res = await deleteExpense(id);
      if (res.success) {
        setExpenses(expenses.filter(e => e.id !== id));
        toast.success("Despesa excluída com sucesso", { id: toastId });
      } else {
        toast.error(res.error || "Erro ao realizar operação.", {
          id: toastId,
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
      toast.success(newStatus === "PAID" ? "Parcela marcada como paga." : "Parcela marcada como pendente.");
    } else {
      toast.error(res.error || "Erro ao atualizar status da despesa.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros & Controles: Visão, Categoria e Cadastro */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        {/* Filtros de Tipo e Visão */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Filtro por Categoria (Contrato vs Compra) */}
          <div className="flex rounded-xl border border-linha bg-areia p-1">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`min-h-11 px-3 text-sm font-semibold rounded-lg transition-all sm:min-h-9 ${
                filterType === "ALL" ? "bg-papel text-tinta shadow-xs" : "text-tinta-suave hover:text-tinta"
              }`}
            >
              Todas ({expenses.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("CONTRACT")}
              className={`min-h-11 px-3 text-sm font-semibold rounded-lg transition-all sm:min-h-9 flex items-center gap-1 ${
                filterType === "CONTRACT" ? "bg-papel text-tinta shadow-xs" : "text-tinta-suave hover:text-tinta"
              }`}
            >
              <Building2 className="w-3 h-3" />
              Contratos
            </button>
            <button
              type="button"
              onClick={() => setFilterType("PURCHASE")}
              className={`min-h-11 px-3 text-sm font-semibold rounded-lg transition-all sm:min-h-9 flex items-center gap-1 ${
                filterType === "PURCHASE" ? "bg-papel text-tinta shadow-xs" : "text-tinta-suave hover:text-tinta"
              }`}
            >
              <ShoppingBag className="w-3 h-3" />
              Compras avulsas
            </button>
          </div>

          {/* Toggle de Visão (Agrupada vs Detalhada) */}
          <div className="flex rounded-xl border border-linha bg-areia p-1">
            <button
              type="button"
              onClick={() => setViewMode("grouped")}
              className={`min-h-11 px-3 text-sm font-semibold rounded-lg transition-all sm:min-h-9 flex items-center gap-1 ${
                viewMode === "grouped" ? "bg-papel text-tinta shadow-xs" : "text-tinta-suave hover:text-tinta"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-brand" />
              Agrupado
            </button>
            <button
              type="button"
              onClick={() => setViewMode("detailed")}
              className={`min-h-11 px-3 text-sm font-semibold rounded-lg transition-all sm:min-h-9 flex items-center gap-1 ${
                viewMode === "detailed" ? "bg-papel text-tinta shadow-xs" : "text-tinta-suave hover:text-tinta"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-brand" />
              Detalhado
            </button>
          </div>
        </div>

        {/* Modal de Cadastro STEP-BY-STEP */}
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <button type="button" className={btn.primary}>
              <Plus className="size-4" aria-hidden="true" /> Nova despesa
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl sm:max-w-3xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-7">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <CalendarRange className="w-5 h-5 text-brand" />
                Cadastrar despesa ou compra
              </DialogTitle>
              {/* Progresso dos Passos */}
              <div className="flex items-center gap-2 pt-2">
                <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? "bg-brand" : "bg-linha"}`} />
                <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? "bg-brand" : "bg-linha"}`} />
                <div className={`flex-1 h-1.5 rounded-full ${step >= 3 ? "bg-brand" : "bg-linha"}`} />
              </div>
            </DialogHeader>

            <form key={formKey} onSubmit={handleCreate} className="space-y-4 mt-2">
              {/* PASSO 1: TIPO DA DESPESA */}
              {step === 1 && (
                <div className="space-y-4 py-2 animate-in fade-in duration-200">
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-sm text-tinta">Qual o tipo desta despesa?</h3>
                    <p className="text-xs text-tinta-suave">Escolha entre contrato de prestação de serviços ou uma compra pontual.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Card Contrato */}
                    <div
                      onClick={() => setExpenseType("CONTRACT")}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                        expenseType === "CONTRACT"
                          ? "border-brand bg-brand-100/30 shadow-md ring-2 ring-brand/20"
                          : "border-linha hover:border-linha hover:bg-linho/50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-brand/10 text-brand rounded-xl">
                          <Building2 className="w-6 h-6" />
                        </div>
                        {expenseType === "CONTRACT" && <Check className="w-5 h-5 text-brand" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-tinta">Contrato com fornecedor</h4>
                        <p className="text-xs text-tinta-suave mt-1">
                          Serviços contratados como Buffet, Fotografia, DJ, Espaço do evento ou Decoração.
                        </p>
                      </div>
                    </div>

                    {/* Card Compra avulsa */}
                    <div
                      onClick={() => setExpenseType("PURCHASE")}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                        expenseType === "PURCHASE"
                          ? "border-salvia bg-salvia-suave/50 shadow-md ring-2 ring-salvia/20"
                          : "border-linha hover:border-linha hover:bg-linho/50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-salvia-suave text-salvia rounded-xl">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        {expenseType === "PURCHASE" && <Check className="w-5 h-5 text-salvia" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-tinta">Compra avulsa ou mimos</h4>
                        <p className="text-xs text-tinta-suave mt-1">
                          Lembrancinhas, itens de papelaria, mimos para padrinhos, Shopee, Mercado Livre, etc.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className={`${btn.primary} ${btn.block} mt-4`}
                  >
                    Próximo: detalhes e origem <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* PASSO 2: DETALHES, LINK, IMAGEM & ORIGEM DO PAGAMENTO */}
              {step === 2 && (
                <div className="space-y-4 py-1 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center pb-2 border-b border-areia">
                    <span className="text-sm font-semibold text-tinta">
                      Passo 2 de 3: {expenseType === "CONTRACT" ? "detalhes do contrato" : "detalhes da compra"}
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs text-tinta-suave">
                      Voltar ao tipo
                    </Button>
                  </div>

                  {/* Descrição Principal */}
                  <div>
                    <Label className="text-xs font-semibold text-tinta-suave mb-1 block">Descrição da despesa</Label>
                    <Input
                      placeholder={expenseType === "CONTRACT" ? "Ex: Sinal do Buffet ou Contrato de Fotos" : "Ex: Lembrancinhas para Padrinhos"}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  {/* Fornecedor (Contrato) vs Loja/Link (Compra) */}
                  {expenseType === "CONTRACT" ? (
                    <div>
                      <Label className="text-xs font-semibold text-tinta-suave mb-1 block">Fornecedor</Label>
                      <Select value={vendorId} onValueChange={setVendorId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o Fornecedor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name} ({v.category})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-tinta-suave mb-1 block">Loja ou local (opcional)</Label>
                        <Input
                          placeholder="Ex: Shopee, Mercado Livre, Loja X"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-tinta-suave mb-1 block">Link da compra ou do produto</Label>
                        <Input
                          placeholder="https://shopee.com.br/produto..."
                          value={purchaseUrl}
                          onChange={(e) => setPurchaseUrl(e.target.value)}
                          type="url"
                        />
                      </div>
                    </div>
                  )}

                  {/* Meio de pagamento de Pagamento */}
                  <div>
                    <Label className="text-xs font-semibold text-tinta-suave mb-1.5 block">Como foi ou será pago</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {allPaymentMethods.map((pm) => {
                        const Icon = pm.icon;
                        const isSelected = paymentMethod === pm.id || paymentMethod === pm.label;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.label)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                              isSelected
                                ? "border-brand bg-brand-100/40 text-brand font-bold shadow-xs"
                                : "border-linha hover:bg-linho text-tinta"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0 text-brand" />
                            <span className="truncate">{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upload da Imagem da Compra / Produto */}
                  <div>
                    <Label className="text-xs font-semibold text-tinta-suave mb-1 block">Foto da compra ou do produto (opcional)</Label>
                    <div className="border-2 border-dashed border-linha rounded-xl p-3 text-center relative hover:bg-linho transition flex items-center justify-center gap-3">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {imageBase64 ? (
                        <div className="flex items-center gap-3">
                          <img src={imageBase64} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-linha" />
                          <span className="text-xs font-medium text-tinta truncate max-w-[200px]">{imageFileName}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setImageBase64("")} className="text-xs text-perigo h-6 px-2">Remover</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-tinta-suave text-xs py-1">
                          <Upload className="w-4 h-4 text-tinta-suave" />
                          <span>Clique para anexar foto do produto ou print da compra</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3">
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!description.trim()) {
                          toast.error("Informe a descrição da despesa.");
                          return;
                        }
                        if (expenseType === "CONTRACT" && !vendorId) {
                          toast.error("Selecione um fornecedor.");
                          return;
                        }
                        setStep(3);
                      }}
                      className={`${btn.primary} w-2/3`}
                    >
                      Próximo: condição de pagamento <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* PASSO 3: CONDIÇÃO DE PAGAMENTO (VALOR & PARCELAS) */}
              {step === 3 && (
                <div className="space-y-4 py-1 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center pb-2 border-b border-areia">
                    <span className="text-sm font-semibold text-tinta">
                      Passo 3 de 3: condição de pagamento
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setStep(2)} className="text-xs text-tinta-suave">
                      Voltar aos detalhes
                    </Button>
                  </div>

                  {/* Seletor de Modo: Única vs Parcelada */}
                  <div className="flex bg-areia p-1 rounded-lg border border-linha">
                    <Button
                      type="button"
                      variant={mode === "single" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMode("single")}
                      className={`flex-1 h-8 text-xs font-semibold rounded-md ${mode === "single" ? "shadow-sm" : ""}`}
                    >
                      Pagamento único
                    </Button>
                    <Button
                      type="button"
                      variant={mode === "installment" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMode("installment")}
                      className={`flex-1 h-8 text-xs font-semibold rounded-md ${mode === "installment" ? "shadow-sm" : ""}`}
                    >
                      Parcelado
                    </Button>
                  </div>

                  {mode === "single" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold text-tinta-suave mb-1 block">Valor (R$)</Label>
                        <Input
                          placeholder="Ex: 350.00"
                          type="number"
                          step="0.01"
                          value={singleAmount}
                          onChange={(e) => setSingleAmount(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-tinta-suave mb-1 block">Vencimento</Label>
                        <DatePicker
                          value={singleDueDate}
                          onChange={(e) => setSingleDueDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    /* Modo Parcelado Flexível */
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-semibold text-tinta flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-brand" />
                            Blocos de parcelas
                          </Label>
                          <Button type="button" variant="outline" size="sm" onClick={addBlock} className="text-xs h-7">
                            + Adicionar bloco
                          </Button>
                        </div>

                        {blocks.map((block, idx) => (
                          <div key={block.id} className="p-3 bg-linho border border-linha rounded-lg space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold text-tinta-suave">
                              <span>Bloco #{idx + 1}</span>
                              {blocks.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeBlock(block.id)}
                                  className="text-perigo hover:text-perigo text-xs cursor-pointer"
                                >
                                  Remover bloco
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs text-tinta-suave">Número de parcelas</Label>
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
                                <Label className="text-xs text-tinta-suave">Valor da Parcela (R$)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={block.amount}
                                  onChange={(e) => updateBlock(block.id, "amount", e.target.value)}
                                  placeholder="Ex: 300.00"
                                />
                              </div>

                              <div>
                                <Label className="text-xs text-tinta-suave">Primeiro vencimento</Label>
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
                        <div className="border border-linha rounded-lg p-3 bg-papel space-y-2">
                          <div className="flex justify-between items-center text-xs border-b border-areia pb-2">
                            <span className="font-bold text-tinta">
                              Prévia ({generatedInstallments.length} parcelas)
                            </span>
                            <span className="font-bold text-brand">
                              Total: {formatCurrency(totalInstallmentsAmount)}
                            </span>
                          </div>

                          <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                            {generatedInstallments.map((inst, i) => (
                              <div key={i} className="flex justify-between items-center text-xs py-1 px-2 hover:bg-linho rounded">
                                <span className="text-tinta font-medium">{inst.description}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-tinta-suave">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</span>
                                  <span className="font-bold text-tinta">{formatCurrency(inst.amount)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-1/3">
                      Voltar
                    </Button>
                    <Button type="submit" className={`${btn.primary} w-2/3`} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "single" ? "Cadastrar despesa" : `Gerar ${generatedInstallments.length} Parcelas`}
                    </Button>
                  </div>
                </div>
              )}
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
              placeholder="Buscar por descrição ou loja..."
              value={groupedSearch}
              onChange={(e) => {
                setGroupedSearch(e.target.value);
                setGroupedPage(1);
              }}
              className="bg-papel border-linha"
            />
          </div>

          {paginatedGroupedExpenses.length === 0 ? (
            <div className="bg-papel border border-linha rounded-xl p-12 text-center text-tinta-suave">
              {groupedSearch ? "Nenhuma despesa encontrada para a busca." : "Nenhuma despesa cadastrada para este filtro."}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedGroupedExpenses.map((group) => {
                const percentPaid = Math.round((group.paidCount / group.totalCount) * 100) || 0;
                const isFullyPaid = group.paidCount === group.totalCount;
                const isExpanded = !!expandedGroups[group.id];
                const isPurchase = group.type === "PURCHASE";

                return (
                  <div
                    key={group.id}
                    className={`bg-papel border rounded-2xl shadow-[var(--shadow-aceito-1)] overflow-hidden transition-all duration-200 ${
                      isFullyPaid ? "border-sucesso/30/80 bg-sucesso-suave/10" : "border-linha"
                    }`}
                  >
                    {/* Header do Card da Dívida / Compra */}
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Miniatura + Info Principal */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {group.imageUrl ? (
                          <img
                            src={group.imageUrl}
                            alt={group.baseDescription}
                            className="w-14 h-14 object-cover rounded-xl border border-linha shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                            isPurchase ? "bg-salvia-suave text-salvia border-transparent" : "bg-ameixa-suave text-ameixa border-transparent"
                          }`}>
                            {isPurchase ? <ShoppingBag className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                          </div>
                        )}

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-base text-tinta truncate">
                              {group.baseDescription}
                            </h4>
                            <Chip tone={isPurchase ? "salvia" : "neutro"} icon={isPurchase ? ShoppingBag : Building2} className="min-h-6 text-[13px]">
                              {isPurchase ? `Compra: ${group.vendorName}` : group.vendorName}
                            </Chip>
                            {isFullyPaid && (
                              <Chip tone="sucesso" icon={CheckCircle2} className="min-h-6 text-[13px]">Quitado</Chip>
                            )}
                          </div>

                          {/* Origem e Link de Compra */}
                          <div className="flex items-center gap-3 text-xs text-tinta-suave flex-wrap">
                            {group.paymentMethod && (
                              <span className="inline-flex items-center gap-1 text-tinta-suave font-medium bg-areia px-2 py-0.5 rounded-md">
                                <CreditCard className="w-3 h-3 text-tinta-suave" />
                                {group.paymentMethod}
                              </span>
                            )}
                            {group.purchaseUrl && (
                              <a
                                href={group.purchaseUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-salvia hover:underline inline-flex items-center gap-1 font-semibold"
                              >
                                <ExternalLink className="w-3 h-3" /> Ver produto ou loja
                              </a>
                            )}
                          </div>

                          {/* Barra de Progresso de Quitação */}
                          <div className="space-y-1 pt-1 max-w-md">
                            <div className="flex justify-between text-xs font-medium text-tinta-suave">
                              <span>
                                {group.paidCount} de {group.totalCount} parcelas pagas ({percentPaid}%)
                              </span>
                              <span className="font-semibold text-tinta">
                                {formatCurrency(group.paidAmount)} de {formatCurrency(group.totalAmount)}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-areia rounded-full overflow-hidden border border-linha/50">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                  isFullyPaid ? "bg-sucesso" : isPurchase ? "bg-salvia" : "bg-brand"
                                }`}
                                style={{ width: `${percentPaid}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resumo & Próximo Vencimento */}
                      <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-linha md:shrink-0 justify-between md:justify-end">
                        {!isFullyPaid && group.nextDueDate && (
                          <div className="w-full text-xs space-y-0.5 md:w-auto md:text-right">
                            <span className="text-tinta-suave block">Próximo vencimento</span>
                            <span className="font-bold text-aviso flex items-center gap-1 md:justify-end">
                              <Calendar className="w-3.5 h-3.5 text-aviso" />
                              {new Date(group.nextDueDate).toLocaleDateString('pt-BR')} ({formatCurrency(group.nextDueAmount || 0)})
                            </span>
                          </div>
                        )}

                        {/* Atalho de Quitar a próxima Parcela */}
                        {!isFullyPaid && group.nextDueExpenseId && (
                          <Button
                            size="sm"
                            onClick={() => handleToggleStatus(group.nextDueExpenseId!, "PENDING")}
                            className="h-11 rounded-xl bg-sucesso px-4 text-sm font-semibold text-white shadow-sm hover:bg-sucesso/90 sm:h-9"
                            title="Marcar próxima parcela como paga"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Quitar a próxima
                          </Button>
                        )}

                        {/* Botão de Expansão (Sanfona) */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleGroupExpand(group.id)}
                          className="h-11 rounded-xl border-linha-forte px-3 text-sm font-semibold hover:bg-ameixa-suave sm:h-9"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1 text-tinta-suave" /> Fechar
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1 text-tinta-suave" /> Parcelas ({group.totalCount})
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Sub-tabela Expandível com as Parcelas Individuais */}
                    {isExpanded && (
                      <div className="border-t border-areia bg-linho/50 p-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="bg-papel rounded-lg border border-linha/80 overflow-hidden shadow-2xs">
                          <Table>
                            <TableHeader className="bg-linho/80">
                              <TableRow className="text-xs">
                                <TableHead className="py-2.5">Vencimento</TableHead>
                                <TableHead className="py-2.5">Descrição</TableHead>
                                <TableHead className="py-2.5">Meio de pagamento</TableHead>
                                <TableHead className="py-2.5">Valor</TableHead>
                                <TableHead className="py-2.5">Status</TableHead>
                                <TableHead className="py-2.5 text-right">Ação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.expenses.map((expense) => {
                                const isPaid = expense.status === "PAID";
                                return (
                                  <TableRow key={expense.id} className={isPaid ? "bg-linho/50" : ""}>
                                    <TableCell className={`text-xs ${isPaid ? "text-tinta-suave" : "font-medium text-tinta"}`}>
                                      {new Date(expense.dueDate).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell className={`text-xs ${isPaid ? "text-tinta-suave line-through" : "text-tinta font-medium"}`}>
                                      {expense.description}
                                    </TableCell>
                                    <TableCell className="text-xs text-tinta-suave">
                                      {expense.paymentMethod || "—"}
                                    </TableCell>
                                    <TableCell className={`text-xs font-bold ${isPaid ? "text-tinta-suave" : "text-tinta"}`}>
                                      {formatCurrency(expense.amount)}
                                    </TableCell>
                                    <TableCell>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStatus(expense.id, expense.status)}
                                        aria-label={isPaid ? "Pago. Tocar para marcar como pendente" : "Pendente. Tocar para marcar como paga"}
                                        className="inline-flex min-h-11 cursor-pointer items-center rounded-lg"
                                      >
                                        <Chip tone={isPaid ? "sucesso" : "aviso"} icon={isPaid ? CheckCircle : Clock}>
                                          {isPaid ? "Pago" : "Pendente"}
                                        </Chip>
                                      </button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button aria-label="Excluir" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(expense.id)}>
                                        <Trash2 className="w-3.5 h-3.5 text-perigo" />
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
                <div className="flex items-center justify-between px-4 py-3 bg-papel border border-linha rounded-xl text-xs text-tinta-suave shadow-sm">
                  <div>
                    Página <span className="font-semibold text-tinta">{safeGroupPage}</span> de{" "}
                    <span className="font-semibold text-tinta">{totalGroupPages}</span> ({filteredGroupedExpenses.length} itens)
                  </div>
                  <div className="flex items-center gap-1">
                    <Button aria-label="Primeira página"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-linha"
                      onClick={() => setGroupedPage(1)}
                      disabled={safeGroupPage <= 1}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button aria-label="Anterior"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-linha"
                      onClick={() => setGroupedPage(p => Math.max(1, p - 1))}
                      disabled={safeGroupPage <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="px-3 font-medium text-tinta">
                      Página {safeGroupPage} de {totalGroupPages}
                    </span>
                    <Button aria-label="Próximo"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-linha"
                      onClick={() => setGroupedPage(p => Math.min(totalGroupPages, p + 1))}
                      disabled={safeGroupPage >= totalGroupPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button aria-label="Última página"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-linha"
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
          data={filteredExpensesByType}
          pageSize={15}
          keyExtractor={(exp) => exp.id}
          searchPlaceholder="Buscar por descrição ou loja..."
          emptyMessage="Nenhuma despesa cadastrada para este filtro."
          columns={[
            {
              key: "dueDate",
              header: "Vencimento",
              sortable: true,
              accessor: (exp) => new Date(exp.dueDate).getTime(),
              cell: (exp) => (
                <span className={exp.status === "PAID" ? "text-tinta-suave text-sm font-mono" : "text-tinta text-sm font-mono font-medium"}>
                  {new Date(exp.dueDate).toLocaleDateString('pt-BR')}
                </span>
              ),
            },
            {
              key: "type",
              header: "Tipo",
              sortable: true,
              accessor: (exp) => exp.type || "CONTRACT",
              cell: (exp) => {
                const isPur = (exp.type || "CONTRACT") === "PURCHASE";
                return (
                  <Chip tone={isPur ? "salvia" : "neutro"} icon={isPur ? ShoppingBag : Building2}>
                    {isPur ? "Compra" : "Contrato"}
                  </Chip>
                );
              },
            },
            {
              key: "vendor",
              header: "Origem ou fornecedor",
              sortable: true,
              accessor: (exp) => exp.vendor?.name || exp.storeName || "",
              cell: (exp) => (
                <div className="flex items-center gap-2">
                  {exp.imageUrl && (
                    <img src={exp.imageUrl} alt={exp.description} className="w-7 h-7 object-cover rounded-md border border-linha shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${exp.status === "PAID" ? "text-tinta-suave" : "text-tinta"}`}>
                    {exp.vendor?.name || exp.storeName || "Compra direta"}
                  </span>
                </div>
              ),
            },
            {
              key: "description",
              header: "Descrição",
              sortable: true,
              accessor: (exp) => exp.description,
              cell: (exp) => (
                <div className="space-y-0.5">
                  <span className={`text-sm block ${exp.status === "PAID" ? "text-tinta-suave line-through" : "text-tinta"}`}>
                    {exp.description}
                  </span>
                  {exp.purchaseUrl && (
                    <a href={exp.purchaseUrl} target="_blank" rel="noreferrer" className="text-xs text-salvia hover:underline inline-flex items-center gap-1 font-medium">
                      <ExternalLink className="w-3 h-3" /> Ver link da compra
                    </a>
                  )}
                </div>
              ),
            },
            {
              key: "amount",
              header: "Valor",
              sortable: true,
              className: "tabular-nums",
              accessor: (exp) => exp.amount,
              cell: (exp) => (
                <span className={`text-sm font-bold ${exp.status === "PAID" ? "text-tinta-suave" : "text-tinta"}`}>
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
                    type="button"
                    onClick={() => handleToggleStatus(exp.id, exp.status)}
                    aria-label={isPaid ? "Pago. Tocar para marcar como pendente" : "Pendente. Tocar para marcar como paga"}
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-lg"
                  >
                    <Chip tone={isPaid ? "sucesso" : "aviso"} icon={isPaid ? CheckCircle : Clock}>
                      {isPaid ? "Pago" : "Pendente"}
                    </Chip>
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
                  <Button aria-label="Excluir" variant="ghost" size="icon" onClick={() => handleDelete(exp.id)}>
                    <Trash2 className="w-4 h-4 text-perigo" />
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
        title="Excluir despesa"
        description="Tem certeza de que deseja excluir esta despesa?"
      />
    </div>
  );
}
