"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, GripVertical, User2Icon, Palmtree, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardItem } from "@/types/kanban";

interface KanbanTaskProps {
  task: BoardItem;
  onEdit?: (task: BoardItem) => void;
}

export function KanbanTask({ task, onEdit }: KanbanTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 border-2 border-zinc-400 rounded-xl border-dashed h-[120px] w-full"
      />
    );
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const isHoneymoon = task.type === "HONEYMOON";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex w-full"
    >
      <Card
        className={`w-full ${isHoneymoon ? 'cursor-default' : 'cursor-grab active:cursor-grabbing hover:border-zinc-300'} transition-all shadow-sm bg-white hover:shadow-md ${
          isOverdue ? "border-red-300 bg-red-50/10" : ""
        } ${isHoneymoon ? "border-emerald-200/50" : ""}`}
        onClick={() => {
          if (!isHoneymoon) onEdit?.(task);
        }}
      >
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              {isHoneymoon ? (
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md shrink-0">
                  <Palmtree className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="p-1.5 bg-zinc-50 text-zinc-500 rounded-md shrink-0 border border-zinc-100">
                  <StickyNote className="w-3.5 h-3.5" />
                </div>
              )}
              <h4 className="font-medium text-sm text-zinc-900 leading-tight mt-1">
                {task.title}
              </h4>
            </div>
            <Button
              {...attributes}
              {...listeners}
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0 -mr-2 -mt-2 text-zinc-400 hover:text-zinc-700"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
          </div>
          
          {(task.dueDate || task.assignee || isHoneymoon) && (
            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
              {isHoneymoon && task.amount && (
                <div className="flex items-center gap-1 bg-emerald-50/50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100 font-medium">
                  {(task.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              )}
              {task.dueDate && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md border ${isOverdue ? 'bg-red-50 border-red-200 text-red-600' : 'bg-zinc-50 border-zinc-100'}`}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>
                    {new Date(task.dueDate).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
              )}
              {task.assignee && (
                <div className="flex items-center gap-1 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100 truncate max-w-[120px]">
                  <User2Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{task.assignee}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
