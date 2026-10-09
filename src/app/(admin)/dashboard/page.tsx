// src/app/(admin)/dashboard/page.tsx
import Link from "next/link";
import { format, formatDistanceToNow, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight,
  CalendarHeart,
  CheckSquare,
  Gift,
  MessageCircle,
  QrCode,
  Receipt,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { getWeddingIdentity } from "@/lib/wedding";
import { daysUntil } from "@/lib/wedding-format";
import { PageHeader } from "@/components/admin/page-header";
import { Reveal } from "@/components/motion/reveal";

export const dynamic = "force-dynamic";

export const metadata = { title: "Início" };

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (cents: number) => brl.format(cents / 100);

interface Alert {
  id: string;
  text: string;
  action: string;
  href: string;
  icon: LucideIcon;
  tone: "warning" | "info";
}

function Section({ title, href, linkLabel, children, delay = 0 }: { title: string; href?: string; linkLabel?: string; children: React.ReactNode; delay?: number }) {
  return (
    <Reveal as="section" delay={delay} className="lift flex min-w-0 flex-col gap-4 rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-tinta">{title}</h2>
        {href && (
          <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ameixa hover:underline">
            {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </Reveal>
  );
}

export default async function DashboardPage() {
  const { weddingId } = await requireWeddingPage("/dashboard");
  const wedding = await getWeddingIdentity();
  const today = startOfDay(new Date());

  const [guests, tasks, expenses, approvedGifts, pendingPix] = await Promise.all([
    prisma.guest.findMany({
      where: { weddingId },
      select: { rsvpStatus: true, allowedCompanions: true, confirmedCompanions: true, phone: true, hasReceivedMessage: true },
    }),
    prisma.task.findMany({
      where: { weddingId },
      select: { id: true, title: true, status: true, dueDate: true },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { position: "asc" }],
    }),
    prisma.expense.findMany({
      where: { weddingId },
      select: { id: true, description: true, amount: true, status: true, dueDate: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.transaction.findMany({
      where: { weddingId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, netAmount: true, amount: true, guestName: true, createdAt: true, gift: { select: { title: true } } },
    }),
    prisma.transaction.count({ where: { weddingId, status: "PENDING", paymentMethod: "PIX" } }),
  ]);

  // Convidados
  const invites = guests.length;
  const confirmed = guests.filter((g) => g.rsvpStatus === "CONFIRMED");
  const declined = guests.filter((g) => g.rsvpStatus === "DECLINED").length;
  const pending = guests.filter((g) => g.rsvpStatus === "PENDING").length;
  const peopleConfirmed = confirmed.reduce((acc, g) => acc + 1 + (g.confirmedCompanions || 0), 0);
  const peopleInvited = guests.reduce((acc, g) => acc + 1 + (g.allowedCompanions || 0), 0);
  const notInvitedYet = guests.filter((g) => g.phone && !g.hasReceivedMessage).length;
  const pct = (n: number) => (invites ? Math.round((n / invites) * 100) : 0);

  // Tarefas
  const openTasks = tasks.filter((t) => t.status !== "DONE");
  const doneTasks = tasks.length - openTasks.length;
  const taskProgress = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const nextTasks = openTasks.slice(0, 4);

  // Dinheiro
  const giftsReceived = approvedGifts.reduce((acc, t) => acc + (t.netAmount ?? t.amount), 0);
  const expensesTotal = expenses.reduce((acc, e) => acc + e.amount, 0);
  const expensesPaid = expenses.filter((e) => e.status === "PAID").reduce((acc, e) => acc + e.amount, 0);
  const paidProgress = expensesTotal ? Math.round((expensesPaid / expensesTotal) * 100) : 0;
  const upcomingExpenses = expenses.filter((e) => e.status !== "PAID").slice(0, 3);
  const overdue = expenses.filter((e) => e.status !== "PAID" && isBefore(new Date(e.dueDate), today)).length;

  const days = wedding.weddingDate ? daysUntil(wedding.weddingDate) : null;

  const alerts: Alert[] = [];
  if (!wedding.weddingDate)
    alerts.push({ id: "date", text: "Defina a data do casamento para liberar a contagem regressiva.", action: "Definir data", href: "/site-builder", icon: CalendarHeart, tone: "info" });
  if (pendingPix > 0)
    alerts.push({ id: "pix", text: `${pendingPix} Pix de presente aguardando sua conferência.`, action: "Conferir", href: "/financas", icon: Gift, tone: "warning" });
  if (overdue > 0)
    alerts.push({ id: "overdue", text: `${overdue} despesa(s) com vencimento atrasado.`, action: "Ver despesas", href: "/financas", icon: Receipt, tone: "warning" });
  if (notInvitedYet > 0)
    alerts.push({ id: "invites", text: `${notInvitedYet} convidado(s) com telefone ainda não receberam o convite.`, action: "Enviar convites", href: "/mensagens", icon: MessageCircle, tone: "info" });
  if (pending > 0 && notInvitedYet < invites)
    alerts.push({ id: "rsvp", text: `${pending} convite(s) sem resposta de presença.`, action: "Enviar lembrete", href: "/mensagens", icon: Users, tone: "info" });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Olá, ${wedding.coupleNames}`}
        eyebrow={format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        description="O que está andando e o que precisa de vocês agora."
        actions={
          <Link
            href="/convidados"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-linha-forte bg-papel px-4 text-sm font-semibold text-tinta transition-colors hover:bg-ameixa-suave"
          >
            <Users className="h-4 w-4" aria-hidden="true" /> Convidados
          </Link>
        }
      />

      {/* Contagem regressiva */}
      <Reveal as="section" variant="scale" className="relative flex flex-col gap-6 overflow-hidden rounded-3xl bg-ameixa p-6 text-on-ameixa shadow-[var(--shadow-aceito-2)] sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div aria-hidden="true" className="arch pointer-events-none absolute -right-10 top-6 hidden h-[260px] w-[200px] border border-champanhe/60 sm:block" />
        <div aria-hidden="true" className="arch pointer-events-none absolute -right-2 top-14 hidden h-[200px] w-[140px] border border-champanhe/40 sm:block" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-on-ameixa">
            {days === null ? "Data a definir" : days > 0 ? "Faltam" : days === 0 ? "É hoje" : "Casamento realizado"}
          </p>
          {days !== null && days > 0 && (
            <p className="mt-1 font-display text-7xl leading-none tabular-nums">
              {days} <span className="font-display text-3xl italic">{days === 1 ? "dia" : "dias"}</span>
            </p>
          )}
          <p className="mt-3 text-[15px] text-on-ameixa">
            {[wedding.dateLabel, wedding.locationName].filter(Boolean).join(" · ") || "Informe a data e o local no editor do site."}
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="font-semibold">Tarefas concluídas</span>
            <span className="tabular-nums text-on-ameixa">
              {doneTasks} de {tasks.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-papel/25" role="progressbar" aria-valuenow={taskProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Tarefas concluídas">
            <div className="h-full rounded-full bg-papel" style={{ width: `${taskProgress}%` }} />
          </div>
        </div>
      </Reveal>

      {/* Alertas acionáveis */}
      {alerts.length > 0 && (
        <section aria-labelledby="alertas" className="flex flex-col gap-2">
          <h2 id="alertas" className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">
            Precisa da atenção de vocês
          </h2>
          <ul className="grid gap-2 lg:grid-cols-2">
            {alerts.map((a, i) => {
              const Icon = a.icon;
              return (
                <Reveal
                  as="li"
                  delay={i * 80}
                  key={a.id}
                  className={`flex items-center gap-3 rounded-2xl border p-3 ${a.tone === "warning" ? "border-aviso/30 bg-aviso-suave" : "border-linha bg-papel"}`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.tone === "warning" ? "bg-papel text-aviso" : "bg-ameixa-suave text-ameixa"}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="min-w-0 flex-1 text-sm text-tinta">{a.text}</p>
                  <Link href={a.href} className="inline-flex min-h-11 shrink-0 items-center rounded-xl px-3 text-sm font-semibold text-ameixa hover:bg-ameixa-suave">
                    {a.action}
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Confirmações */}
        <Section title="Confirmações de presença" href="/convidados" linkLabel="Ver lista" delay={0}>
          {invites === 0 ? (
            <p className="text-sm text-tinta-suave">
              Nenhum convidado cadastrado ainda.{" "}
              <Link href="/convidados" className="font-semibold text-ameixa hover:underline">
                Adicionar convidados
              </Link>
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-[40px] leading-none tabular-nums text-tinta">{peopleConfirmed}</span>
                <span className="text-sm text-tinta-suave">
                  pessoas confirmadas de até {peopleInvited} convidadas (com acompanhantes)
                </span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-areia" aria-hidden="true">
                <div className="bg-sucesso transition-[width] duration-1000" style={{ width: `${pct(confirmed.length)}%` }} />
                <div className="bg-perigo/70" style={{ width: `${pct(declined)}%` }} />
              </div>
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="flex items-center gap-1.5 text-tinta-suave">
                    <span className="h-2.5 w-2.5 rounded-full bg-sucesso" aria-hidden="true" /> Confirmaram
                  </dt>
                  <dd className="font-semibold tabular-nums text-tinta">{confirmed.length} convites</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-tinta-suave">
                    <span className="h-2.5 w-2.5 rounded-full bg-perigo/70" aria-hidden="true" /> Não vão
                  </dt>
                  <dd className="font-semibold tabular-nums text-tinta">{declined} convites</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-tinta-suave">
                    <span className="h-2.5 w-2.5 rounded-full bg-areia ring-1 ring-linha-forte" aria-hidden="true" /> Sem resposta
                  </dt>
                  <dd className="font-semibold tabular-nums text-tinta">{pending} convites</dd>
                </div>
              </dl>
            </>
          )}
        </Section>

        {/* Próximas tarefas */}
        <Section title="Próximas tarefas" href="/pendencias" linkLabel="Todas as tarefas" delay={80}>
          {nextTasks.length === 0 ? (
            <p className="text-sm text-tinta-suave">Nenhuma tarefa em aberto.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-linha">
              {nextTasks.map((t) => {
                const late = t.dueDate && isBefore(new Date(t.dueDate), today);
                return (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <CheckSquare className="h-4 w-4 shrink-0 text-tinta-suave" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm text-tinta">{t.title}</span>
                    <span className={`shrink-0 text-xs font-semibold ${late ? "text-perigo" : "text-tinta-suave"}`}>
                      {t.dueDate ? format(new Date(t.dueDate), "dd/MM", { locale: ptBR }) : t.status === "IN_PROGRESS" ? "Em andamento" : "Sem prazo"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* Dinheiro */}
        <Section title="Despesas" href="/financas" linkLabel="Ver finanças" delay={0}>
          {expensesTotal === 0 ? (
            <p className="text-sm text-tinta-suave">Nenhuma despesa registrada ainda.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-[40px] leading-none tabular-nums text-tinta">{money(expensesPaid)}</span>
                <span className="text-sm text-tinta-suave">pagos de {money(expensesTotal)} contratados</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-areia" role="progressbar" aria-valuenow={paidProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Despesas pagas">
                <div className="h-full rounded-full bg-ameixa" style={{ width: `${paidProgress}%` }} />
              </div>
              {upcomingExpenses.length > 0 && (
                <ul className="flex flex-col divide-y divide-linha">
                  {upcomingExpenses.map((e) => {
                    const late = isBefore(new Date(e.dueDate), today);
                    return (
                      <li key={e.id} className="flex items-center gap-3 py-2.5 text-sm">
                        <Wallet className="h-4 w-4 shrink-0 text-tinta-suave" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-tinta">{e.description}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-tinta">{money(e.amount)}</span>
                        <span className={`w-12 shrink-0 text-right text-xs font-semibold ${late ? "text-perigo" : "text-tinta-suave"}`}>
                          {format(new Date(e.dueDate), "dd/MM", { locale: ptBR })}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </Section>

        {/* Presentes */}
        <Section title="Presentes recebidos" href="/presentes-admin" linkLabel="Lista de presentes" delay={80}>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-[40px] leading-none tabular-nums text-tinta">{money(giftsReceived)}</span>
            <span className="text-sm text-tinta-suave">
              em {approvedGifts.length} {approvedGifts.length === 1 ? "presente" : "presentes"}
            </span>
          </div>
          {approvedGifts.length === 0 ? (
            <p className="text-sm text-tinta-suave">Quando um convidado presentear, ele aparece aqui.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-linha">
              {approvedGifts.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <Gift className="h-4 w-4 shrink-0 text-tinta-suave" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-tinta">{t.gift.title}</p>
                    <p className="truncate text-xs text-tinta-suave">
                      {t.guestName || "Convidado"} · {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-tinta">{money(t.netAmount ?? t.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {days !== null && days <= 7 && days >= 0 && (
        <Link
          href="/credenciamento"
          className="lift flex items-center justify-between gap-4 rounded-2xl border border-ameixa/30 bg-ameixa-suave p-5 text-tinta"
        >
          <span className="flex items-center gap-3">
            <QrCode className="h-6 w-6 text-ameixa" aria-hidden="true" />
            <span>
              <span className="block font-semibold">Check-in no dia</span>
              <span className="text-sm text-tinta-suave">Abra o leitor de QR Code na entrada do evento.</span>
            </span>
          </span>
          <ArrowRight className="h-5 w-5 text-ameixa" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
