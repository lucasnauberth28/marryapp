import prisma from "@/lib/prisma";
import { CartaoDaMadrinha } from "@/components/admin/madrinha-card";
import { ACAO_DAS_CONFIRMACOES_PENDENTES, LINK_DAS_CONFIRMACOES_PENDENTES, dicaDeConfirmacaoUrgente, textoDaDicaDeConfirmacaoPendente } from "@/lib/liz-tips";
import { poseDaDicaDaLiz } from "@/lib/liz/pose";
import { filtroSemSoPresente } from "@/lib/convidados/guest-origin";

function SugestaoDeTarefasAtrasadas({ overdue }: { overdue: number }) {
  return (
    <CartaoDaMadrinha
      id="tarefas-atrasadas"
      text={`${overdue === 1 ? "Uma tarefa passou do prazo" : `${overdue} tarefas passaram do prazo`}. Rever as datas ou marcar o que já foi feito mantém a lista fiel ao que falta.`}
      actionLabel={overdue === 1 ? "Ver a atrasada" : `Ver as ${overdue} atrasadas`}
      actionHref="/pendencias?filtro=atrasadas"
      pose={poseDaDicaDaLiz({ urgent: true })}
    />
  );
}

/** Sugestão da Liz por regras, com os dados reais do casamento (sem IA): tarefas atrasadas primeiro, depois quem não respondeu. */
export async function sugestaoDaLiz({ weddingId, overdue, todayKey, daysLeft }: { weddingId: string; overdue: number; todayKey: string; daysLeft: number | null }) {
  if (overdue > 0) return <SugestaoDeTarefasAtrasadas overdue={overdue} />;
  const [pending, settings] = await Promise.all([
    prisma.guest.count({ where: { weddingId, rsvpStatus: "PENDING", ...filtroSemSoPresente } }),
    prisma.systemSettings.findUnique({ where: { weddingId }, select: { rsvpDeadline: true } }),
  ]);
  if (pending === 0) return null;
  const when = {
    deadlineKey: settings?.rsvpDeadline ? settings.rsvpDeadline.toISOString().slice(0, 10) : null,
    todayKey,
    weddingDays: daysLeft !== null && daysLeft >= 0 ? daysLeft : null,
  };
  return (
    <CartaoDaMadrinha
      id="rsvp-sem-resposta"
      text={textoDaDicaDeConfirmacaoPendente({ pending, ...when })}
      actionLabel={ACAO_DAS_CONFIRMACOES_PENDENTES}
      actionHref={LINK_DAS_CONFIRMACOES_PENDENTES}
      pose={poseDaDicaDaLiz({ urgent: dicaDeConfirmacaoUrgente(when) })}
    />
  );
}
