import type { SituacaoDaTarefa } from "@/types/kanban";

export interface DadosDoFormularioDaTarefa {
  title: string;
  description: string | null;
  status: SituacaoDaTarefa;
  assignee: string | null;
  dueDate: Date | null;
}
