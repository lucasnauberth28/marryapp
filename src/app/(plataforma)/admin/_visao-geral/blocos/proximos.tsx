import Link from "next/link";
import { Heart } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { EtiquetaDePlano, EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarDiaEMes, diaRelativo } from "@/lib/platform/format";
import type { Periodo } from "@/lib/platform/overview-period";
import { obterCasamentosProximos } from "@/lib/platform/queries/atencao";
import { carregarNumerosDaVisaoGeral } from "../data";

export async function BlocoDeProximos({ period, now }: { period: Periodo; now: Date }) {
  const [numbers, upcoming] = await Promise.all([carregarNumerosDaVisaoGeral(period), obterCasamentosProximos(now, 5)]);
  return (
    <Painel title="Casamentos nos próximos 30 dias" action={numbers.next30.count > 0 ? { label: `Ver os ${numbers.next30.count}`, href: "/admin/casais?aba=30dias" } : undefined}>
      {upcoming.length === 0 ? (
        <EstadoVazio icon={Heart} compact title="Nenhum casamento nos próximos 30 dias">
          Quando houver datas chegando, os casais aparecem aqui com a situação de cada um.
        </EstadoVazio>
      ) : (
        <ul className="flex flex-col">
          {upcoming.map((w) => (
            <li key={w.id} className="relative flex items-center gap-4 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
              <span className="w-12 shrink-0 text-center leading-tight" aria-label={diaRelativo(w.weddingDate, now)}>
                <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{formatarDiaEMes(w.weddingDate).split(" ")[1]}</span>
                <span className="block font-num text-2xl text-tinta">{formatarDiaEMes(w.weddingDate).split(" ")[0]}</span>
              </span>
              <span className="min-w-0 flex-1">
                <Link href={`/admin/casais/${w.id}`} className="font-semibold text-tinta after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa">
                  {w.coupleNames}
                </Link>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-tinta-suave">
                  {w.city && <span>{w.city}</span>}
                  <EtiquetaDePlano plan={w.planId} className="min-h-6 px-2 text-xs" />
                </span>
              </span>
              <EtiquetaDeSituacao tone={w.status.tone} className="hidden sm:inline-flex">
                {w.status.label}
              </EtiquetaDeSituacao>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}
