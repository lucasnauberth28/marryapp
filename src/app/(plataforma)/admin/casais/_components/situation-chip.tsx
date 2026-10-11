import { AlertTriangle, Ban, CheckCircle2, Clock } from "lucide-react";
import { StatusChip } from "@/components/plataforma/status-chip";
import { SITUATION_LABEL, type CasalSituation } from "@/lib/platform/casal-status";

const CONFIG = {
  active: { tone: "sucesso", icon: CheckCircle2 },
  problem: { tone: "perigo", icon: AlertTriangle },
  suspended: { tone: "perigo", icon: Ban },
  inactive: { tone: "neutro", icon: Clock },
  onboarding: { tone: "aviso", icon: Clock },
} as const;

/** Situação do casal (Ativo, Com problema, Sem atividade, Onboarding parado, Suspenso): sempre ícone e palavra. */
export function SituationChip({ situation }: { situation: CasalSituation }) {
  const { tone, icon } = CONFIG[situation];
  return (
    <StatusChip tone={tone} icon={icon}>
      {SITUATION_LABEL[situation]}
    </StatusChip>
  );
}
