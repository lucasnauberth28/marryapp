import { Metadata } from "next";
import { getTasks } from "@/actions/tasks";
import prisma from "@/lib/prisma";
import { MadrinhaCard } from "@/components/admin/madrinha-card";
import { TasksBoard, type Filter } from "@/components/tarefas/tasks-board";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { obterIdentidadeDoCasamentoPrincipal } from "@/lib/wedding";
import { diasAte } from "@/lib/wedding-format";
import { ACAO_DAS_CONFIRMACOES_PENDENTES, LINK_DAS_CONFIRMACOES_PENDENTES, textoDaDicaDeConfirmacaoPendente, dicaDeConfirmacaoUrgente } from "@/lib/liz-tips";
import { poseDaDicaDaLiz } from "@/lib/liz/pose";
import { filtroSemSoPresente } from "@/lib/guest-origin";

export const metadata: Metadata = {
  title: "Tarefas",
  description: "Acompanhe o que falta fazer até o grande dia",
};

export const dynamic = "force-dynamic";

const SP = "America/Sao_Paulo";
const FILTROS: Record<string, Filter> = { abertas: "abertas", atrasadas: "atrasadas", concluidas: "concluidas" };

export default async function PendenciasPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { weddingId } = await exigirCasamentoNaPagina("/pendencias");
  const { filtro } = await searchParams;

  const [{ data: tasks, success }, identity] = await Promise.all([getTasks(), obterIdentidadeDoCasamentoPrincipal()]);

  if (!success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-tinta-suave">
        <p>Algo deu errado do nosso lado ao carregar as tarefas. Tente de novo em instantes.</p>
      </div>
    );
  }

  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: SP }).format(new Date());
  const daysLeft = identity.weddingDate ? diasAte(identity.weddingDate) : null;

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
        pose={poseDaDicaDaLiz({ urgent: true })}
      />
    );
  } else {
    const [pending, settings] = await Promise.all([
      prisma.guest.count({ where: { weddingId, rsvpStatus: "PENDING", ...filtroSemSoPresente } }),
      prisma.systemSettings.findUnique({ where: { weddingId }, select: { rsvpDeadline: true } }),
    ]);
    if (pending > 0) {
      const when = {
        deadlineKey: settings?.rsvpDeadline ? settings.rsvpDeadline.toISOString().slice(0, 10) : null,
        todayKey,
        weddingDays: daysLeft !== null && daysLeft >= 0 ? daysLeft : null,
      };
      suggestion = (
        <MadrinhaCard
          id="rsvp-sem-resposta"
          text={textoDaDicaDeConfirmacaoPendente({ pending, ...when })}
          actionLabel={ACAO_DAS_CONFIRMACOES_PENDENTES}
          actionHref={LINK_DAS_CONFIRMACOES_PENDENTES}
          pose={poseDaDicaDaLiz({ urgent: dicaDeConfirmacaoUrgente(when) })}
        />
      );
    }
  }

  return <TasksBoard initialTasks={tasks ?? []} todayKey={todayKey} daysLeft={daysLeft} initialFilter={FILTROS[filtro ?? ""] ?? "abertas"} suggestion={suggestion} />;
}
