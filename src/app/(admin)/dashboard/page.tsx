// Resumo do casamento: convite, o que fazer agora, confirmações, dinheiro dos presentes (extrato único) e orçamento.
// Só dados reais do banco; o que ainda não medimos fica de fora (ex.: gráfico de confirmações ao longo do tempo).
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { obterIdentidadeDoCasamentoPrincipal } from "@/lib/wedding";
import { temAcessoAoCaminho } from "@/lib/permissions";
import { obterPlanoDoCasamento } from "@/lib/wedding-plan";
import { AtalhoDoCredenciamento } from "./resumo/atalho-do-credenciamento";
import { CabecalhoDoResumo } from "./resumo/cabecalho";
import { carregarDadosDoResumo } from "./resumo/carregar-dados";
import { calcularContas } from "./resumo/contas";
import { montarConviteDoResumo } from "./resumo/convite";
import { montarFilaDoResumo } from "./resumo/fila";
import { GradeDoResumo } from "./resumo/grade";

export const dynamic = "force-dynamic";

export const metadata = { title: "Resumo do casamento" };

export default async function DashboardPage() {
  const ctx = await exigirCasamentoNaPagina("/dashboard");
  const { weddingId, session, wedding } = ctx;
  const [identity, plan] = await Promise.all([obterIdentidadeDoCasamentoPrincipal(), obterPlanoDoCasamento(weddingId)]);
  const now = new Date();
  const can = (path: string) => temAcessoAoCaminho(session.allowedPaths, path);

  const dados = await carregarDadosDoResumo(ctx);
  const contas = calcularContas(dados, { plan, identity, now });
  const fila = montarFilaDoResumo(dados, contas, { session, can });
  const convite = montarConviteDoResumo(contas, dados, { identity, wedding });
  const { weddingDays } = contas;
  const naSemanaDoCasamento = weddingDays !== null && weddingDays <= 7 && weddingDays >= 0;

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <CabecalhoDoResumo now={now} identity={identity} wedding={wedding} contas={contas} siteUrl={convite.siteUrl} />
      <GradeDoResumo dados={dados} contas={contas} convite={convite} fila={fila} identity={identity} can={can} />
      {dados.canQr && naSemanaDoCasamento && can("/credenciamento") && <AtalhoDoCredenciamento />}
    </div>
  );
}
