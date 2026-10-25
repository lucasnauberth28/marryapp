// Definido localmente para evitar importar @prisma/client em Client Components
// (Client Components não podem importar módulos server-only como o Prisma)
export const SituacaoDaTarefa = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;

export type SituacaoDaTarefa = (typeof SituacaoDaTarefa)[keyof typeof SituacaoDaTarefa];

export type TipoDoItemDoQuadro = "MANUAL";

export interface ItemDoQuadro {
  id: string;
  type: TipoDoItemDoQuadro;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  assignee?: string | null;
  status: SituacaoDaTarefa;
  position: number;
}
