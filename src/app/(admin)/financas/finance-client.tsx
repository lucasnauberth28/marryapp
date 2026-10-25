"use client";

import { useState, useTransition } from "react";
import type { TransacaoComPresente } from "@/actions/finance-actions";
import { aprovarTransacaoPix, alternarAgradecimentoEnviado } from "@/actions/finance-actions";
import { TabelaDeDados } from "@/components/ui/data-table";
import { Etiqueta, type TomDaEtiqueta } from "@/components/casal/ui";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  CreditCard,
  QrCode,
  ArrowUpDown,
  X,
  Heart,
  Check,
  Clock,
  Undo2,
} from "lucide-react";

import { formatarReais } from "@/lib/formatacao/dinheiro";
import { somenteDigitos } from "@/lib/formatacao/telefone";
// ==========================================
// UTILS
// ==========================================

function formatarDataDaTransacao(date: Date): string {
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

function AvisoTemporario({
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
          ? "bg-sucesso-suave text-sucesso border-sucesso/30"
          : "bg-perigo-suave text-perigo border-perigo/40"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-4 h-4 text-sucesso" />
      ) : (
        <X className="w-4 h-4 text-perigo" />
      )}
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Fechar aviso"
        className="ml-2 text-tinta-suave hover:text-tinta-suave transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ==========================================
// STATUS BADGE
// ==========================================

function SeloDeSituacao({ status }: { status: string }) {
  const config: Record<string, { label: string; tone: TomDaEtiqueta; icon: typeof Clock }> = {
    APPROVED: { label: "Recebido", tone: "sucesso", icon: Check },
    PENDING: { label: "A conferir", tone: "aviso", icon: Clock },
    FAILED: { label: "Não passou", tone: "perigo", icon: X },
    REFUNDED: { label: "Estornado", tone: "neutro", icon: Undo2 },
    REJECTED: { label: "Recusado", tone: "perigo", icon: X },
  };
  const c = config[status] || config.PENDING;
  return (
    <Etiqueta tone={c.tone} icon={c.icon}>
      {c.label}
    </Etiqueta>
  );
}

// ==========================================
// METHOD BADGE
// ==========================================

function SeloDaForma({ method }: { method: string }) {
  const isPix = method === "PIX";
  const Icon = isPix ? QrCode : CreditCard;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-tinta">
      <Icon aria-hidden="true" className="size-4 text-tinta-suave" />
      {isPix ? "Pix" : "Cartão"}
    </span>
  );
}

// ==========================================
// MAIN TABLE COMPONENT
// ==========================================

interface PropriedadesDaTabelaFinanceira {
  transactions: TransacaoComPresente[];
}

type CampoDeOrdenacao = "createdAt" | "amount" | "guestName";
type SentidoDeOrdenacao = "asc" | "desc";

