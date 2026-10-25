import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { Painel } from "@/components/plataforma/panel";
import { TabelaResponsiva } from "@/components/plataforma/responsive-table";
import { EtiquetaDeSituacao, type TomDaSituacao } from "@/components/plataforma/status-chip";
import { formatarData, diaRelativo } from "@/lib/platform/format";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { ROTULO_DA_VISAO_DO_REEMBOLSO, visaoDoReembolso, type VisaoDoReembolso } from "@/lib/platform/payments";
import type { LinhaDeReembolso } from "@/lib/platform/queries/receita";
import { DecisaoDeReembolso, FormularioDeRegistrarReembolso } from "./refund-forms";

const TONS_DA_ETIQUETA: Record<VisaoDoReembolso, TomDaSituacao> = { decide: "aviso", waiting_refund: "aviso", refunded: "neutro", denied: "neutro" };

/** Reembolsos: pedidos, decisão e o aviso de que o estorno de verdade é feito no Mercado Pago. */
export function SecaoDeReembolsos({ refunds, payments, now, preview = false, policyText }: { refunds: LinhaDeReembolso[]; payments?: { id: string; label: string; amount: number }[]; now: Date; preview?: boolean; policyText?: string }) {
  const rows = preview ? refunds.slice(0, 5) : refunds;
  return (
    <>
      <Painel
        title="Reembolsos"
        description="Reembolso pedido, para decidir e decidido. O estorno em si é feito no painel do Mercado Pago: quando o aviso chega, o Aceito conclui sozinho."
        action={preview ? { label: "Ver todos", href: "/admin/planos?aba=reembolsos" } : undefined}
        padded={false}
      >
        <div className="px-3 pb-3 md:px-4 md:pb-4">
          <TabelaResponsiva
            caption="Pedidos de reembolso"
            rows={rows}
            rowKey={(r) => r.id}
            empty={
              <EstadoVazio icon={RotateCcw} title="Nenhum pedido de reembolso" compact>
                Quando alguém pedir o dinheiro de volta, registre o pedido aqui para decidir e deixar no registro.
              </EstadoVazio>
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
                  const view = visaoDoReembolso(r);
                  if (view === "decide" && r.dueAt) return `responder até ${formatarData(r.dueAt)} (${diaRelativo(r.dueAt, now)})`;
                  return r.decidedAt ? `decidido em ${formatarData(r.decidedAt)}` : <span className="text-tinta-suave">Sem prazo</span>;
                },
              },
              {
                key: "situacao",
                header: "Situação",
                cell: (r) => {
                  const view = visaoDoReembolso(r);
                  return <EtiquetaDeSituacao tone={TONS_DA_ETIQUETA[view]}>{ROTULO_DA_VISAO_DO_REEMBOLSO[view]}</EtiquetaDeSituacao>;
                },
              },
              {
                key: "acao",
                header: <span className="sr-only">Ação</span>,
                mobileLabel: false,
                cell: (r) => {
                  const view = visaoDoReembolso(r);
                  return (
                    <div className="flex flex-col gap-2">
                      <p className="max-w-[340px] text-sm text-tinta-suave">Motivo: {r.reason}</p>
                      {r.decisionNote ? <p className="max-w-[340px] text-sm text-tinta-suave">Decisão: {r.decisionNote}</p> : null}
                      {view === "decide" ? <DecisaoDeReembolso refundId={r.id} payer={r.payer} /> : null}
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
      </Painel>
      {!preview && payments ? (
        <Painel title="Registrar um pedido" description="Para pedidos que chegaram por WhatsApp ou e-mail.">
          <FormularioDeRegistrarReembolso payments={payments} />
        </Painel>
      ) : null}
      {!preview && policyText ? (
        <p className="text-sm text-tinta-suave">
          Política atual: {policyText} <Link href="/admin/configuracoes" className="font-semibold text-ameixa underline underline-offset-2">Editar em Configurações</Link>
        </p>
      ) : null}
    </>
  );
}
