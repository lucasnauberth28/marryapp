import { TaskStatus } from "@prisma/client";

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
