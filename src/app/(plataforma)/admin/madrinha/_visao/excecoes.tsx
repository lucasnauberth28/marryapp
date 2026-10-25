import Link from "next/link";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarDiaEMes } from "@/lib/platform/format";
import type { listarExcecoesDaMadrinha } from "@/lib/platform/queries/madrinha";

type Excecao = Awaited<ReturnType<typeof listarExcecoesDaMadrinha>>[number];

function ItemDeExcecao({ o }: { o: Excecao }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
      <div className="min-w-0">
        <Link href={`/admin/casais/${o.weddingId}`} className="font-semibold text-tinta underline-offset-2 hover:underline">
          {o.coupleNames}
        </Link>
        <p className="text-sm text-tinta-suave">
          Atualizado em {formatarDiaEMes(o.updatedAt)}
          {o.note ? ` · ${o.note}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {o.blockedAt && <EtiquetaDeSituacao tone="perigo">Bloqueado</EtiquetaDeSituacao>}
        {o.enabled === true && <EtiquetaDeSituacao tone="sucesso">Ligada à mão</EtiquetaDeSituacao>}
        {o.enabled === false && <EtiquetaDeSituacao tone="neutro">Desligada à mão</EtiquetaDeSituacao>}
        {o.extraMessages > 0 && <EtiquetaDeSituacao tone="salvia">+{o.extraMessages} mensagens</EtiquetaDeSituacao>}
      </div>
    </li>
  );
}

export function PainelDeExcecoes({ overrides }: { overrides: Excecao[] }) {
  return (
    <Painel title="Casais com ajuste" description="Quem tem a Liz ligada, desligada ou bloqueada à mão, ou mensagens a mais.">
      {overrides.length === 0 ? (
        <p className="text-sm text-tinta-suave">Nenhum casal com ajuste ainda.</p>
      ) : (
        <ul className="divide-y divide-linha">
          {overrides.map((o) => (
            <ItemDeExcecao key={o.weddingId} o={o} />
          ))}
        </ul>
      )}
    </Painel>
  );
}
