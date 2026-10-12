import { Metadata } from "next";
import { getTasks } from "@/actions/tasks";
import prisma from "@/lib/prisma";
import { MadrinhaCard } from "@/components/admin/madrinha-card";
import { TasksBoard, type Filter } from "@/components/tarefas/tasks-board";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { getWeddingIdentity } from "@/lib/wedding";
import { daysUntil } from "@/lib/wedding-format";
import { RSVP_PENDING_ACTION, RSVP_PENDING_HREF, rsvpPendingTipText } from "@/lib/liz-tips";
import { notGiftOnlyWhere } from "@/lib/guest-origin";

export const metadata: Metadata = {
  title: "Tarefas",
  description: "Acompanhe o que falta fazer até o grande dia",
};

export const dynamic = "force-dynamic";

const SP = "America/Sao_Paulo";
const FILTROS: Record<string, Filter> = { abertas: "abertas", atrasadas: "atrasadas", concluidas: "concluidas" };

export default async function PendenciasPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { weddingId } = await requireWeddingPage("/pendencias");
  const { filtro } = await searchParams;

  const [{ data: tasks, success }, identity] = await Promise.all([getTasks(), getWeddingIdentity()]);

  if (!success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-tinta-suave">
        <p>Algo deu errado do nosso lado ao carregar as tarefas. Tente de novo em instantes.</p>
      </div>
    );
  }

  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: SP }).format(new Date());
  const daysLeft = identity.weddingDate ? daysUntil(identity.weddingDate) : null;

  // Sugestão da Liz por regras, com os dados reais do casamento (sem IA)
  const overdue = (tasks ?? []).filter((t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate).toISOString().slice(0, 10) < todayKey).length;
  let suggestion: React.ReactNode = null;
  if (overdue > 0) {
    suggestion = (
      <MadrinhaCard
        id="tarefas-atrasadas"
        text={`${overdue === 1 ? "Uma tarefa passou do prazo" : `${overdue} tarefas passaram do prazo`}. Rever as datas ou marcar o que já foi feito mantém a lista fiel ao que falta.`}
        actionLabel={overdue === 1 ? "Ver a atrasada" : `Ver as ${overdue} atrasadas`}
        actionHref="/pendencias?filtro=atrasadas"
      />
    );
  } else {
    const [pending, settings] = await Promise.all([
      prisma.guest.count({ where: { weddingId, rsvpStatus: "PENDING", ...notGiftOnlyWhere } }),
      prisma.systemSettings.findUnique({ where: { weddingId }, select: { rsvpDeadline: true } }),
    ]);
    if (pending > 0) {
      suggestion = (
        <MadrinhaCard
          id="rsvp-sem-resposta"
          text={rsvpPendingTipText({
            pending,
            deadlineKey: settings?.rsvpDeadline ? settings.rsvpDeadline.toISOString().slice(0, 10) : null,
            todayKey,
            weddingDays: daysLeft !== null && daysLeft >= 0 ? daysLeft : null,
          })}
          actionLabel={RSVP_PENDING_ACTION}
          actionHref={RSVP_PENDING_HREF}
        />
      );
    }
  }

  return <TasksBoard initialTasks={tasks ?? []} todayKey={todayKey} daysLeft={daysLeft} initialFilter={FILTROS[filtro ?? ""] ?? "abertas"} suggestion={suggestion} />;
}
