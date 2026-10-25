import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { obterConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { separarPrevisaoDeVolta } from "@/lib/platform/maintenance-core";
import { FormularioDoRemetenteDeEmail, FormularioDeManutencao, FormularioDaPoliticaDeReembolso } from "./_components/config-forms";
import { SecaoDosLimites } from "./_secoes/limites";
import { SecaoDosRecursosPorPlano, SecaoDasIntegracoes } from "./_secoes/planos-e-integracoes";
import { IndiceDasSecoes, SecaoDaConfiguracao } from "./_secoes/secao";
import { SecaoDePresentesETaxas, SecaoDosTextosLegais } from "./_secoes/textos-e-taxas";

export const metadata = { title: "Configurações da plataforma" };
export const dynamic = "force-dynamic";

export default async function Page() {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const [maintenance, emailSender, refund] = await Promise.all([obterConfiguracaoDaPlataforma("maintenance"), obterConfiguracaoDaPlataforma("emailSender"), obterConfiguracaoDaPlataforma("refundPolicy")]);
  const back = separarPrevisaoDeVolta(maintenance.backAt);

  return (
    <>
      <CabecalhoDaPagina eyebrow="Sistema" title="Configurações da plataforma" description="Mudanças aqui valem para todos. Cada uma fica no Registro de atividades." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <IndiceDasSecoes />
        <div className="flex min-w-0 flex-col gap-6">
          <SecaoDosTextosLegais />
          <SecaoDePresentesETaxas />
          <SecaoDaConfiguracao id="manutencao" title="Modo de manutenção" description="Quando ligado, casais e convidados veem um aviso e o painel do casal fica só para leitura.">
            <FormularioDeManutencao initial={{ enabled: maintenance.enabled, message: maintenance.message, backDate: back.date, backTime: back.time }} />
          </SecaoDaConfiguracao>
          <SecaoDosRecursosPorPlano />
          <SecaoDasIntegracoes />
          <SecaoDaConfiguracao id="emails" title="E-mails e remetentes">
            <FormularioDoRemetenteDeEmail initial={emailSender} />
          </SecaoDaConfiguracao>
          <SecaoDaConfiguracao id="reembolso" title="Política de reembolso" description="O texto que o casal lê e que orienta a sua decisão em Planos e receita.">
            <FormularioDaPoliticaDeReembolso initial={{ days: refund.days, text: refund.text }} />
          </SecaoDaConfiguracao>
          <SecaoDosLimites />
        </div>
      </div>
    </>
  );
}
