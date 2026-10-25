import { CheckCircle2, Clock, Copy } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import type { ResultadoDaConexao } from "@/lib/dominio/vercel-domains-core";
import { cn } from "@/lib/utils";
import { copiarTexto, textoDaSituacaoNaVercel } from "./tipos-e-textos";

const ETIQUETA_DA_SITUACAO = {
  ready: { tone: "sucesso", label: "Verificado e apontado" },
  pending_dns: { tone: "aviso", label: "Falta o DNS" },
  pending_verification: { tone: "aviso", label: "Falta a verificação" },
} as const;

function RegistroDeDns({ record }: { record: Extract<ResultadoDaConexao, { ok: true }>["records"][number] }) {
  return (
    <li className="flex flex-col gap-1 rounded-xl border border-linha bg-papel p-3 text-sm">
      <span className="text-tinta-suave">
        Tipo {record.type} · nome <span className="font-mono">{record.name}</span>
      </span>
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 break-all font-mono text-tinta">{record.value}</span>
        <button type="button" onClick={() => copiarTexto(record.value, "Valor copiado.")} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm)}>
          <Copy className="size-4" aria-hidden="true" /> Copiar
        </button>
      </span>
      {record.source === "default" ? <span className="text-xs text-tinta-suave">Valor padrão da Vercel: a consulta não devolveu o recomendado. Confira em Domains no projeto.</span> : null}
    </li>
  );
}

function PainelDaConexao({ connection }: { connection: ResultadoDaConexao }) {
  if (!connection.ok) {
    return (
      <p role="status" className="rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
        {connection.message}
      </p>
    );
  }
  const chip = ETIQUETA_DA_SITUACAO[connection.state];
  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-2 text-sm text-tinta">
        <EtiquetaDeSituacao tone={chip.tone} icon={connection.state === "ready" ? CheckCircle2 : Clock}>
          {chip.label}
        </EtiquetaDeSituacao>
        {connection.message}
      </p>
      <ul className="flex flex-col gap-2">
        {connection.records.map((record) => (
          <RegistroDeDns key={`${record.type}-${record.name}`} record={record} />
        ))}
      </ul>
    </div>
  );
}

interface Propriedades {
  vercelReady: boolean;
  connection: ResultadoDaConexao | null;
  vercelState: string | null;
}

export function SecaoDeDns({ vercelReady, connection, vercelState }: Propriedades) {
  const stateText = textoDaSituacaoNaVercel(vercelState);
  return (
    <section aria-label="Registros de DNS" className="flex flex-col gap-3 border-t border-linha pt-4">
      <h3 className="text-[15px] font-semibold text-tinta">Registros de DNS para configurar</h3>
      {!vercelReady ? (
        <p className="rounded-xl bg-areia p-3 text-sm text-tinta">
          Vercel não configurada (faltam VERCEL_API_TOKEN e VERCEL_PROJECT_ID). Sem ela não temos os registros reais para mostrar: adicione o domínio na Vercel à mão e use &quot;Marcar como no ar&quot;.
        </p>
      ) : connection ? (
        <PainelDaConexao connection={connection} />
      ) : (
        <p className="text-sm text-tinta-suave">Use &quot;Conectar à Vercel&quot; ou &quot;Verificar DNS&quot; para ver os registros que a Vercel pede para este domínio.</p>
      )}
      {stateText ? (
        <p className="flex items-start gap-2 rounded-xl bg-areia p-3 text-sm text-tinta">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {stateText}
        </p>
      ) : null}
    </section>
  );
}
