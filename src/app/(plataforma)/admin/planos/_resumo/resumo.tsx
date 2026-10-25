import { TrendingUp } from "lucide-react";
import { ListaDeAtencao } from "@/components/plataforma/attention-list";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { Painel } from "@/components/plataforma/panel";
import { GraficoDeReceita } from "@/components/plataforma/revenue-chart";
import { obterCatalogo } from "@/lib/pagamento/catalog-server";
import { obterPlanosDeFornecedorPrestesAVencer } from "@/lib/platform/queries/fornecedores/curadoria";
import { contarNotasPendentes, obterReembolsosPendentes, listarCuponsEmUso, listarReembolsos } from "@/lib/platform/queries/receita/pendencias";
import { obterCasaisQuePagaramNesteMes, obterReceitaDoMes, obterNaoRenovacoes, obterPixParaConferir, obterReceitaRecorrente, obterReceitaPorMes } from "@/lib/platform/queries/receita/resumo";
import { SecaoDeReembolsos } from "../_components/refunds-section";
import { itensParaResolver } from "./atencao";
import { IndicadoresDeReceita } from "./indicadores";
import { PainelDeCupons, PainelDeVencimentos } from "./tabelas";

const DUAS_COLUNAS = "grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]";

export async function ResumoDosPlanos({ now }: { now: Date }) {
  const [month, couples, recurring, nonRenewals, months, pix, refunds, invoiceCount, expiring, coupons, refundRows, catalog] = await Promise.all([
    obterReceitaDoMes(now),
    obterCasaisQuePagaramNesteMes(now),
    obterReceitaRecorrente(now),
    obterNaoRenovacoes(now),
    obterReceitaPorMes(now, 7),
    obterPixParaConferir(now),
    obterReembolsosPendentes(),
    contarNotasPendentes(),
    obterPlanosDeFornecedorPrestesAVencer(now, 7, 8),
    listarCuponsEmUso(now, 5),
    listarReembolsos(5),
    obterCatalogo(),
  ]);
  const attention = itensParaResolver({ pix, refunds, invoiceCount, now });

  return (
    <>
      <IndicadoresDeReceita month={month} recurring={recurring} nonRenewals={nonRenewals} couples={couples} now={now} />

      <div className={DUAS_COLUNAS}>
        <Painel title="Receita por mês">
          {months.some((m) => m.total > 0) ? (
            <GraficoDeReceita months={months} />
          ) : (
            <EstadoVazio icon={TrendingUp} title="Ainda sem pagamentos" compact>
              Quando o primeiro casal ou fornecedor pagar um plano, a receita de cada mês aparece aqui.
            </EstadoVazio>
          )}
        </Painel>
        <Painel title="Para resolver">
          {attention.length > 0 ? <ListaDeAtencao items={attention} /> : <EstadoVazio title="Tudo em dia" compact>Nenhum Pix para conferir, reembolso para decidir nem nota pendente.</EstadoVazio>}
        </Painel>
      </div>

      <div className={DUAS_COLUNAS}>
        <PainelDeVencimentos expiring={expiring} catalog={catalog} now={now} />
        <PainelDeCupons coupons={coupons} />
      </div>

      <SecaoDeReembolsos refunds={refundRows} now={now} preview />
    </>
  );
}
