import { Landmark } from "lucide-react";
import { Cartao, CabecalhoDoCartao, ConteudoDoCartao, TituloDoCartao } from "@/components/ui/card";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { formatarDataBrasiliaLonga } from "@/lib/formatacao/data";
import type { PosicaoDeRepasse } from "@/lib/repasse/payout-balance";
import type { RepasseRegistrado } from "@/lib/repasse/payout-ledger-server";

/** O que já foi repassado ao casal e o que ainda vai ser: o mesmo número que a equipe enxerga na administração. */
export function RepassesRecebidos({ posicao, payouts }: { posicao: PosicaoDeRepasse; payouts: RepasseRegistrado[] }) {
  if (posicao.netCents === 0 && payouts.length === 0) return null;
  return (
    <Cartao className="gap-3">
      <CabecalhoDoCartao>
        <TituloDoCartao className="flex items-center gap-2">
          <Landmark className="size-5 text-ameixa" aria-hidden="true" />
          Repasses dos presentes
        </TituloDoCartao>
      </CabecalhoDoCartao>
      <ConteudoDoCartao className="flex flex-col gap-4 text-base leading-6 text-tinta">
        <dl className="grid grid-cols-3 gap-3">
          <Valor rotulo="Líquido dos presentes" valor={posicao.netCents} />
          <Valor rotulo="Já repassado" valor={posicao.paidOutCents} />
          <Valor rotulo="A repassar" valor={posicao.dueCents} destaque />
        </dl>
        {payouts.length > 0 ? (
          <ul className="flex flex-col divide-y divide-linha border-t border-linha">
            {payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[15px]">
                <span className="font-semibold tabular-nums">{formatarReais(p.amountCents)}</span>
                <span className="text-tinta-suave">{formatarDataBrasiliaLonga(p.paidAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-5 text-tinta-suave">Nenhum repasse feito ainda. Quando a equipe repassar, o valor aparece aqui e vocês recebem um aviso.</p>
        )}
      </ConteudoDoCartao>
    </Cartao>
  );
}

function Valor({ rotulo, valor, destaque = false }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm leading-5 text-tinta-suave">{rotulo}</dt>
      <dd className={destaque ? "text-lg font-semibold tabular-nums text-ameixa" : "text-lg font-semibold tabular-nums"}>{formatarReais(valor)}</dd>
    </div>
  );
}
