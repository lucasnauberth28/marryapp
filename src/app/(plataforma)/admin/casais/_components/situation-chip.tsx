import { AlertTriangle, Ban, CheckCircle2, Clock } from "lucide-react";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { ROTULO_DA_SITUACAO, type SituacaoDoCasal } from "@/lib/platform/casal-status";

const CONFIGURACAO_DA_ETIQUETA = {
  active: { tone: "sucesso", icon: CheckCircle2 },
  problem: { tone: "perigo", icon: AlertTriangle },
  suspended: { tone: "perigo", icon: Ban },
  inactive: { tone: "neutro", icon: Clock },
  onboarding: { tone: "aviso", icon: Clock },
} as const;

/** Situação do casal (Ativo, Com problema, Sem atividade, Onboarding parado, Suspenso): sempre ícone e palavra. */
export function EtiquetaDeSituacaoDoCasal({ situation }: { situation: SituacaoDoCasal }) {
  const { tone, icon } = CONFIGURACAO_DA_ETIQUETA[situation];
  return (
    <EtiquetaDeSituacao tone={tone} icon={icon}>
      {ROTULO_DA_SITUACAO[situation]}
    </EtiquetaDeSituacao>
  );
}
