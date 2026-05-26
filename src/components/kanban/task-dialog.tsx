"use client";

import { useEffect, useState } from "react";
import { TaskStatus } from "@/types/kanban";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BoardItem } from "@/types/kanban";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: BoardItem | null;
  defaultStatus?: TaskStatus;
  onSave: (data: any) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultStatus = TaskStatus.TODO,
  onSave,
  onDelete,
}: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [assignee, setAssignee] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || "");
        setStatus(task.status);
        setAssignee(task.assignee || "");
      } else {
        setTitle("");
        setDescription("");
        setStatus(defaultStatus);
        setAssignee("");
      }
    }
  }, [open, task, defaultStatus]);

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsLoading(true);
    try {
      await onSave({
        title,
        description: description || null,
        status,
        assignee: assignee || null,
        // dueDate can be added later with a date picker
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !onDelete) return;
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      setIsLoading(true);
      try {
        await onDelete(task.id);
        onOpenChange(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais (opcional)"
              disabled={isLoading}
              className="resize-none h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatus)}
                disabled={isLoading}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.TODO}>A Fazer</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>Em Andamento</SelectItem>
                  <SelectItem value={TaskStatus.DONE}>Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignee">Responsável</Label>
              <Input
                id="assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Nome"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex items-center sm:justify-between">
          {task && onDelete ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Excluir
            </Button>
          ) : (
            <div /> // Placeholder for space-between to work nicely
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={isLoading || !title.trim()}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
