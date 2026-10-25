import { ReceiptText } from "lucide-react";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { Painel } from "@/components/plataforma/panel";
import { TabelaResponsiva } from "@/components/plataforma/responsive-table";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarDiaEMes } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { opcoesDeMesDoContador, tituloDoMes } from "@/lib/platform/payments";
import type { NotaPendente } from "@/lib/platform/queries/receita";
import { ExportacaoDoContador } from "./contador-export";
import { BotaoDeNota } from "./invoice-button";

/** Exportar para o contador (planilha do mês) e notas fiscais pendentes. */
export function SecaoDoContador({ month, now, invoices, pendingCount }: { month: string; now: Date; invoices: NotaPendente[]; pendingCount: number }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Painel title="Exportar para o contador">
        <ExportacaoDoContador month={month} options={opcoesDeMesDoContador(now).map((key) => ({ value: key, label: tituloDoMes(key) }))} />
      </Painel>

      <Painel
        title="Notas fiscais pendentes"
        aside={
          pendingCount > 0 ? (
            <EtiquetaDeSituacao tone="aviso" icon={ReceiptText}>
              {pluralizar(pendingCount, "pendente", "pendentes")}
            </EtiquetaDeSituacao>
          ) : undefined
        }
        padded={false}
      >
        <div className="px-3 pb-3 md:px-4 md:pb-4">
          <TabelaResponsiva
            caption="Pagamentos sem nota fiscal emitida"
            rows={invoices}
            rowKey={(i) => i.id}
            empty={
              <EstadoVazio icon={ReceiptText} title="Nenhuma nota pendente" compact>
                Todos os pagamentos aprovados já têm a nota marcada como emitida.
              </EstadoVazio>
            }
            columns={[
              { key: "quem", header: "Quem pagou", primary: true, cell: (i) => <>{i.payer} <span className="font-normal text-tinta-suave">({i.planName.replace(/^(Plano|Fornecedor)\s+/, "")})</span></> },
              { key: "pago", header: "Pago em", cell: (i) => (i.paidAt ? formatarDiaEMes(i.paidAt) : "Sem data") },
              { key: "valor", header: "Valor", align: "right", cell: (i) => formatarReais(i.amount) },
              { key: "acao", header: <span className="sr-only">Ação</span>, mobileLabel: false, cell: (i) => <BotaoDeNota subscriptionId={i.id} payer={i.payer} /> },
            ]}
          />
          {pendingCount > invoices.length ? <p className="mt-3 text-sm text-tinta-suave">Mostrando {invoices.length} de {pendingCount}. Marque as primeiras para ver as próximas.</p> : null}
        </div>
      </Painel>
    </div>
  );
}
