import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Aviso } from "@/components/plataforma/notices";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { obterConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { emailEstaConfigurado } from "@/lib/email";
import { obterFotoDaSaude } from "@/lib/platform/queries/saude";
import { formatarHora } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { FormularioDeAlertas } from "./_components/alerts-form";
import type { FotoDaSaude } from "./_paineis/comuns";
import { PainelDeEmail, PainelDoBanco } from "./_paineis/email-e-banco";
import { PainelDoMercadoPago } from "./_paineis/mercado-pago";
import { PainelDasRotinas } from "./_paineis/rotinas";
import { PainelDoWhatsapp } from "./_paineis/whatsapp";

export const metadata = { title: "Saúde do sistema" };
export const dynamic = "force-dynamic"; // sempre medir na hora

function ResumoDaSaude({ h }: { h: FotoDaSaude }) {
  if (h.attention.length > 0) {
    return (
      <Aviso tone="aviso" icon={AlertTriangle} title={`${pluralizar(h.attention.length, "coisa pede", "coisas pedem")} atenção`}>
        {h.attention.map((a) => `${a.title}: ${a.detail}`).join(" ")}
      </Aviso>
    );
  }
  const nothingMeasured = h.mercadopago.counts.total + h.email.counts.total + h.whatsapp.counts.total + h.push.counts.total === 0 && h.crons.every((c) => c.state === "never");
  if (nothingMeasured) {
    return (
      <Aviso tone="neutro" icon={Info} title="Ainda estamos medindo">
        Ainda não há registros das últimas 24 horas. Assim que chegarem pagamentos, e-mails e mensagens, os números aparecem aqui. Enquanto isso, só o que dá para conferir na hora (banco e configuração) está medido.
      </Aviso>
    );
  }
  return (
    <Aviso tone="sucesso" icon={CheckCircle2} title="Nada pede atenção agora">
      Considerando só o que foi medido nas últimas 24 horas.
    </Aviso>
  );
}

export default async function Page() {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const [h, alerts] = await Promise.all([obterFotoDaSaude(), obterConfiguracaoDaPlataforma("healthAlerts")]);

  return (
    <>
      <CabecalhoDaPagina eyebrow="Sistema" title="Saúde do sistema" description={`O que faz o Aceito funcionar, num lugar só. Atualizado às ${formatarHora(h.measuredAt)}.`} />
      <ResumoDaSaude h={h} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PainelDoMercadoPago h={h} />
        <PainelDasRotinas h={h} />
        <PainelDoWhatsapp h={h} />
        <PainelDeEmail h={h} />
        <PainelDoBanco h={h} />
      </div>

      <FormularioDeAlertas
        initial={{ mercadoPagoFailures: alerts.mercadoPagoFailures, whatsappDisconnected: alerts.whatsappDisconnected, routineMissed: alerts.routineMissed, sendTo: alerts.sendTo }}
        emailConfigured={emailEstaConfigurado()}
      />
    </>
  );
}
