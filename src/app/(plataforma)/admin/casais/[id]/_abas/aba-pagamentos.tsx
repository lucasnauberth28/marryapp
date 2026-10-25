import Link from "next/link";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { Aviso } from "@/components/plataforma/notices";
import { EtiquetaDeSituacao, type TomDaSituacao } from "@/components/plataforma/status-chip";
import { formatarData, formatarDataEHora } from "@/lib/platform/format";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { obterPagamentosDoCasal } from "@/lib/platform/queries/casais/abas";
import type { CabecalhoDoCasal } from "@/lib/platform/queries/casais/cabecalho";
import { obterVisaoDaContaDeRepasse } from "@/lib/payout-account-view";
import { cn } from "@/lib/utils";
import { FormularioDeConcederPlano } from "../_components/grant-plan-form";
import { FormularioDeReembolso } from "../_components/refund-form";
import { LinhasDoDetalhe } from "./linhas-do-detalhe";

type Pagamento = Awaited<ReturnType<typeof obterPagamentosDoCasal>>[number];

const STATUS: Record<string, { tone: TomDaSituacao; label: string }> = {
  APPROVED: { tone: "sucesso", label: "Pago" },
  PENDING: { tone: "aviso", label: "Aguardando" },
  REJECTED: { tone: "perigo", label: "Recusado" },
  FAILED: { tone: "perigo", label: "Falhou" },
  REFUNDED: { tone: "neutro", label: "Estornado" },
};
const SITUACAO_DO_REEMBOLSO: Record<string, string> = { REQUESTED: "Para decidir", REFUNDED: "Reembolsado", DENIED: "Negado" };
const semPrefixo = (planName: string) => planName.replace(/^Plano /, "");

function SituacaoDoPagamento({ status }: { status: string }) {
  return <EtiquetaDeSituacao tone={STATUS[status]?.tone ?? "neutro"}>{STATUS[status]?.label ?? status}</EtiquetaDeSituacao>;
}

const temRecibo = (p: Pagamento) => p.status === "APPROVED" && p.amount > 0;

