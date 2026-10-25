import Link from "next/link";
import { Gift } from "lucide-react";
import { formatarReaisDeSaida, formatarReaisSemSinal } from "@/lib/dashboard-summary";
import { calcularValoresDoPresente, type PlanoDaTaxaDoPresente } from "@/lib/gift-fee";
import { Etiqueta, estiloDoBotaoPrimario } from "../../ui";
import { Extrato, LinhaDoExtrato, notaDaTaxa } from "./extrato";

/** Exemplo de como um presente de R$ 300,00 aparece, com a taxa do plano de vocês (marcado, nunca como se fosse real). */
function ExemploDeExtrato({ plan }: { plan: PlanoDaTaxaDoPresente }) {
  const ex = calcularValoresDoPresente(30_000, plan, "PIX");
  return (
    <div className="relative rounded-[8px] border border-dashed border-linha-forte bg-areia/40 p-4 pt-5" role="group" aria-label="Exemplo de um presente de R$ 300,00">
      <span className="absolute -top-3 left-3">
        <Etiqueta tone="neutro">Exemplo</Etiqueta>
      </span>
      <Extrato
        label="Exemplo de um presente de R$ 300,00"
        rows={
          <>
            <LinhaDoExtrato term="Presente de exemplo" value={formatarReaisSemSinal(ex.grossCents)} />
            <LinhaDoExtrato term="Taxa do Aceito" note={notaDaTaxa(plan)} value={ex.feeCents > 0 ? formatarReaisDeSaida(ex.feeCents) : formatarReaisSemSinal(0)} tone="saida" />
            <LinhaDoExtrato term="Vocês recebem" value={formatarReaisSemSinal(ex.netCents)} total />
          </>
        }
      />
    </div>
  );
}

interface PropriedadesDoSemPresentes {
  plan: PlanoDaTaxaDoPresente;
  giftCount: number;
  canOpenGifts: boolean;
}

export function SemPresentesRecebidos({ plan, giftCount, canOpenGifts }: PropriedadesDoSemPresentes) {
  return (
    <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <div className="grid max-w-[60ch] gap-1.5">
        <b className="text-[15px] text-tinta">Nenhum presente recebido ainda</b>
        <p className="text-pretty text-tinta-suave">
          {giftCount === 0
            ? "Criem os presentes em dinheiro que vão aparecer no site. O convidado paga por Pix ou cartão e o valor aparece aqui, com a taxa e o líquido de cada presente."
            : "Os presentes de vocês já estão no site. Quando um convidado pagar por Pix ou cartão, o valor aparece aqui, com a taxa e o líquido de cada presente."}
        </p>
        {canOpenGifts && giftCount === 0 && (
          <div className="mt-2">
            <Link href="/presentes-admin" className={estiloDoBotaoPrimario}>
              <Gift className="size-[17px]" aria-hidden="true" />
              Criar o primeiro presente
            </Link>
          </div>
        )}
      </div>
      <ExemploDeExtrato plan={plan} />
    </div>
  );
}
