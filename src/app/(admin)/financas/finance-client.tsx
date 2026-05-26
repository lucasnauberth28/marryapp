"use client";

import { useState, useTransition } from "react";
import type { TransactionWithGift } from "@/actions/finance-actions";
import { approvePixTransaction } from "@/actions/finance-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Loader2,
  CreditCard,
  QrCode,
  ArrowUpDown,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ==========================================
// UTILS
// ==========================================

function formatCurrency(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==========================================
// TOAST COMPONENT (lightweight)
// ==========================================

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-300 ${
        type === "success"
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : "bg-red-50 text-red-800 border-red-200"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      ) : (
        <X className="w-4 h-4 text-red-600" />
      )}
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-zinc-400 hover:text-zinc-600 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ==========================================
// STATUS BADGE
// ==========================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    APPROVED: {
      label: "Aprovado",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    },
    PENDING: {
      label: "Pendente",
      className:
        "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    },
    FAILED: {
      label: "Falhou",
      className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    },
    REFUNDED: {
      label: "Estornado",
      className:
        "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
    },
    REJECTED: {
      label: "Rejeitado",
      className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    },
  };

  const c = config[status] || config.PENDING;

  return (
    <Badge
      variant="outline"
      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${c.className}`}
    >
      {c.label}
    </Badge>
  );
}

// ==========================================
// METHOD BADGE
// ==========================================

function MethodBadge({ method }: { method: string }) {
  if (method === "PIX") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
        <QrCode className="w-3 h-3" />
        Pix
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
      <CreditCard className="w-3 h-3" />
      Cartão
    </span>
  );
}

// ==========================================
// MAIN TABLE COMPONENT
// ==========================================

interface FinanceTableProps {
  transactions: TransactionWithGift[];
}

type SortField = "createdAt" | "amount" | "guestName";
type SortDir = "asc" | "desc";

export function FinanceTable({ transactions }: FinanceTableProps) {
  const [isPending, startTransition] = useTransition();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Filtro + ordenação
  const filtered = transactions
    .filter((t) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const name = (t.guest?.name || "").toLowerCase();
      const gift = t.gift.title.toLowerCase();
      return name.includes(q) || gift.includes(q);
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "createdAt") {
        return (
          dir *
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        );
      }
      if (sortField === "amount") {
        return dir * ((a.netAmount || 0) - (b.netAmount || 0));
      }
      if (sortField === "guestName") {
        const na = (a.guest?.name || "").toLowerCase();
        const nb = (b.guest?.name || "").toLowerCase();
        return dir * na.localeCompare(nb);
      }
      return 0;
    });

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function handleApprove(transactionId: string, giftId: string) {
    setApprovingId(transactionId);
    startTransition(async () => {
      const result = await approvePixTransaction(transactionId, giftId);
      if (result.success) {
        setToast({
          message: "Pagamento Pix confirmado com sucesso!",
          type: "success",
        });
      } else {
        setToast({
          message: result.error || "Erro ao confirmar pagamento.",
          type: "error",
        });
      }
      setApprovingId(null);
      // Auto-dismiss toast
      setTimeout(() => setToast(null), 4000);
    });
  }

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => toggleSort(field)}
      className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors group"
    >
      {children}
      <ArrowUpDown
        className={`w-3 h-3 transition-colors ${
          sortField === field
            ? "text-zinc-900"
            : "text-zinc-300 group-hover:text-zinc-400"
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Buscar por convidado ou presente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-white border-zinc-200 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/80 hover:bg-zinc-50/80">
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pl-4">
                <SortButton field="createdAt">Data</SortButton>
              </TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <SortButton field="guestName">Convidado</SortButton>
              </TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Presente
              </TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Método
              </TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">
                <SortButton field="amount">Valor Líquido</SortButton>
              </TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center pr-4">
                Ação
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-zinc-400 text-sm"
                >
                  {search
                    ? "Nenhuma transação encontrada para esta busca."
                    : "Nenhuma transação registrada ainda."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="group hover:bg-zinc-50/60 transition-colors"
                >
                  <TableCell className="text-sm text-zinc-600 pl-4">
                    {formatDate(tx.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-zinc-900">
                    {tx.guest?.name || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600 max-w-[200px] truncate">
                    {tx.gift.title}
                  </TableCell>
                  <TableCell>
                    <MethodBadge method={tx.paymentMethod} />
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-zinc-900 text-right tabular-nums">
                    {formatCurrency(tx.netAmount || tx.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={tx.status} />
                  </TableCell>
                  <TableCell className="text-center pr-4">
                    {tx.status === "PENDING" && tx.paymentMethod === "PIX" ? (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(tx.id, tx.gift.id)}
                        disabled={isPending && approvingId === tx.id}
                        className="h-8 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50"
                      >
                        {isPending && approvingId === tx.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Confirmar
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="text-zinc-300 text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary footer */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          {filtered.length} de {transactions.length} transação
          {transactions.length !== 1 ? "ões" : ""}
        </span>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-zinc-500 hover:text-zinc-700 underline transition-colors"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
