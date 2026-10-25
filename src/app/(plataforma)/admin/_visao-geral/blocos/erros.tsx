import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarHora, haQuantoTempo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { obterErrosRecentes } from "@/lib/platform/queries/atencao";

export async function BlocoDeErros({ now }: { now: Date }) {
  const errors = await obterErrosRecentes(now);
  return (
    <Painel title="Erros e falhas nas últimas 24 horas" action={{ label: "Saúde do sistema", href: "/admin/saude" }}>
      {errors.nothingRecorded ? (
        <p className="text-sm leading-6 text-tinta-suave">
          <strong className="font-semibold text-tinta">Sem registros ainda.</strong> Os envios e avisos dos serviços passam a aparecer aqui conforme acontecem. Sem registro não quer dizer que está tudo certo.
        </p>
      ) : (
        <ul className="flex flex-col">
          {errors.services.map((s) => (
            <li key={s.service} className="flex flex-wrap items-center justify-between gap-2 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
              <span>
                <span className="block font-semibold text-tinta">{s.label}</span>
                <span className="block text-sm text-tinta-suave">
                  {s.total === 0 ? "Sem registros nas últimas 24 horas" : s.failures === 0 ? `Nenhuma falha em ${pluralizar(s.total, "registro", "registros")}` : `${pluralizar(s.failures, "falha", "falhas")}${s.lastFailureAt ? `, a última às ${formatarHora(s.lastFailureAt)}` : ""}`}
                </span>
              </span>
              {s.total > 0 &&
                (s.failures > 0 ? (
                  <EtiquetaDeSituacao tone="aviso" icon={AlertTriangle}>
                    Atenção
                  </EtiquetaDeSituacao>
                ) : (
                  <EtiquetaDeSituacao tone="sucesso" icon={CheckCircle2}>
                    Sem falhas
                  </EtiquetaDeSituacao>
                ))}
            </li>
          ))}
          {errors.failedCrons.map((c) => (
            <li key={c.job} className="flex flex-wrap items-center justify-between gap-2 border-b border-linha py-3 last:border-b-0">
              <span>
                <span className="block font-semibold text-tinta">Rotina diária ({c.job})</span>
                <span className="block text-sm text-tinta-suave">Falhou {haQuantoTempo(c.at, now)}</span>
              </span>
              <EtiquetaDeSituacao tone="perigo" icon={AlertTriangle}>
                Falhou
              </EtiquetaDeSituacao>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}
