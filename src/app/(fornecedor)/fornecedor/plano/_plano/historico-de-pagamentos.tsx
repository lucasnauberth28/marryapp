import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import { nomeCurtoDoPlano } from "@/app/login/auth-config";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { DIAS_DO_PERIODO_DO_FORNECEDOR } from "@/lib/subscription-period";
import type { PagamentoDoFornecedor } from "./dados";
import { UM_DIA_EM_MS, formatarData } from "./datas";

const LINK_DO_RECIBO = "inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold whitespace-nowrap text-ameixa hover:bg-ameixa-suave";

/** Celular: lista de linhas de 56px, como no design. */
function ListaDoCelular({ payments, now }: { payments: PagamentoDoFornecedor[]; now: Date }) {
  return (
    <ul className="flex flex-col rounded-2xl border border-linha bg-papel md:hidden">
      {payments.map((p) => {
        const refunded = p.status === PaymentStatus.REFUNDED;
        return (
          <li key={p.id} className="flex min-h-14 items-center gap-3 border-t border-linha px-4 py-2 first:border-t-0">
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="font-semibold">{nomeCurtoDoPlano(p.planName)}</strong>
              <span className="text-sm text-tinta-suave">
                {p.paidAt ? `Pago em ${formatarData(p.paidAt, now)}` : "Pagamento sem data"}
                {refunded ? " · Estornado" : ""}
              </span>
            </span>
            <span className="tabular-nums">{formatarReais(p.amount)}</span>
            {refunded ? null : <Link href={`/recibo/${p.id}`} className={LINK_DO_RECIBO}>Recibo</Link>}
          </li>
        );
      })}
    </ul>
  );
}

function periodoDoPagamento(p: PagamentoDoFornecedor, now: Date) {
  if (!p.periodEnd || p.status === PaymentStatus.REFUNDED) return "—";
  return `${formatarData(new Date(p.periodEnd.getTime() - DIAS_DO_PERIODO_DO_FORNECEDOR * UM_DIA_EM_MS), now)} a ${formatarData(p.periodEnd, now)}`;
}

function TabelaDoComputador({ payments, now }: { payments: PagamentoDoFornecedor[]; now: Date }) {
  return (
    <div role="region" aria-labelledby="pagamentos-titulo" tabIndex={0} className="relative hidden overflow-x-auto rounded-2xl border border-linha bg-papel md:block">
      <table className="w-full min-w-[640px] border-collapse text-[15px]">
        <thead>
          <tr className="text-left text-[13px] text-tinta-suave">
            <th scope="col" className="px-5 py-3 font-semibold">Plano</th>
            <th scope="col" className="px-5 py-3 font-semibold">Pago em</th>
            <th scope="col" className="px-5 py-3 font-semibold">Período</th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">Valor</th>
            <th scope="col" className="px-5 py-3"><span className="sr-only">Recibo</span></th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const refunded = p.status === PaymentStatus.REFUNDED;
            return (
              <tr key={p.id} className="border-t border-linha">
                <td className="px-5 py-3.5 font-semibold">{nomeCurtoDoPlano(p.planName)}</td>
                <td className="px-5 py-3.5">{p.paidAt ? formatarData(p.paidAt, now) : "—"}</td>
                <td className="px-5 py-3.5 text-tinta-suave">{periodoDoPagamento(p, now)}</td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap tabular-nums">
                  {refunded ? <span className="mr-2 text-sm font-semibold text-aviso">Estornado</span> : null}
                  {formatarReais(p.amount)}
                </td>
                <td className="px-3 py-1.5 text-right">{refunded ? null : <Link href={`/recibo/${p.id}`} className={LINK_DO_RECIBO}>Recibo</Link>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function HistoricoDePagamentos({ payments, now }: { payments: PagamentoDoFornecedor[]; now: Date }) {
  return (
    <section aria-labelledby="pagamentos-titulo" className="flex flex-col gap-3">
      {payments.length > 0 ? (
        <>
          <h2 id="pagamentos-titulo" className="text-lg font-semibold">
            Pagamentos
          </h2>
          <ListaDoCelular payments={payments} now={now} />
          <TabelaDoComputador payments={payments} now={now} />
        </>
      ) : (
        <h2 id="pagamentos-titulo" className="sr-only">
          Como funciona o pagamento
        </h2>
      )}
      <p className="text-sm text-tinta-suave">Pagamento por Pix, sem renovação automática. Quando o período acaba, seu perfil volta ao Start até você renovar.</p>
    </section>
  );
}
