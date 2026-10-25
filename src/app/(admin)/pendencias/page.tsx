import { Metadata } from "next";
import { obterTarefas } from "@/actions/tasks";
import { QuadroDeTarefas, type FiltroDeTarefas } from "@/components/tarefas/tasks-board";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { obterIdentidadeDoCasamentoPrincipal } from "@/lib/wedding";
import { diasAte } from "@/lib/wedding-format";
import { sugestaoDaLiz } from "./sugestao-da-liz";

export const metadata: Metadata = {
  title: "Tarefas",
  description: "Acompanhe o que falta fazer até o grande dia",
};

export const dynamic = "force-dynamic";

const FUSO_DE_BRASILIA = "America/Sao_Paulo";
const FILTROS_DA_PAGINA: Record<string, FiltroDeTarefas> = { abertas: "abertas", atrasadas: "atrasadas", concluidas: "concluidas" };

export default async function PendenciasPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { weddingId } = await exigirCasamentoNaPagina("/pendencias");
  const { filtro } = await searchParams;
  const [{ data: tasks, success }, identity] = await Promise.all([obterTarefas(), obterIdentidadeDoCasamentoPrincipal()]);

  if (!success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-tinta-suave">
        <p>Algo deu errado do nosso lado ao carregar as tarefas. Tente de novo em instantes.</p>
      </div>
    );
  }

  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_DE_BRASILIA }).format(new Date());
  const daysLeft = identity.weddingDate ? diasAte(identity.weddingDate) : null;
  const overdue = (tasks ?? []).filter((t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate).toISOString().slice(0, 10) < todayKey).length;
  const suggestion = await sugestaoDaLiz({ weddingId, overdue, todayKey, daysLeft });

  return <QuadroDeTarefas initialTasks={tasks ?? []} todayKey={todayKey} daysLeft={daysLeft} initialFilter={FILTROS_DA_PAGINA[filtro ?? ""] ?? "abertas"} suggestion={suggestion} />;
}
