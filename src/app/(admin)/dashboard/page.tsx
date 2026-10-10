// src/app/(admin)/dashboard/page.tsx
import Link from "next/link";
import { format, formatDistanceToNowStrict, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarHeart,
  Check,
  ChevronRight,
  Gift,
  QrCode,
  Receipt,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { getAccountView, getWeddingIdentity } from "@/lib/wedding";
import { daysLeftLabel, daysUntil, greetingForHour } from "@/lib/wedding-format";
import { weddingSitePath } from "@/lib/wedding-links";
import { PageHeader, OVERLINE_CLASS } from "@/components/admin/page-header";
import { MadrinhaCard } from "@/components/admin/madrinha-card";
import { Badge } from "@/components/ui/badge";
import { btn } from "@/components/landing/styles";
import { Seal } from "@/components/landing/seal";
import { NextSteps, type NextStep } from "./next-steps";

export const dynamic = "force-dynamic";

export const metadata = { title: "Início" };

const SP = "America/Sao_Paulo";
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlWhole = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
/** "R$ 4.870" quando o valor é redondo; com centavos quando não é. */
const money = (cents: number) => (cents % 100 === 0 ? brlWhole : brl).format(cents / 100);

interface Notice {
  id: string;
  text: string;
  action: string;
  href: string;
  icon: LucideIcon;
  tone: "warning" | "info";
}

interface Tip {
  id: string;
  text: string;
  action: string;
  href: string;
}

const people = (n: number) => `${n} ${n === 1 ? "pessoa" : "pessoas"}`;

function Card({ title, link, children, className = "" }: { title: string; link?: { href: string; label: string }; children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex min-w-0 flex-col rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)] md:p-6 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="min-w-0 text-lg font-semibold leading-7 text-tinta md:text-xl">{title}</h2>
        {link && (
          <Link href={link.href} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-ameixa hover:underline">
            {link.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Cartão-resumo inteiro clicável: sobretítulo, número em fonte display e uma linha de apoio. */
function SummaryCard({ href, label, className = "", children }: { href: string; label: string; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-col gap-2.5 rounded-2xl border border-linha bg-papel p-4 text-tinta shadow-[var(--shadow-aceito-1)] transition-colors hover:border-linha-forte md:gap-3 md:p-6 ${className}`}
    >
      <div className="flex items-baseline justify-between">
        <p className={OVERLINE_CLASS}>{label}</p>
        <ChevronRight className="h-4 w-4 text-tinta-suave md:hidden" aria-hidden="true" />
      </div>
      {children}
    </Link>
  );
}

const bigNumber = "font-display text-[24px] leading-8 tabular-nums md:text-[40px] md:leading-[44px]";

export default async function DashboardPage() {
  const { weddingId } = await requireWeddingPage("/dashboard");
  const [wedding, account] = await Promise.all([getWeddingIdentity(), getAccountView()]);
  const now = new Date();
  const today = startOfDay(now);

  const [guests, tasks, taskCount, expenses, approvedGifts, pendingPix, settings, wallet, recent] = await Promise.all([
    prisma.guest.findMany({
      where: { weddingId },
      select: { rsvpStatus: true, allowedCompanions: true, confirmedCompanions: true, phone: true, hasReceivedMessage: true },
    }),
    prisma.task.findMany({
      where: { weddingId, status: { not: "DONE" } },
      select: { id: true, title: true, status: true, dueDate: true },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { position: "asc" }],
    }),
    prisma.task.count({ where: { weddingId } }),
    prisma.expense.findMany({
      where: { weddingId },
      select: { amount: true, status: true, dueDate: true },
    }),
    prisma.transaction.findMany({
      where: { weddingId, status: "APPROVED" },
      select: { netAmount: true, amount: true },
    }),
    prisma.transaction.count({ where: { weddingId, status: "PENDING", paymentMethod: "PIX" } }),
    prisma.systemSettings.findUnique({ where: { weddingId }, select: { rsvpDeadline: true } }),
    prisma.walletBalance.findUnique({ where: { weddingId }, select: { balance: true } }),
    // Quem respondeu por último (a data é a da última alteração do convite)
    prisma.guest.findMany({
      where: { weddingId, rsvpStatus: { not: "PENDING" } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, name: true, rsvpStatus: true, allowedCompanions: true, confirmedCompanions: true, updatedAt: true },
    }),
  ]);

  // Convidados (em pessoas, com acompanhantes)
  const invites = guests.length;
  const confirmedPeople = guests.filter((g) => g.rsvpStatus === "CONFIRMED").reduce((acc, g) => acc + 1 + g.confirmedCompanions, 0);
  const declinedPeople = guests.filter((g) => g.rsvpStatus === "DECLINED").reduce((acc, g) => acc + 1 + g.allowedCompanions, 0);
  const pendingPeople = guests.filter((g) => g.rsvpStatus === "PENDING").reduce((acc, g) => acc + 1 + g.allowedCompanions, 0);
  const totalPeople = confirmedPeople + declinedPeople + pendingPeople;
  const peoplePct = (n: number) => (totalPeople ? Math.round((n / totalPeople) * 100) : 0);
  // Convites (um por convidado) que já foram enviados e ainda não têm resposta, e os que nem foram enviados
  const awaitingReply = guests.filter((g) => g.rsvpStatus === "PENDING" && g.hasReceivedMessage).length;
  const notInvitedYet = guests.filter((g) => g.phone && !g.hasReceivedMessage).length;

  // Dinheiro
  const giftsReceived = approvedGifts.reduce((acc, t) => acc + (t.netAmount ?? t.amount), 0);
  const expensesTotal = expenses.reduce((acc, e) => acc + e.amount, 0);
  const expensesPaid = expenses.filter((e) => e.status === "PAID").reduce((acc, e) => acc + e.amount, 0);
  const paidPct = expensesTotal ? Math.round((expensesPaid / expensesTotal) * 100) : 0;
  const overdue = expenses.filter((e) => e.status !== "PAID" && isBefore(new Date(e.dueDate), today)).length;
  const walletBalance = wallet?.balance ?? 0;

  const days = wedding.weddingDate ? daysUntil(wedding.weddingDate) : null;
  const daysLeft = daysLeftLabel(days);

  // Próximos passos: tarefas abertas, com o prazo em chip
  const steps: NextStep[] = tasks.slice(0, 5).map((t) => {
    const due = t.dueDate ? new Date(t.dueDate) : null;
    if (due && isBefore(due, today)) return { id: t.id, title: t.title, dueLabel: "Atrasada", tone: "perigo" };
    if (due) {
      const soon = daysUntil(due) <= 14;
      return { id: t.id, title: t.title, dueLabel: `Até ${format(due, "d MMM", { locale: ptBR })}`, tone: soon ? "aviso" : "neutro" };
    }
    return { id: t.id, title: t.title, dueLabel: t.status === "IN_PROGRESS" ? "Em andamento" : null, tone: "neutro" };
  });

  // Sugestão da Madrinha, por regras e com dado real: respostas atrasadas, convites por enviar, despesa vencida
  const deadline = settings?.rsvpDeadline ? new Date(settings.rsvpDeadline) : null;
  let tip: Tip | null = null;
  if (awaitingReply > 0) {
    const deadlineText = deadline
      ? ` e o prazo ${isBefore(deadline, today) ? "era" : "é"} ${format(deadline, "d 'de' MMMM", { locale: ptBR })}`
      : "";
    tip = {
      id: "rsvp-sem-resposta",
      text: `${awaitingReply} ${awaitingReply === 1 ? "convite ainda não teve resposta" : "convites ainda não tiveram resposta"}${deadlineText}. Quer preparar um lembrete para mandar no WhatsApp?`,
      action: "Preparar lembrete",
      href: "/mensagens",
    };
  } else if (notInvitedYet > 0) {
    tip = {
      id: "convites-por-enviar",
      text: `${notInvitedYet} ${notInvitedYet === 1 ? "convidado com telefone ainda não recebeu o convite" : "convidados com telefone ainda não receberam o convite"}. Quer enviar agora?`,
      action: "Enviar convites",
      href: "/mensagens",
    };
  } else if (overdue > 0) {
    tip = {
      id: "despesa-vencida",
      text: `${overdue === 1 ? "Uma despesa está com o vencimento atrasado" : `${overdue} despesas estão com o vencimento atrasado`}. Vamos conferir?`,
      action: "Ver despesas",
      href: "/financas",
    };
  }

  // Avisos que não cabem na sugestão (e que antes já apareciam aqui)
  const notices: Notice[] = [];
  if (!wedding.weddingDate)
    notices.push({ id: "date", text: "Defina a data do casamento para ver quantos dias faltam.", action: "Definir data", href: "/site-builder", icon: CalendarHeart, tone: "info" });
  if (pendingPix > 0)
    notices.push({
      id: "pix",
      text: `${pendingPix} Pix de presente aguardando sua conferência.`,
      action: "Conferir",
      href: "/financas",
      icon: Gift,
      tone: "warning",
    });
  if (overdue > 0 && tip?.id !== "despesa-vencida")
    notices.push({
      id: "overdue",
      text: `${overdue} ${overdue === 1 ? "despesa com vencimento atrasado" : "despesas com vencimento atrasado"}.`,
      action: "Ver despesas",
      href: "/financas",
      icon: Receipt,
      tone: "warning",
    });
  if (notInvitedYet > 0 && tip?.id === "rsvp-sem-resposta")
    notices.push({
      id: "invites",
      text: `${notInvitedYet} ${notInvitedYet === 1 ? "convidado com telefone ainda não recebeu o convite" : "convidados com telefone ainda não receberam o convite"}.`,
      action: "Enviar convites",
      href: "/mensagens",
      icon: Users,
      tone: "info",
    });

  // Cabeçalho: saudação no fuso do casal; a conta de administração é saudada pelo nome do usuário
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: SP }).format(now));
  const greeting = greetingForHour(hour);
  const who = account.adminView ? account.userName?.trim().split(/\s+/)[0] : wedding.coupleNames;
  const dateText = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: SP }).format(now);

  return (
    <div className="flex flex-col gap-5 md:gap-8">
      <PageHeader
        title={who ? `${greeting}, ${who}` : greeting}
        eyebrow={
          <>
            <span className="md:hidden">{daysLeft ? `${daysLeft[0].toUpperCase()}${daysLeft.slice(1)}` : dateText}</span>
            <span className="hidden md:inline">{dateText}</span>
          </>
        }
        actions={
          <div className="hidden flex-wrap gap-2 md:flex">
            {wedding.slug && (
              <Link href={weddingSitePath(wedding.slug)} target="_blank" className={btn.secondary}>
                Ver o site
              </Link>
            )}
            {invites === 0 ? (
              <Link href="/convidados" className={btn.primary}>
                Adicionar convidados
              </Link>
            ) : (
              <Link href="/mensagens" className={btn.primary}>
                Convidar pelo WhatsApp
              </Link>
            )}
          </div>
        }
      />

      {notices.length > 0 && (
        <ul aria-label="Avisos" className="flex flex-col gap-2">
          {notices.map((n) => {
            const Icon = n.icon;
            const warn = n.tone === "warning";
            return (
              <li key={n.id} className={`flex items-center gap-3 rounded-xl border px-3 py-1 ${warn ? "border-aviso/30 bg-aviso-suave" : "border-linha bg-papel"}`}>
                <Icon className={`h-5 w-5 shrink-0 ${warn ? "text-aviso" : "text-ameixa"}`} aria-hidden="true" />
                <p className="min-w-0 flex-1 py-2 text-[15px] leading-5 text-tinta">{n.text}</p>
                <Link href={n.href} className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-ameixa hover:bg-ameixa-suave">
                  {n.action}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Resumo: confirmações, presentes e orçamento */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <SummaryCard href="/convidados" label="Confirmações" className="col-span-2 md:col-span-1">
          {invites === 0 ? (
            <>
              <p className="font-display text-[22px] leading-7 md:text-[26px] md:leading-8">Sua lista começa aqui</p>
              <p className="text-sm text-tinta-suave">Adicione os convidados para acompanhar quem vai e quem ainda não respondeu.</p>
              <span className="inline-flex min-h-11 items-center text-sm font-semibold text-ameixa">Adicionar convidados</span>
            </>
          ) : (
            <>
              <p>
                <span className="font-display text-[36px] leading-10 tabular-nums md:text-[40px] md:leading-[44px]">{confirmedPeople}</span>{" "}
                <span className="text-tinta-suave">de {totalPeople}</span>
              </p>
              <div className="flex h-2 overflow-hidden rounded-full bg-areia" role="img" aria-label={`${confirmedPeople} confirmadas, ${declinedPeople} não vão e ${pendingPeople} sem resposta, de ${people(totalPeople)}`}>
                <div className="bg-sucesso" style={{ width: `${peoplePct(confirmedPeople)}%` }} />
                <div className="bg-perigo" style={{ width: `${peoplePct(declinedPeople)}%` }} />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-tinta-suave">
                <span className="hidden md:inline">{confirmedPeople} vão</span>
                <span>{declinedPeople} não vão</span>
                <span>{pendingPeople} sem resposta</span>
              </div>
            </>
          )}
        </SummaryCard>

        <SummaryCard href="/presentes-admin" label="Presentes">
          {approvedGifts.length === 0 ? (
            <>
              <p className="font-display text-[20px] leading-6 md:text-[26px] md:leading-8">Nenhum ainda</p>
              <p className="hidden text-sm text-tinta-suave md:block">Quando um convidado presentear, o valor aparece aqui.</p>
            </>
          ) : (
            <>
              <span className={bigNumber}>{money(giftsReceived)}</span>
              <p className="hidden text-sm text-tinta-suave md:block">
                {approvedGifts.length} {approvedGifts.length === 1 ? "presente" : "presentes"}
                {walletBalance > 0 && ` · ${money(walletBalance)} de saldo na carteira`}
              </p>
            </>
          )}
        </SummaryCard>

        <SummaryCard href="/financas" label="Orçamento">
          {expensesTotal === 0 ? (
            <>
              <p className="font-display text-[20px] leading-6 md:text-[26px] md:leading-8">Sem despesas</p>
              <p className="hidden text-sm text-tinta-suave md:block">Anote o que já contrataram para saber quanto falta pagar.</p>
            </>
          ) : (
            <>
              <p>
                <span className={bigNumber}>{paidPct}%</span> <span className="hidden text-tinta-suave md:inline">pago</span>
              </p>
              <div className="hidden h-2 overflow-hidden rounded-full bg-areia md:block" role="img" aria-label={`${paidPct}% das despesas pagas`}>
                <div className="h-full rounded-full bg-ameixa" style={{ width: `${paidPct}%` }} />
              </div>
              <p className="hidden text-sm text-tinta-suave md:block">
                {money(expensesPaid)} de {money(expensesTotal)} em despesas
              </p>
            </>
          )}
        </SummaryCard>
      </div>

      {tip && <MadrinhaCard id={tip.id} text={tip.text} actionLabel={tip.action} actionHref={tip.href} className="md:max-w-none" />}

      <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-2">
        <Card title="Próximos passos">
          {steps.length === 0 ? (
            <div className="flex flex-col items-start gap-1 text-[15px] text-tinta-suave">
              <p>
                {taskCount === 0
                  ? "Anotem o que falta fazer e acompanhem aqui."
                  : "Tudo em dia por aqui. Quando surgir algo novo, aparece neste lugar."}
              </p>
              <Link href="/pendencias" className="inline-flex min-h-11 items-center font-semibold text-ameixa hover:underline">
                Abrir as tarefas
              </Link>
            </div>
          ) : (
            <>
              <NextSteps steps={steps} />
              <Link href="/pendencias" className="mt-1 inline-flex min-h-11 items-center font-semibold text-ameixa hover:underline">
                Ver todas as tarefas
              </Link>
            </>
          )}
        </Card>

        <Card title="Últimas respostas" link={recent.length > 0 ? { href: "/convidados", label: "Ver todas" } : undefined}>
          {recent.length === 0 ? (
            <div className="flex flex-col items-start gap-1 text-[15px] text-tinta-suave">
              <p>{invites === 0 ? "Quando os convidados responderem, você vê aqui quem vai." : "Ainda ninguém respondeu. As respostas aparecem aqui assim que chegarem."}</p>
              <Link href={invites === 0 ? "/convidados" : "/mensagens"} className="inline-flex min-h-11 items-center font-semibold text-ameixa hover:underline">
                {invites === 0 ? "Adicionar convidados" : "Enviar convites"}
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col">
              {recent.map((g) => {
                const yes = g.rsvpStatus === "CONFIRMED";
                const count = yes ? 1 + g.confirmedCompanions : 1 + g.allowedCompanions;
                return (
                  <li key={g.id} className="flex min-h-14 items-center gap-3 border-b border-linha py-2 last:border-b-0">
                    {yes ? (
                      <Seal size="sm" />
                    ) : (
                      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-areia text-sm font-semibold text-tinta">
                        {initialsOf(g.name)}
                      </span>
                    )}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate font-semibold text-tinta">{g.name}</strong>
                      <span className="text-sm text-tinta-suave">
                        {people(count)} · {formatDistanceToNowStrict(g.updatedAt, { addSuffix: true, locale: ptBR })}
                      </span>
                    </span>
                    {yes ? (
                      <Badge variant="sucesso" className="shrink-0">
                        <Check aria-hidden="true" />
                        Confirmado
                      </Badge>
                    ) : (
                      <Badge variant="perigo" className="shrink-0">
                        <X aria-hidden="true" />
                        Não vai
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {days !== null && days <= 7 && days >= 0 && (
        <Link href="/credenciamento" className="flex items-center justify-between gap-4 rounded-2xl border border-ameixa/30 bg-ameixa-suave p-5 text-tinta">
          <span className="flex items-center gap-3">
            <QrCode className="h-6 w-6 text-ameixa" aria-hidden="true" />
            <span>
              <span className="block font-semibold">Check-in no dia</span>
              <span className="text-sm text-tinta-suave">Abra o leitor de QR Code na entrada do evento.</span>
            </span>
          </span>
          <ChevronRight className="h-5 w-5 text-ameixa" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/** Duas iniciais do nome ("João Pedro Lima" -> "JP"). */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[1][0] : "")).toUpperCase();
}
