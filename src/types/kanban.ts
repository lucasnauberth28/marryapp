// Definido localmente para evitar importar @prisma/client em Client Components
// (Client Components não podem importar módulos server-only como o Prisma)
export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export type BoardItemType = "MANUAL" | "HONEYMOON";

export interface BoardItem {
  id: string;
  type: BoardItemType;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  assignee?: string | null;
  status: TaskStatus;
  position: number;
  // Extras
  category?: string; // used by HONEYMOON
  amount?: number;   // used by HONEYMOON
}
