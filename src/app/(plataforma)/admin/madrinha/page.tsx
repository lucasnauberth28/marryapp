import { Painel } from "@/components/plataforma/panel";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { obterVisaoGeralDaMadrinha, listarExcecoesDaMadrinha } from "@/lib/platform/queries/madrinha";
import { FormularioContraAbuso, FormularioDoTetoGlobal, FormularioDeLimites } from "./_components/config-forms";
import { AjusteDoCasamento } from "./_components/wedding-adjust";
import { SeloDeConfiguracao } from "../_sistema/setting-badge";
import { checklistDaLiz } from "./_visao/checklist";
import { PainelDeExcecoes } from "./_visao/excecoes";
import { CabecalhoDaLiz, PainelDeConsumo, PainelDeUsoDoMes, PainelInterruptorGeral } from "./_visao/paineis";

export const metadata = { title: "Liz" };

export default async function Page() {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const [overview, overrides] = await Promise.all([obterVisaoGeralDaMadrinha(), listarExcecoesDaMadrinha(20)]);
  const { limits, globalCap, abuse, meta } = overview;

  return (
    <>
      <CabecalhoDaLiz />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <PainelInterruptorGeral checklist={checklistDaLiz(overview)} />
        <PainelDeUsoDoMes />
      </div>

      <PainelDeConsumo />

      <section aria-labelledby="limites-t" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="limites-t" className="text-xl font-semibold leading-7 text-tinta">
            Limites por plano
          </h2>
          <SeloDeConfiguracao {...meta["madrinha.limits"]} />
        </div>
        <FormularioDeLimites subscription={limits.subscription} trial={limits.trial} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Painel title="Teto mensal global" aside={<SeloDeConfiguracao {...meta["madrinha.globalCap"]} />} className="flex flex-col">
          <FormularioDoTetoGlobal monthlyCostCapCents={globalCap.monthlyCostCapCents} warnPercent={globalCap.warnPercent} pauseAtCap={globalCap.pauseAtCap} />
        </Painel>
        <Painel title="Bloqueio por abuso" aside={<SeloDeConfiguracao {...meta["madrinha.abuse"]} />} className="flex flex-col">
          <FormularioContraAbuso perHour={abuse.perHour} blockHours={abuse.blockHours} blockOffTopic={abuse.blockOffTopic} offTopicBeforeBlock={abuse.offTopicBeforeBlock} />
        </Painel>
        <Painel title="Ajuste para um casal" className="flex flex-col">
          <AjusteDoCasamento />
        </Painel>
      </div>

      <PainelDeExcecoes overrides={overrides} />
    </>
  );
}
