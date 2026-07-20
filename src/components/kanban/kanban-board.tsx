"use client";

import { useState, useMemo } from "react";
import { BoardItem, TaskStatus } from "@/types/kanban";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { KanbanTask } from "./kanban-task";
import { TaskDialog } from "./task-dialog";
import {
  createTask,
  deleteTask,
  updateTask,
  updateTaskStatus,
} from "@/actions/tasks";

interface KanbanBoardProps {
  initialTasks: BoardItem[];
}

export function KanbanBoard({ initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<BoardItem[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<BoardItem | null>(null);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<BoardItem | null>(null);
  const [dialogDefaultStatus, setDialogDefaultStatus] = useState<TaskStatus>(
    TaskStatus.TODO,
  );

  const columns = useMemo(() => {
    return [
      { id: TaskStatus.TODO, title: "A Fazer" },
      { id: TaskStatus.IN_PROGRESS, title: "Em Andamento" },
      { id: TaskStatus.DONE, title: "Concluído" },
    ];
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    const activeTaskData = tasks.find((t) => t.id === activeId);
    if (!activeTaskData) return;

    const newStatus = isOverColumn
      ? (overId as TaskStatus)
      : over.data.current?.task?.status;
    // Dropping a Task over another Task
    if (isActiveTask && isOverTask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          // Changed column
          const newTasks = [...tasks];
          newTasks[activeIndex].status = tasks[overIndex].status;
          return arrayMove(newTasks, activeIndex, overIndex);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Dropping a Task over an empty Column
    if (isActiveTask && isOverColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const newTasks = [...tasks];
        newTasks[activeIndex].status = overId as TaskStatus;
        return arrayMove(newTasks, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTaskData = tasks.find((t) => t.id === activeId);
    if (!activeTaskData) return;

    const isOverColumn = over.data.current?.type === "Column";
    const newStatus = isOverColumn
      ? (overId as TaskStatus)
      : over.data.current?.task?.status;

    if (!newStatus) return;

    // Optimistic reorder already happened in DragOver, now save to DB
    // Calculate new position based on neighbors
    const tasksInColumn = tasks.filter((t) => t.status === newStatus);
    const activeIndexInColumn = tasksInColumn.findIndex(
      (t) => t.id === activeId,
    );

    let newPosition = 1024;
    if (tasksInColumn.length > 1) {
      if (activeIndexInColumn === 0) {
        newPosition = tasksInColumn[1].position / 2;
      } else if (activeIndexInColumn === tasksInColumn.length - 1) {
        newPosition = tasksInColumn[tasksInColumn.length - 2].position + 1024;
      } else {
        const prevTask = tasksInColumn[activeIndexInColumn - 1];
        const nextTask = tasksInColumn[activeIndexInColumn + 1];
        newPosition = (prevTask.position + nextTask.position) / 2;
      }
    }

    // Update local state with the exact position to avoid jumps on refetch
    setTasks((current) =>
      current.map((t) =>
        t.id === activeId
          ? { ...t, status: newStatus, position: newPosition }
          : t,
      ),
    );

    // Call server action
    await updateTaskStatus(
      activeId,
      newStatus,
      newPosition,
      activeTaskData.type,
    );
  };

  // Dialog Handlers
  const handleAddTask = (status: TaskStatus) => {
    setDialogDefaultStatus(status);
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: BoardItem) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleSaveDialog = async (data: any) => {
    if (editingTask) {
      const res = await updateTask(editingTask.id, data);
      if (res.success && res.data) {
        const updated: BoardItem = { ...res.data, type: "MANUAL" };
        setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
      }
    } else {
      const res = await createTask(data);
      if (res.success && res.data) {
        const created: BoardItem = { ...res.data, type: "MANUAL" };
        setTasks([...tasks, created]);
      }
    }
  };

  const handleDeleteDialog = async (taskId: string) => {
    const res = await deleteTask(taskId);
    if (res.success) {
      setTasks(tasks.filter((t) => t.id !== taskId));
    }
  };

  const [filter, setFilter] = useState<"ALL" | "MANUAL" | "HONEYMOON">("ALL");

  const filteredTasks = useMemo(() => {
    if (filter === "ALL") return tasks;
    return tasks.filter((t) => t.type === filter);
  }, [tasks, filter]);

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Pendências
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Gerencie tarefas e integre pendências de outros módulos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200 shadow-inner">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === "ALL" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter("MANUAL")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === "MANUAL" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              Tarefas Manuais
            </button>
            <button
              onClick={() => setFilter("HONEYMOON")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === "HONEYMOON" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              Lua de Mel
            </button>
          </div>
          <button
            onClick={() => handleAddTask(TaskStatus.TODO)}
            className="bg-zinc-900 text-zinc-50 hover:bg-zinc-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            Nova Tarefa
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full items-start">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                columnId={col.id}
                title={col.title}
                tasks={filteredTasks.filter((t) => t.status === col.id)}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <KanbanTask task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={editingTask}
        defaultStatus={dialogDefaultStatus}
        onSave={handleSaveDialog}
        onDelete={handleDeleteDialog}
      />
    </div>
  );
}