function TabelaDePagamentos({ payments }: { payments: Pagamento[] }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse text-left text-[15px]">
        <caption className="sr-only">Pagamentos de plano do casal</caption>
        <thead>
          <tr className="border-b border-linha text-[13px] font-semibold text-tinta-suave">
            {["Quando", "Plano", "Valor", "Forma", "Situação", "Recibo"].map((h) => (
              <th key={h} scope="col" className={cn("px-2 py-2", h === "Valor" && "text-right")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b border-linha last:border-b-0">
              <td className="px-2 py-3">{formatarDataEHora(p.paidAt ?? p.createdAt)}</td>
              <td className="px-2 py-3">{semPrefixo(p.planName)}</td>
              <td className="px-2 py-3 text-right tabular-nums">{formatarReais(p.amount)}</td>
              <td className="px-2 py-3">{p.method}</td>
              <td className="px-2 py-3">
                <SituacaoDoPagamento status={p.status} />
              </td>
              <td className="px-2 py-3">
                {temRecibo(p) ? (
                  <Link href={`/recibo/${p.id}`} className="font-semibold text-ameixa underline underline-offset-2">
                    Recibo
                  </Link>
                ) : (
                  <span className="text-sm text-tinta-suave">Sem recibo</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListaDePagamentosDoCelular({ payments }: { payments: Pagamento[] }) {
  return (
    <ul className="flex flex-col gap-3 md:hidden">
      {payments.map((p) => (
        <li key={p.id} className="rounded-xl border border-linha p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">{semPrefixo(p.planName)} · {formatarReais(p.amount)}</p>
            <SituacaoDoPagamento status={p.status} />
          </div>
          <p className="mt-1 text-sm text-tinta-suave">{formatarDataEHora(p.paidAt ?? p.createdAt)} · {p.method}</p>
          {temRecibo(p) && (
            <Link href={`/recibo/${p.id}`} className="mt-1 inline-block text-sm font-semibold text-ameixa underline underline-offset-2">
              Recibo
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

// Dados de recebimento do casal: SOMENTE a máscara, sem botão que decifre. A página já passou por requirePlatformAdminPage.
async function PainelDeRepasse({ weddingId }: { weddingId: string }) {
  const account = await obterVisaoDaContaDeRepasse(weddingId);
  return (
    <Painel
      title="Dados de recebimento"
      aside={
        account ? (
          <EtiquetaDeSituacao tone={account.verifiedAt ? "sucesso" : "aviso"} icon={account.verifiedAt ? CheckCircle2 : Clock}>
            {account.verifiedAt ? "Confirmado pelo casal" : "Falta o casal confirmar"}
          </EtiquetaDeSituacao>
        ) : (
          <EtiquetaDeSituacao tone="neutro">Não cadastrados</EtiquetaDeSituacao>
        )
      }
    >
      {account ? (
        <LinhasDoDetalhe
          items={[
            { label: "Cadastrados", value: "Sim" },
            { label: "Tipo", value: account.type === "PIX_KEY" ? "Chave Pix" : "Conta bancária" },
            { label: "Destino", value: account.keyHint },
            { label: "Titular", value: `${account.holderName} (${account.holderDocumentHint})` },
            { label: "Verificado em", value: account.verifiedAt ? formatarDataEHora(account.verifiedAt) : "Ainda não" },
            { label: "Atualizado em", value: formatarDataEHora(account.updatedAt) },
          ]}
        />
      ) : (
        <p className="text-tinta-suave">O casal ainda não cadastrou onde receber os presentes.</p>
      )}
      <Aviso tone="neutro" icon={Lock} className="mt-4">
        Os dados ficam criptografados e esta tela mostra só a máscara. Nenhuma ação daqui decifra o dado, e o repasse ainda não é automático.
      </Aviso>
    </Painel>
  );
}

function PainelDeReembolso({ weddingId, payments }: { weddingId: string; payments: Pagamento[] }) {
  const refundable = payments
    .filter((p) => p.status === "APPROVED" && p.amount > 0 && !p.refundRequests.some((r) => r.status === "REQUESTED"))
    .map((p) => ({ id: p.id, amountCents: p.amount, label: `${semPrefixo(p.planName)}, ${formatarData(p.paidAt ?? p.createdAt)}, ${formatarReais(p.amount)}` }));
  const refunds = payments.flatMap((p) => p.refundRequests.map((r) => ({ ...r, planName: p.planName })));
  return (
    <Painel title="Reembolso">
      <FormularioDeReembolso weddingId={weddingId} options={refundable} />
      {refunds.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2 border-t border-linha pt-4">
          {refunds.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {formatarReais(r.amount)} do plano {semPrefixo(r.planName)}, pedido em {formatarData(r.createdAt)}
              </span>
              <EtiquetaDeSituacao tone={r.status === "REQUESTED" ? "aviso" : "neutro"}>{SITUACAO_DO_REEMBOLSO[r.status] ?? r.status}</EtiquetaDeSituacao>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}

export async function AbaPagamentos({ header, sideColumn }: { header: CabecalhoDoCasal; sideColumn: React.ReactNode }) {
  const { wedding, plan } = header;
  const payments = await obterPagamentosDoCasal(wedding.id);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        <Painel title="Pagamentos" aside={<span className="text-sm text-tinta-suave">Plano de casal é pago uma vez</span>}>
          {payments.length === 0 ? (
            <p className="text-tinta-suave">Este casal ainda não gerou nenhum pagamento de plano.</p>
          ) : (
            <>
              <TabelaDePagamentos payments={payments} />
              <ListaDePagamentosDoCelular payments={payments} />
            </>
          )}
        </Painel>
        <PainelDeRepasse weddingId={wedding.id} />
        <Painel>
          <FormularioDeConcederPlano weddingId={wedding.id} currentPlanId={plan?.planId ?? null} />
        </Painel>
        <PainelDeReembolso weddingId={wedding.id} payments={payments} />
      </div>
      {sideColumn}
    </div>
  );
}
