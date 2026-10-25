import { CheckCircle2, XCircle } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarInteiro, formatarHora } from "@/lib/platform/format";
import { LinhaDaSaude, MetricaDaSaude, SemRegistros, etiquetaDoServico, type FotoDaSaude } from "./comuns";

export function PainelDoMercadoPago({ h }: { h: FotoDaSaude }) {
  const mp = etiquetaDoServico(h.mercadopago.configured, h.mercadopago.counts);
  return (
    <Painel title="Mercado Pago" aside={<EtiquetaDeSituacao tone={mp.tone} icon={mp.icon}>{mp.text}</EtiquetaDeSituacao>}>
      {!h.mercadopago.configured && <p className="mb-3 text-sm leading-5 text-aviso">O token do Mercado Pago não está configurado neste ambiente.</p>}
      {h.mercadopago.counts.total === 0 ? (
        <SemRegistros what="Os avisos de pagamento recebidos passam a ser contados a partir de agora." />
      ) : (
        <>
          <div className="flex gap-10">
            <MetricaDaSaude value={formatarInteiro(h.mercadopago.counts.total)} label="avisos recebidos em 24 h" />
            <MetricaDaSaude value={formatarInteiro(h.mercadopago.counts.failed)} label="não aplicados" />
          </div>
          <ul className="mt-4 divide-y divide-linha">
            {h.mercadopago.recent.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
                <span className="flex min-w-0 items-baseline gap-3">
                  <span className="text-sm tabular-nums text-tinta-suave">{formatarHora(e.at)}</span>
                  <span className="truncate text-tinta">{e.message ?? "Aviso aplicado"}</span>
                </span>
                <EtiquetaDeSituacao tone={e.ok ? "sucesso" : "perigo"} icon={e.ok ? CheckCircle2 : XCircle}>
                  {e.ok ? "Recebido" : "Falhou"}
                </EtiquetaDeSituacao>
              </li>
            ))}
          </ul>
        </>
      )}
      <dl className="mt-3 divide-y divide-linha border-t border-linha pt-2">
        <LinhaDaSaude label="Assinatura dos avisos">{h.mercadopago.webhookSecret ? "Conferida" : "Não configurada"}</LinhaDaSaude>
      </dl>
    </Painel>
  );
}
