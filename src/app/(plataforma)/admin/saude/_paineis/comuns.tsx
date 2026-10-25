import { AlertTriangle, CheckCircle2, Clock, Info } from "lucide-react";
import type { TomDaSituacao } from "@/components/plataforma/status-chip";
import type { ContagensDosServicos, obterFotoDaSaude } from "@/lib/platform/queries/saude";

export type FotoDaSaude = Awaited<ReturnType<typeof obterFotoDaSaude>>;

export function MetricaDaSaude({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-num text-[34px] leading-10 tabular-nums text-tinta">{value}</p>
      <p className="text-sm leading-5 text-tinta-suave">{label}</p>
    </div>
  );
}

export function LinhaDaSaude({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2 text-[15px] leading-5">
      <dt className="text-tinta-suave">{label}</dt>
      <dd className="text-right font-semibold text-tinta">{children}</dd>
    </div>
  );
}

export const SemRegistros = ({ what }: { what: string }) => <p className="text-sm leading-5 text-tinta-suave">Sem registros ainda. {what}</p>;

/** Situação geral de um serviço, só com o que foi medido: sem configuração, sem registros, com falhas ou sem falhas. */
export function etiquetaDoServico(configured: boolean, c: ContagensDosServicos): { tone: TomDaSituacao; icon: typeof Clock; text: string } {
  if (!configured) return { tone: "neutro", icon: Info, text: "Não configurado" };
  if (c.failed > 0) return { tone: "aviso", icon: AlertTriangle, text: "Atenção" };
  if (c.total === 0) return { tone: "neutro", icon: Clock, text: "Sem registros" };
  return { tone: "sucesso", icon: CheckCircle2, text: "Sem falhas em 24 h" };
}
