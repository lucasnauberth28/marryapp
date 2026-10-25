import Link from "next/link";
import { Wallet } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { GraficoDeReceita } from "@/components/plataforma/revenue-chart";
import { estiloDoBotao } from "@/components/landing/styles";
import { formatarNomeDoMes } from "@/lib/platform/format";
import { formatarReaisInteiros } from "@/lib/formatacao/dinheiro";
import { obterReceitaPorMes } from "@/lib/platform/queries/receita";

export async function BlocoDeReceita({ now }: { now: Date }) {
  const months = await obterReceitaPorMes(now, 7);
  const hasRevenue = months.some((m) => m.total > 0);
  const current = months[months.length - 1];
  return (
    <Painel title="Receita por mês">
      {hasRevenue ? (
        <>
          <GraficoDeReceita months={months} />
          <p className="mt-4 text-sm leading-6 text-tinta-suave">
            Em {formatarNomeDoMes(now)}, até hoje: casais {formatarReaisInteiros(current.couple)} e fornecedores {formatarReaisInteiros(current.vendor)}.
          </p>
        </>
      ) : (
        <EstadoVazio icon={Wallet} compact title="Ainda sem pagamentos" action={<Link href="/planos" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>Ver a página de planos</Link>}>
          Quando chegar o primeiro pagamento, a receita de cada mês aparece aqui.
        </EstadoVazio>
      )}
    </Painel>
  );
}
