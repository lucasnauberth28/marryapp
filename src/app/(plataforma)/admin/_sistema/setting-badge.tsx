import { Pencil, CheckCircle2 } from "lucide-react";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarDiaEMes } from "@/lib/platform/format";

/** Mostra se a configuração já foi salva de verdade ou ainda é o padrão sugerido do código. */
export function SettingBadge({ saved, updatedAt, updatedByName }: { saved: boolean; updatedAt: Date | null; updatedByName: string | null }) {
  if (!saved) {
    return (
      <EtiquetaDeSituacao tone="neutro" icon={Pencil}>
        Padrão sugerido
      </EtiquetaDeSituacao>
    );
  }
  return (
    <EtiquetaDeSituacao tone="sucesso" icon={CheckCircle2}>
      Salvo{updatedAt ? ` em ${formatarDiaEMes(updatedAt)}` : ""}
      {updatedByName ? ` por ${updatedByName.split(" ")[0]}` : ""}
    </EtiquetaDeSituacao>
  );
}
