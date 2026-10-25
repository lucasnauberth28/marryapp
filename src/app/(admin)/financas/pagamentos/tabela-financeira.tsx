"use client";
// Pagamentos de presentes recebidos: tabela com busca e ordenação (cartões no celular) e as ações de cada linha.
import type { TransacaoComPresente } from "@/actions/financas/transacoes";
import { TabelaDeDados } from "@/components/ui/data-table";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { AcaoDoPagamento } from "./acao-do-pagamento";
import { AvisoTemporario } from "./aviso-temporario";
import { SeloDaForma, SeloDeSituacao } from "./selos";
import { useAcoesDosPagamentos, type AcoesDosPagamentos } from "./use-acoes-dos-pagamentos";

const formatarDataDaTransacao = (data: Date) =>
  new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const valorRecebido = (tx: TransacaoComPresente) => tx.netAmount || tx.amount;

function CartaoNoCelular({ tx, acoes }: { tx: TransacaoComPresente; acoes: AcoesDosPagamentos }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-tinta">{tx.guest?.name || tx.guestName || "Convidado sem nome"}</p>
          <p className="text-sm text-tinta-suave">{formatarDataDaTransacao(tx.createdAt)}</p>
        </div>
        <span className="shrink-0 font-semibold tabular-nums text-tinta">{formatarReais(valorRecebido(tx))}</span>
      </div>
      <p className="text-[15px] text-tinta">{tx.gift.title}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <SeloDeSituacao status={tx.status} />
          <SeloDaForma method={tx.paymentMethod} />
        </div>
        <AcaoDoPagamento tx={tx} acoes={acoes} />
      </div>
    </div>
  );
}

function colunas(acoes: AcoesDosPagamentos) {
  return [
    { key: "createdAt", header: "Data", sortable: true, accessor: (tx: TransacaoComPresente) => new Date(tx.createdAt).getTime(), cell: (tx: TransacaoComPresente) => <span className="text-sm text-tinta-suave tabular-nums">{formatarDataDaTransacao(tx.createdAt)}</span> },
    { key: "guestName", header: "Convidado", sortable: true, accessor: (tx: TransacaoComPresente) => tx.guest?.name || "", cell: (tx: TransacaoComPresente) => <span className="text-sm font-medium text-tinta">{tx.guest?.name || tx.guestName || "—"}</span> },
    { key: "giftTitle", header: "Presente", sortable: true, accessor: (tx: TransacaoComPresente) => tx.gift?.title || "", cell: (tx: TransacaoComPresente) => <span className="text-sm text-tinta-suave max-w-[200px] truncate block">{tx.gift.title}</span> },
    { key: "paymentMethod", header: "Como pagou", sortable: true, accessor: (tx: TransacaoComPresente) => tx.paymentMethod, cell: (tx: TransacaoComPresente) => <SeloDaForma method={tx.paymentMethod} /> },
    { key: "amount", header: "Valor", sortable: true, className: "text-right tabular-nums", headerClassName: "text-right", accessor: valorRecebido, cell: (tx: TransacaoComPresente) => <span className="text-sm font-semibold text-tinta">{formatarReais(valorRecebido(tx))}</span> },
    { key: "status", header: "Status", sortable: true, className: "text-center", headerClassName: "text-center", accessor: (tx: TransacaoComPresente) => tx.status, cell: (tx: TransacaoComPresente) => <SeloDeSituacao status={tx.status} /> },
    { key: "actions", header: "Ação", sortable: false, searchable: false, className: "text-center pr-4", headerClassName: "text-center pr-4", cell: (tx: TransacaoComPresente) => <AcaoDoPagamento tx={tx} acoes={acoes} /> },
  ];
}

export function TabelaFinanceira({ transactions }: { transactions: TransacaoComPresente[] }) {
  const acoes = useAcoesDosPagamentos();
  return (
    <div className="space-y-4">
      <TabelaDeDados
        data={transactions}
        mobileCard={(tx) => <CartaoNoCelular tx={tx} acoes={acoes} />}
        pageSize={15}
        keyExtractor={(tx) => tx.id}
        searchPlaceholder="Buscar por convidado ou presente..."
        emptyMessage="Ainda não há pagamentos de presentes. Quando alguém presentear vocês, aparece aqui."
        columns={colunas(acoes)}
      />
      {acoes.aviso && <AvisoTemporario aviso={acoes.aviso} aoFechar={acoes.fecharAviso} />}
    </div>
  );
}