export function TabelaFinanceira({ transactions }: PropriedadesDaTabelaFinanceira) {
  const [isPending, startTransition] = useTransition();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [thankingId, setThankingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<CampoDeOrdenacao>("createdAt");
  const [sortDir, setSortDir] = useState<SentidoDeOrdenacao>("desc");

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

  function toggleSort(field: CampoDeOrdenacao) {
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
      const result = await aprovarTransacaoPix(transactionId, giftId);
      if (result.success) {
        setToast({
          message: "Pix confirmado. O presente foi marcado como pago.",
          type: "success",
        });
      } else {
        setToast({
          message: result.error || "Não deu para confirmar o Pix. Tente de novo.",
          type: "error",
        });
      }
      setApprovingId(null);
      setTimeout(() => setToast(null), 4000);
    });
  }

  function handleThankYou(transactionId: string, currentStatus: boolean, phone?: string | null, guestName?: string | null, giftName?: string | null) {
    setThankingId(transactionId);
    startTransition(async () => {
      const result = await alternarAgradecimentoEnviado(transactionId, currentStatus);
      if (result.success && !currentStatus && phone) {
        // Se acabou de marcar como enviado e tem telefone, abre o WhatsApp
        const cleanPhone = somenteDigitos(phone);
        const firstName = guestName ? guestName.split(" ")[0] : "Querido(a)";
        const text = encodeURIComponent(`Oi, ${firstName}! Passando para agradecer pelo presente (${giftName}). Foi muito especial para nós. Obrigado de coração!`);
        window.open(`https://wa.me/55${cleanPhone}?text=${text}`, "_blank");
        
        setToast({
          message: "Mensagem de agradecimento preparada no WhatsApp. Falta enviar por lá.",
          type: "success",
        });
      } else if (result.success) {
        setToast({
          message: currentStatus ? "Agradecimento desmarcado." : "Marcado como agradecido.",
          type: "success",
        });
      } else {
        setToast({
          message: result.error || "Não deu para atualizar o agradecimento. Tente de novo.",
          type: "error",
        });
      }
      setThankingId(null);
      setTimeout(() => setToast(null), 4000);
    });
  }

  const SortButton = ({
    field,
    children,
  }: {
    field: CampoDeOrdenacao;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => toggleSort(field)}
      className="inline-flex items-center gap-1 hover:text-tinta transition-colors group"
    >
      {children}
      <ArrowUpDown
        className={`w-3 h-3 transition-colors ${
          sortField === field
            ? "text-tinta"
            : "text-linha-forte group-hover:text-tinta-suave"
        }`}
      />
    </button>
  );

  const actionFor = (tx: TransacaoComPresente) => (
              <div className="flex items-center justify-center gap-2">
                {tx.status === "PENDING" && tx.paymentMethod === "PIX" ? (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(tx.id, tx.gift.id)}
                    loading={isPending && approvingId === tx.id}
                    disabled={isPending}
                    className="h-11 rounded-xl bg-sucesso px-4 text-sm font-semibold text-white shadow-sm hover:bg-sucesso/90 disabled:opacity-50 sm:h-9"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Confirmar
                  </Button>
                ) : tx.status === "APPROVED" ? (
                  <Button
                    size="sm"
                    variant={tx.thankYouSent ? "secondary" : "outline"}
                    onClick={() => handleThankYou(tx.id, tx.thankYouSent, tx.guest?.phone, tx.guest?.name, tx.gift.title)}
                    loading={isPending && thankingId === tx.id}
                    disabled={isPending}
                    className={`h-11 rounded-xl px-4 text-sm font-semibold disabled:opacity-50 sm:h-9 ${
                      tx.thankYouSent
                        ? "border-transparent bg-ameixa-suave text-ameixa hover:bg-ameixa-suave"
                        : "border-linha-forte text-tinta hover:bg-ameixa-suave"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 mr-1 ${tx.thankYouSent ? "fill-ameixa text-ameixa" : ""}`} />
                    {tx.thankYouSent ? "Agradecido" : "Agradecer"}
                  </Button>
                ) : (
                  <span className="text-tinta-suave text-xs">—</span>
                )}
              </div>
  );

  return (
    <div className="space-y-4">
      <TabelaDeDados
        data={transactions}
        mobileCard={(tx) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-tinta">{tx.guest?.name || tx.guestName || "Convidado sem nome"}</p>
                <p className="text-sm text-tinta-suave">{formatarDataDaTransacao(tx.createdAt)}</p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-tinta">{formatarReais(tx.netAmount || tx.amount)}</span>
            </div>
            <p className="text-[15px] text-tinta">{tx.gift.title}</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <SeloDeSituacao status={tx.status} />
                <SeloDaForma method={tx.paymentMethod} />
              </div>
              {actionFor(tx)}
            </div>
          </div>
        )}
        pageSize={15}
        keyExtractor={(tx) => tx.id}
        searchPlaceholder="Buscar por convidado ou presente..."
        emptyMessage="Ainda não há pagamentos de presentes. Quando alguém presentear vocês, aparece aqui."
        columns={[
          {
            key: "createdAt",
            header: "Data",
            sortable: true,
            accessor: (tx) => new Date(tx.createdAt).getTime(),
            cell: (tx) => (
              <span className="text-sm text-tinta-suave tabular-nums">
                {formatarDataDaTransacao(tx.createdAt)}
              </span>
            ),
          },
          {
            key: "guestName",
            header: "Convidado",
            sortable: true,
            accessor: (tx) => tx.guest?.name || "",
            cell: (tx) => (
              <span className="text-sm font-medium text-tinta">
                {tx.guest?.name || tx.guestName || "—"}
              </span>
            ),
          },
          {
            key: "giftTitle",
            header: "Presente",
            sortable: true,
            accessor: (tx) => tx.gift?.title || "",
            cell: (tx) => (
              <span className="text-sm text-tinta-suave max-w-[200px] truncate block">
                {tx.gift.title}
              </span>
            ),
          },
          {
            key: "paymentMethod",
            header: "Como pagou",
            sortable: true,
            accessor: (tx) => tx.paymentMethod,
            cell: (tx) => <SeloDaForma method={tx.paymentMethod} />,
          },
          {
            key: "amount",
            header: "Valor",
            sortable: true,
            className: "text-right tabular-nums",
            headerClassName: "text-right",
            accessor: (tx) => tx.netAmount || tx.amount,
            cell: (tx) => (
              <span className="text-sm font-semibold text-tinta">
                {formatarReais(tx.netAmount || tx.amount)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            className: "text-center",
            headerClassName: "text-center",
            accessor: (tx) => tx.status,
            cell: (tx) => <SeloDeSituacao status={tx.status} />,
          },
          {
            key: "actions",
            header: "Ação",
            sortable: false,
            searchable: false,
            className: "text-center pr-4",
            headerClassName: "text-center pr-4",
            cell: (tx) => actionFor(tx),
          },
        ]}
      />

      {/* Toast */}
      {toast && (
        <AvisoTemporario
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
