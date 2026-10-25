import { ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/plataforma/empty-state";
import { Panel } from "@/components/plataforma/panel";
import { ResponsiveTable } from "@/components/plataforma/responsive-table";
import { StatusChip } from "@/components/plataforma/status-chip";
import { formatDayMonth } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { accountantMonthOptions, monthTitle } from "@/lib/platform/payments";
import type { PendingInvoice } from "@/lib/platform/queries/receita";
import { ContadorExport } from "./contador-export";
import { InvoiceButton } from "./invoice-button";

/** Exportar para o contador (planilha do mês) e notas fiscais pendentes. */
export function ContadorSection({ month, now, invoices, pendingCount }: { month: string; now: Date; invoices: PendingInvoice[]; pendingCount: number }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Panel title="Exportar para o contador">
        <ContadorExport month={month} options={accountantMonthOptions(now).map((key) => ({ value: key, label: monthTitle(key) }))} />
      </Panel>

      <Panel
        title="Notas fiscais pendentes"
        aside={
          pendingCount > 0 ? (
            <StatusChip tone="aviso" icon={ReceiptText}>
              {pluralizar(pendingCount, "pendente", "pendentes")}
            </StatusChip>
          ) : undefined
        }
        padded={false}
      >
        <div className="px-3 pb-3 md:px-4 md:pb-4">
          <ResponsiveTable
            caption="Pagamentos sem nota fiscal emitida"
            rows={invoices}
            rowKey={(i) => i.id}
            empty={
              <EmptyState icon={ReceiptText} title="Nenhuma nota pendente" compact>
                Todos os pagamentos aprovados já têm a nota marcada como emitida.
              </EmptyState>
            }
            columns={[
              { key: "quem", header: "Quem pagou", primary: true, cell: (i) => <>{i.payer} <span className="font-normal text-tinta-suave">({i.planName.replace(/^(Plano|Fornecedor)\s+/, "")})</span></> },
              { key: "pago", header: "Pago em", cell: (i) => (i.paidAt ? formatDayMonth(i.paidAt) : "Sem data") },
              { key: "valor", header: "Valor", align: "right", cell: (i) => formatarReais(i.amount) },
              { key: "acao", header: <span className="sr-only">Ação</span>, mobileLabel: false, cell: (i) => <InvoiceButton subscriptionId={i.id} payer={i.payer} /> },
            ]}
          />
          {pendingCount > invoices.length ? <p className="mt-3 text-sm text-tinta-suave">Mostrando {invoices.length} de {pendingCount}. Marque as primeiras para ver as próximas.</p> : null}
        </div>
      </Panel>
    </div>
  );
}
