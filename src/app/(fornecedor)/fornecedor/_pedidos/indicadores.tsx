import { Aparicao } from "@/components/motion/reveal";
import { pluralizar } from "@/lib/formatacao/plural";
import { cn } from "@/lib/utils";
import { ESTILO_DO_CARTAO, ESTILO_DO_SOBRETITULO } from "./estilos";

interface PropriedadesDosIndicadores {
  monthCount: number;
  totalCount: number;
  newCount: number;
  closedCount: number;
  views30: number;
  temPerfilPublico: boolean;
}

export function IndicadoresDoFornecedor({ monthCount, totalCount, newCount, closedCount, views30, temPerfilPublico }: PropriedadesDosIndicadores) {
  const kpis = [
    { label: "Pedidos no mês", value: monthCount, hint: `${pluralizar(totalCount, "pedido", "pedidos")} no total` },
    { label: "Sem resposta", value: newCount, hint: newCount > 0 ? "aguardando seu retorno" : totalCount > 0 ? "tudo respondido" : "nenhum pedido ainda" },
    { label: "Fechados", value: closedCount, hint: totalCount > 0 ? `${Math.round((closedCount / totalCount) * 100)}% dos pedidos` : "nenhum ainda" },
    { label: "Visitas (30 dias)", value: views30, hint: temPerfilPublico ? "no seu perfil público" : "o perfil aparece depois da análise do Aceito" },
  ];
  return (
    <section aria-label="Resumo" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {kpis.map((kpi, i) => (
        <Aparicao key={kpi.label} variant="up" delay={80 * (i + 1)} className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-1 p-4 sm:p-5")}>
          <p className={ESTILO_DO_SOBRETITULO}>{kpi.label}</p>
          <span className="font-num text-4xl leading-tight">{kpi.value}</span>
          <span className="text-sm text-tinta-suave">{kpi.hint}</span>
        </Aparicao>
      ))}
    </section>
  );
}
