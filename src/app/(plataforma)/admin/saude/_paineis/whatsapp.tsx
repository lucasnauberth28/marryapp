import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarInteiro } from "@/lib/platform/format";
import { ReconectarWhatsapp } from "../_components/reconnect-whatsapp";
import { MetricaDaSaude, SemRegistros, etiquetaDoServico, type FotoDaSaude } from "./comuns";

function situacaoDaInstancia(whatsapp: FotoDaSaude["whatsapp"]) {
  if (whatsapp.connected === true) return { tone: "sucesso" as const, icon: CheckCircle2, text: "Instância conectada" };
  if (whatsapp.connected === false) return { tone: "perigo" as const, icon: XCircle, text: "Instância desconectada" };
  return { tone: "neutro" as const, icon: Clock, text: "Sem resposta da instância" };
}

function CorpoDoWhatsapp({ whatsapp }: { whatsapp: FotoDaSaude["whatsapp"] }) {
  const estado = situacaoDaInstancia(whatsapp);
  return (
    <>
      <p className="mb-4 flex items-center gap-2 text-[15px] text-tinta">
        <estado.icon className={estado.tone === "sucesso" ? "size-5 text-sucesso" : estado.tone === "perigo" ? "size-5 text-perigo" : "size-5 text-tinta-suave"} aria-hidden="true" />
        {estado.text}
      </p>
      {whatsapp.stateNote && <p className="mb-3 text-sm text-tinta-suave">{whatsapp.stateNote}</p>}
      {whatsapp.counts.total === 0 && whatsapp.invalidNumbers === 0 ? (
        <SemRegistros what="As mensagens enviadas passam a ser contadas a partir de agora." />
      ) : (
        <div className="flex gap-10">
          <MetricaDaSaude value={formatarInteiro(whatsapp.counts.ok)} label="enviadas em 24 h" />
          <MetricaDaSaude value={formatarInteiro(whatsapp.counts.failed)} label="falhas em 24 h" />
          <MetricaDaSaude value={formatarInteiro(whatsapp.invalidNumbers)} label="números sem WhatsApp" />
        </div>
      )}
      <div className="mt-3">
        <ReconectarWhatsapp />
      </div>
    </>
  );
}

export function PainelDoWhatsapp({ h }: { h: FotoDaSaude }) {
  const wa = etiquetaDoServico(h.whatsapp.configured, h.whatsapp.counts);
  return (
    <Painel title="WhatsApp" aside={<EtiquetaDeSituacao tone={wa.tone} icon={wa.icon}>{wa.text}</EtiquetaDeSituacao>}>
      {h.whatsapp.configured ? (
        <CorpoDoWhatsapp whatsapp={h.whatsapp} />
      ) : (
        <p className="text-sm leading-5 text-tinta-suave">O WhatsApp não está configurado neste ambiente. Configure na Vercel (variáveis de ambiente da Evolution API).</p>
      )}
    </Painel>
  );
}
