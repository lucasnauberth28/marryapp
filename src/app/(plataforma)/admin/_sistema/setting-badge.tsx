import { Pencil, CheckCircle2 } from "lucide-react";
import { StatusChip } from "@/components/plataforma/status-chip";
import { formatDayMonth } from "@/lib/platform/format";

/** Mostra se a configuração já foi salva de verdade ou ainda é o padrão sugerido do código. */
export function SettingBadge({ saved, updatedAt, updatedByName }: { saved: boolean; updatedAt: Date | null; updatedByName: string | null }) {
  if (!saved) {
    return (
      <StatusChip tone="neutro" icon={Pencil}>
        Padrão sugerido
      </StatusChip>
    );
  }
  return (
    <StatusChip tone="sucesso" icon={CheckCircle2}>
      Salvo{updatedAt ? ` em ${formatDayMonth(updatedAt)}` : ""}
      {updatedByName ? ` por ${updatedByName.split(" ")[0]}` : ""}
    </StatusChip>
  );
}
