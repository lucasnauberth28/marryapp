import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { ROTULO_DA_TAREFA_AGENDADA, ROTULO_DA_SITUACAO_DA_TAREFA_AGENDADA } from "@/lib/platform/health";
import { formatarDataEHora, haQuantoTempo } from "@/lib/platform/format";
import type { FotoDaSaude } from "./comuns";

type Rotina = FotoDaSaude["crons"][number];

function EtiquetaDasRotinas({ crons }: { crons: Rotina[] }) {
  if (crons.length === 0) return undefined;
  if (crons.every((c) => c.state === "ok")) return <EtiquetaDeSituacao tone="sucesso" icon={CheckCircle2}>Todas rodaram</EtiquetaDeSituacao>;
  if (crons.some((c) => c.state === "failed" || c.state === "late")) return <EtiquetaDeSituacao tone="aviso" icon={AlertTriangle}>Atenção</EtiquetaDeSituacao>;
  return <EtiquetaDeSituacao tone="neutro" icon={Clock}>Ainda não rodou</EtiquetaDeSituacao>;
}

function ItemDeRotina({ c, now }: { c: Rotina; now: Date }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-5 text-tinta">{ROTULO_DA_TAREFA_AGENDADA[c.job] ?? c.job}</p>
        <p className="text-sm leading-5 text-tinta-suave">{c.lastAt ? `${haQuantoTempo(c.lastAt, now)}, ${formatarDataEHora(c.lastAt)}` : "Ainda não rodou"}</p>
        {c.error && <p className="text-sm leading-5 text-perigo">{c.error.slice(0, 160)}</p>}
      </div>
      <div className="flex flex-col items-end gap-1">
        <EtiquetaDeSituacao tone={c.state === "ok" ? "sucesso" : c.state === "never" ? "neutro" : "perigo"} icon={c.state === "ok" ? CheckCircle2 : c.state === "never" ? Clock : XCircle}>
          {ROTULO_DA_SITUACAO_DA_TAREFA_AGENDADA[c.state]}
        </EtiquetaDeSituacao>
        {c.result && <span className="text-sm text-tinta-suave">{c.result}</span>}
      </div>
    </li>
  );
}

export function PainelDasRotinas({ h }: { h: FotoDaSaude }) {
  return (
    <Painel title="Rotinas diárias" aside={<EtiquetaDasRotinas crons={h.crons} />}>
      <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
        {h.crons.map((c) => (
          <ItemDeRotina key={c.job} c={c} now={h.measuredAt} />
        ))}
      </ul>
      <p className="mt-3 text-sm leading-5 text-tinta-suave">As rotinas rodam uma vez por dia e só aparecem aqui depois da primeira execução.</p>
    </Painel>
  );
}
