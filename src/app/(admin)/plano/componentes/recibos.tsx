import Link from "next/link";
import { FileText, Receipt } from "lucide-react";
import { PaymentStatus } from "@prisma/client";
import { formatarDataBrasiliaCurtaComAno } from "@/lib/formatacao/data";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { DadosDoPlano } from "./dados-do-plano";

type Recibo = DadosDoPlano["subscriptions"][number];

function LinhaDoRecibo({ s, nomeDoPlano }: { s: Recibo; nomeDoPlano: string }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4">
      <Receipt className="h-4 w-4 shrink-0 text-tinta-suave" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-tinta">{nomeDoPlano}</p>
        <p className="text-sm text-tinta-suave">
          {s.paidAt ? `Pago em ${formatarDataBrasiliaCurtaComAno(s.paidAt)}` : `Gerado em ${formatarDataBrasiliaCurtaComAno(s.createdAt)}`} · Pix
        </p>
      </div>
      <div className="flex items-center gap-3">
        {s.status === PaymentStatus.REFUNDED ? <span className="inline-flex items-center rounded-full bg-areia px-2.5 py-1 text-[13px] font-semibold leading-4 text-tinta">Estornado</span> : null}
        <span className="font-semibold tabular-nums text-tinta">{formatarReais(s.amount)}</span>
        {s.status === PaymentStatus.APPROVED ? (
          <Link href={`/recibo/${s.id}`} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ameixa hover:bg-ameixa-suave">
            Ver recibo
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export function Recibos({ subscriptions, nomeDoPlano }: { subscriptions: Recibo[]; nomeDoPlano: (s: Recibo) => string }) {
  return (
    <section aria-labelledby="recibos-titulo" className="flex flex-col gap-3">
      <h2 id="recibos-titulo" className="text-xl font-semibold text-tinta">
        Recibos
      </h2>
      {subscriptions.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-linha bg-linho p-5 text-[15px] text-tinta-suave">
          <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
          Nenhum pagamento ainda. Os recibos aparecem aqui depois de cada Pix.
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-linha rounded-2xl border border-linha bg-papel">
          {subscriptions.map((s) => (
            <LinhaDoRecibo key={s.id} s={s} nomeDoPlano={nomeDoPlano(s)} />
          ))}
        </ul>
      )}
    </section>
  );
}
