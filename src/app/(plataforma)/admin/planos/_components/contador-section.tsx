import { Download, ReceiptText } from "lucide-react";
import { btn } from "@/components/landing/styles";
import { EmptyState } from "@/components/plataforma/empty-state";
import { Panel } from "@/components/plataforma/panel";
import { ResponsiveTable } from "@/components/plataforma/responsive-table";
import { StatusChip } from "@/components/plataforma/status-chip";
import { NativeSelect } from "@/components/ui/select";
import { formatBRL, formatDayMonth, plural } from "@/lib/platform/format";
import { accountantMonthOptions, monthTitle } from "@/lib/platform/payments";
import type { PendingInvoice } from "@/lib/platform/queries/receita";
import { cn } from "@/lib/utils";
import { InvoiceButton } from "./invoice-button";

/** Exportar para o contador (planilha do mês) e notas fiscais pendentes. */
export function ContadorSection({ month, now, invoices, pendingCount }: { month: string; now: Date; invoices: PendingInvoice[]; pendingCount: number }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Panel title="Exportar para o contador">
        {/* Formulário GET: o navegador baixa a planilha direto da rota protegida */}
        <form method="get" action="/api/admin/contador" className="flex flex-col gap-4">
          <NativeSelect label="Período" alwaysFloat name="mes" defaultValue={month}>
            {accountantMonthOptions(now).map((key) => (
              <option key={key} value={key}>
                {monthTitle(key)}
              </option>
            ))}
          </NativeSelect>
          <p className="text-sm text-tinta-suave">Inclui data, quem pagou, plano, valor, forma de pagamento, situação (pago ou estornado) e o número da nota. Sem CPF, CNPJ nem a taxa do Mercado Pago.</p>
          <button type="submit" className={cn(btn.primary, "self-start")}>
            <Download className="size-4" aria-hidden="true" /> Baixar a planilha
          </button>
        </form>
      </Panel>

      <Panel
        title="Notas fiscais pendentes"
        aside={
          pendingCount > 0 ? (
            <StatusChip tone="aviso" icon={ReceiptText}>
              {plural(pendingCount, "pendente", "pendentes")}
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
              { key: "valor", header: "Valor", align: "right", cell: (i) => formatBRL(i.amount) },
              { key: "acao", header: <span className="sr-only">Ação</span>, mobileLabel: false, cell: (i) => <InvoiceButton subscriptionId={i.id} payer={i.payer} /> },
            ]}
          />
          {pendingCount > invoices.length ? <p className="mt-3 text-sm text-tinta-suave">Mostrando {invoices.length} de {pendingCount}. Marque as primeiras para ver as próximas.</p> : null}
        </div>
      </Panel>
    </div>
  );
}
