import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { EmptyState } from "@/components/plataforma/empty-state";
import { Panel } from "@/components/plataforma/panel";
import { ResponsiveTable } from "@/components/plataforma/responsive-table";
import { StatusChip, type StatusTone } from "@/components/plataforma/status-chip";
import { formatDate, relativeDay } from "@/lib/platform/format";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { REFUND_VIEW_LABEL, refundView, type RefundView } from "@/lib/platform/payments";
import type { RefundRow } from "@/lib/platform/queries/receita";
import { RefundDecision, RegisterRefundForm } from "./refund-forms";

const TONE: Record<RefundView, StatusTone> = { decide: "aviso", waiting_refund: "aviso", refunded: "neutro", denied: "neutro" };

/** Reembolsos: pedidos, decisão e o aviso de que o estorno de verdade é feito no Mercado Pago. */
export function RefundsSection({ refunds, payments, now, preview = false, policyText }: { refunds: RefundRow[]; payments?: { id: string; label: string; amount: number }[]; now: Date; preview?: boolean; policyText?: string }) {
  const rows = preview ? refunds.slice(0, 5) : refunds;
  return (
    <>
      <Panel
        title="Reembolsos"
        description="Reembolso pedido, para decidir e decidido. O estorno em si é feito no painel do Mercado Pago: quando o aviso chega, o Aceito conclui sozinho."
        action={preview ? { label: "Ver todos", href: "/admin/planos?aba=reembolsos" } : undefined}
        padded={false}
      >
        <div className="px-3 pb-3 md:px-4 md:pb-4">
          <ResponsiveTable
            caption="Pedidos de reembolso"
            rows={rows}
            rowKey={(r) => r.id}
            empty={
              <EmptyState icon={RotateCcw} title="Nenhum pedido de reembolso" compact>
                Quando alguém pedir o dinheiro de volta, registre o pedido aqui para decidir e deixar no registro.
              </EmptyState>
            }
            columns={[
              {
                key: "quem",
                header: "Quem",
                primary: true,
                cell: (r) => (
                  <>
                    <span className="block">{r.payer}</span>
                    <span className="block text-sm font-normal text-tinta-suave">{r.planType === "VENDOR" ? "Fornecedor" : "Casal"} · {r.planName.replace(/^(Plano|Fornecedor)\s+/, "")}</span>
                  </>
                ),
              },
              { key: "valor", header: "Valor", align: "right", cell: (r) => formatarReais(r.amount) },
              {
                key: "prazo",
                header: "Prazo",
                cell: (r) => {
                  const view = refundView(r);
                  if (view === "decide" && r.dueAt) return `responder até ${formatDate(r.dueAt)} (${relativeDay(r.dueAt, now)})`;
                  return r.decidedAt ? `decidido em ${formatDate(r.decidedAt)}` : <span className="text-tinta-suave">Sem prazo</span>;
                },
              },
              {
                key: "situacao",
                header: "Situação",
                cell: (r) => {
                  const view = refundView(r);
                  return <StatusChip tone={TONE[view]}>{REFUND_VIEW_LABEL[view]}</StatusChip>;
                },
              },
              {
                key: "acao",
                header: <span className="sr-only">Ação</span>,
                mobileLabel: false,
                cell: (r) => {
                  const view = refundView(r);
                  return (
                    <div className="flex flex-col gap-2">
                      <p className="max-w-[340px] text-sm text-tinta-suave">Motivo: {r.reason}</p>
                      {r.decisionNote ? <p className="max-w-[340px] text-sm text-tinta-suave">Decisão: {r.decisionNote}</p> : null}
                      {view === "decide" ? <RefundDecision refundId={r.id} payer={r.payer} /> : null}
                      <Link href={`/admin/planos/assinaturas?id=${r.subscriptionId}#painel`} className="text-sm font-semibold text-ameixa underline underline-offset-2">
                        Ver o pagamento
                      </Link>
                    </div>
                  );
                },
              },
            ]}
          />
        </div>
      </Panel>
      {!preview && payments ? (
        <Panel title="Registrar um pedido" description="Para pedidos que chegaram por WhatsApp ou e-mail.">
          <RegisterRefundForm payments={payments} />
        </Panel>
      ) : null}
      {!preview && policyText ? (
        <p className="text-sm text-tinta-suave">
          Política atual: {policyText} <Link href="/admin/configuracoes" className="font-semibold text-ameixa underline underline-offset-2">Editar em Configurações</Link>
        </p>
      ) : null}
    </>
  );
}
