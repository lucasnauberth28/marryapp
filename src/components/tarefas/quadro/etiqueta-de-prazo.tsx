import { TriangleAlert } from "lucide-react";
import type { ItemDoQuadro } from "@/types/kanban";
import { EtiquetaDeSituacao } from "@/components/painel/status-chip";
import { formatarDataCivilCurta } from "@/lib/formatacao/data";
import { UM_DIA_EM_MS, chaveDoPrazo, milissegundosDoDia, tarefaEstaConcluida } from "./prazos";

const formatoDoMesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
const formatoDoMesEAno = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
// "5 de out." vira "5 out"; "nov." vira "Nov"
const dataCurtaDaChave = (formatar: (data: Date) => string, key: string) => {
  const text = formatar(new Date(`${key}T00:00:00Z`)).replace(".", "").replace(" de ", " ");
  return /^\d/.test(text) ? text : text.charAt(0).toUpperCase() + text.slice(1);
};

export function EtiquetaDePrazo({ task, todayKey }: { task: ItemDoQuadro; todayKey: string }) {
  const key = chaveDoPrazo(task);
  if (!key || tarefaEstaConcluida(task)) return null;
  const diff = Math.round((milissegundosDoDia(key) - milissegundosDoDia(todayKey)) / UM_DIA_EM_MS);
  if (diff < 0) {
    return (
      <EtiquetaDeSituacao tone="perigo" icon={<TriangleAlert className="size-4" aria-hidden="true" />}>
        Venceu {dataCurtaDaChave(formatarDataCivilCurta, key)}
      </EtiquetaDeSituacao>
    );
  }
  if (diff <= 7) return <EtiquetaDeSituacao tone={diff <= 3 ? "aviso" : "neutro"}>{diff === 0 ? "Hoje" : `Até ${dataCurtaDaChave(formatarDataCivilCurta, key)}`}</EtiquetaDeSituacao>;
  const sameYear = key.slice(0, 4) === todayKey.slice(0, 4);
  return <EtiquetaDeSituacao tone="neutro">{dataCurtaDaChave((d) => (sameYear ? formatoDoMesCurto : formatoDoMesEAno).format(d), key)}</EtiquetaDeSituacao>;
}
