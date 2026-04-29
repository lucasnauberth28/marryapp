"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskStatus } from "@prisma/client";
import { KanbanTask } from "./kanban-task";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BoardItem } from "@/types/kanban";

interface KanbanColumnProps {
  columnId: TaskStatus;
  title: string;
  tasks: BoardItem[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: BoardItem) => void;
}

export function KanbanColumn({
  columnId,
  title,
  tasks,
  onAddTask,
  onEditTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: {
      type: "Column",
      columnId,
    },
  });

  return (
    <div className="flex flex-col bg-zinc-100/50 rounded-2xl w-full md:w-[350px] shrink-0 overflow-hidden border border-zinc-200/60 shadow-sm h-[calc(100vh-140px)]">
      <div className="p-4 border-b border-zinc-200/60 bg-white/50 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-zinc-700">{title}</h3>
          <span className="bg-zinc-200/70 text-zinc-600 text-xs py-0.5 px-2 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-500 hover:text-zinc-900 bg-white/50 hover:bg-white"
          onClick={() => onAddTask(columnId)}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div
            ref={setNodeRef}
            className={`p-3 min-h-[150px] flex flex-col gap-3 transition-colors ${
              isOver ? "bg-zinc-200/50" : ""
            }`}
          >
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <KanbanTask key={task.id} task={task} onEdit={onEditTask} />
              ))}
            </SortableContext>
            
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[100px] border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400 text-sm">
                Nenhuma tarefa
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
