import { Clock } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { formatarDataBrasiliaCurtaComAno } from "@/lib/formatacao/data";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { pluralizar } from "@/lib/formatacao/plural";

interface PropriedadesDoPlanoAtual {
  nome: string;
  pago: { amount: number; paidAt: Date | null } | null;
}

function PlanoAtual({ nome, pago }: PropriedadesDoPlanoAtual) {
  return (
    <section aria-labelledby="plano-atual-titulo" className="flex flex-col gap-2 rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6">
      <h2 id="plano-atual-titulo" className="text-sm text-tinta-suave">
        Plano atual
      </h2>
      <p className="font-display text-4xl leading-10 text-tinta">{nome}</p>
      <p className="text-[15px] text-tinta">
        {pago ? `Pagamento único de ${formatarReais(pago.amount)}${pago.paidAt ? ` · pago em ${formatarDataBrasiliaCurtaComAno(pago.paidAt)}` : ""}` : "Gratuito · taxa de 3,99% por presente recebido"}
      </p>
    </section>
  );
}

function TaxasNosPresentes({ giftCount, feeTotal }: { giftCount: number; feeTotal: number }) {
  return (
    <section aria-labelledby="taxas-titulo" className="flex flex-col gap-2 rounded-2xl bg-ameixa p-5 text-on-ameixa shadow-[var(--shadow-aceito-2)] sm:p-6">
      <h2 id="taxas-titulo" className="text-xs font-semibold uppercase tracking-[0.08em]">
        Taxas nos presentes até agora
      </h2>
      {giftCount === 0 ? (
        <p className="text-[15px]">Nenhum presente recebido ainda. Quando chegar o primeiro, as taxas aparecem aqui.</p>
      ) : (
        <>
          <p className="font-num text-[40px] leading-[44px] tabular-nums">{formatarReais(feeTotal)}</p>
          <p className="text-[15px]">
            {pluralizar(giftCount, "presente recebido", "presentes recebidos")}
            {feeTotal === 0 ? ", sem taxa até agora." : "."}
          </p>
        </>
      )}
    </section>
  );
}

export function CartoesDoPlano({ nome, pago, giftCount, feeTotal }: PropriedadesDoPlanoAtual & { giftCount: number; feeTotal: number }) {
  return (
    <Aparicao className="grid gap-4 md:grid-cols-2">
      <PlanoAtual nome={nome} pago={pago} />
      <TaxasNosPresentes giftCount={giftCount} feeTotal={feeTotal} />
    </Aparicao>
  );
}

/** Pix do plano que a equipe ainda vai conferir no extrato. */
export function AvisoDePixEmConferencia({ amount, nomeDoPlano, createdAt }: { amount: number; nomeDoPlano: string; createdAt: Date }) {
  return (
    <Aparicao className="flex items-start gap-3 rounded-2xl border border-aviso/30 bg-aviso-suave p-4 text-[15px] text-tinta">
      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-aviso" aria-hidden="true" />
      <p>
        Há um Pix de {formatarReais(amount)} do plano {nomeDoPlano} gerado em {formatarDataBrasiliaCurtaComAno(createdAt)}. Se vocês já pagaram, nossa equipe confere no extrato e libera o plano em até 1 dia útil.
      </p>
    </Aparicao>
  );
}
