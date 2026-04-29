import { Metadata } from "next";
import { getTasks } from "@/actions/tasks";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export const metadata: Metadata = {
  title: "Pendências | MarryApp",
  description: "Gerencie as tarefas do seu casamento",
};

export default async function PendenciasPage() {
  const { data: tasks, success } = await getTasks();

  if (!success) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
        <p>Ocorreu um erro ao carregar as pendências.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full p-8 pt-6">
      <KanbanBoard initialTasks={tasks || []} />
    </div>
  );
}
