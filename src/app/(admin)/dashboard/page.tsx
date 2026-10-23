// src/app/(admin)/dashboard/page.tsx
// Resumo do casamento: convite, o que fazer agora, confirmações, dinheiro dos presentes (extrato único) e orçamento.
// Só dados reais do banco; o que ainda não medimos fica de fora (ex.: gráfico de confirmações ao longo do tempo).
import Link from "next/link";
import { ChevronRight, ExternalLink, Gift, LayoutTemplate, QrCode, Upload, UserPlus } from "lucide-react";
import { PaymentStatus, RsvpStatus, TaskStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { getWeddingIdentity } from "@/lib/wedding";
import { daysLeftLabel } from "@/lib/wedding-format";
import { weddingSiteUrl } from "@/lib/wedding-links";
import { hasPathAccess } from "@/lib/permissions";
import { notGiftOnlyWhere } from "@/lib/guest-origin";
import { getWeddingPlan, weddingHasModule } from "@/lib/wedding-plan";
import { decideLizTip } from "@/lib/liz/tip";
import { generalInviteText, personalInviteText, reminderText, whatsappLink } from "@/lib/invite-share";
import {
  buildQueue,
  countGuests,
  dayKeyOf,
  dayLabel,
  daysBetweenKeys,
  deadlineInfo,
  giftFeePlanOf,
  guestsToInvite,
  guestsToRemind,
  inviteReached,
  lastGiftLines,
  seatsOf,
  shortDayLabel,
  SP_TZ,
  summarizeBudget,
  summarizeGifts,
  todayKeyOf,
  type GiftTx,
  type GuestRow,
} from "@/lib/dashboard-summary";
import { btnSecondary } from "./ui";
import { InviteBlock, type InviteRow } from "./invite-block";
import { BudgetBlock, ConfirmationsBlock, QueueBlock, ResponsesBlock, Shortcuts, type Shortcut } from "./blocks";
import { MoneyBlock } from "./money-block";
import { EmptyConfirmations, FirstAccessQueue } from "./first-access";

export const dynamic = "force-dynamic";

export const metadata = { title: "Resumo do casamento" };

const SHOWN_IN_LISTS = 3;
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const seatsText = (n: number) => `${n} ${n === 1 ? "lugar" : "lugares"}`;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function DashboardPage() {
  const ctx = await requireWeddingPage("/dashboard");
  const { weddingId, session, wedding: weddingRow } = ctx;
  const [identity, plan] = await Promise.all([getWeddingIdentity(), getWeddingPlan(weddingId)]);
  const now = new Date();
  const todayKey = todayKeyOf(now);
  const can = (path: string) => hasPathAccess(session.allowedPaths, path);

  const [guestRows, recent, txRows, expenseRows, nextTask, taskCount, tableCount, settings, giftCount, canWhatsApp, canQr, site, unseated] = await Promise.all([
    prisma.guest.findMany({
      where: { weddingId },
      select: { id: true, name: true, phone: true, rsvpStatus: true, category: true, allowedCompanions: true, confirmedCompanions: true, hasReceivedMessage: true, inviteSharedAt: true },
    }),
    // Quem respondeu por último (a hora é a da última alteração do convite: o banco não guarda quando a pessoa respondeu)
    prisma.guest.findMany({
      where: { weddingId, rsvpStatus: { not: RsvpStatus.PENDING } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, name: true, rsvpStatus: true, allowedCompanions: true, confirmedCompanions: true, updatedAt: true },
    }),
    prisma.transaction.findMany({
      where: { weddingId, status: { in: [PaymentStatus.APPROVED, PaymentStatus.PENDING] } },
      select: { id: true, giftId: true, amount: true, netAmount: true, fee: true, paymentMethod: true, status: true, guestName: true, createdAt: true, guest: { select: { name: true } } },
    }),
    prisma.expense.findMany({ where: { weddingId }, select: { id: true, description: true, amount: true, status: true, dueDate: true } }),
    prisma.task.findFirst({
      where: { weddingId, status: { not: TaskStatus.DONE }, dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
      select: { title: true, dueDate: true },
    }),
    prisma.task.count({ where: { weddingId } }),
    prisma.table.count({ where: { weddingId } }),
    prisma.systemSettings.findUnique({ where: { weddingId }, select: { rsvpDeadline: true } }),
    prisma.gift.count({ where: { weddingId } }),
    // O registro de entrada por QR só é sugerido a quem tem o recurso no plano
    weddingHasModule({ weddingId, session }, "whatsapp"),
    weddingHasModule({ weddingId, session }, "qrcode"),
    prisma.siteCustomization.findUnique({ where: { weddingId }, select: { heroImageUrl: true, couplePhotoUrl: true } }),
    // Pessoas confirmadas que ainda não têm mesa
    prisma.guest.findMany({ where: { weddingId, rsvpStatus: RsvpStatus.CONFIRMED, tableId: null, ...notGiftOnlyWhere }, select: { confirmedCompanions: true } }),
  ]);

  // ---------- Contas ----------
  const guests: GuestRow[] = guestRows;
  const counts = countGuests(guests);
  const giftPlan = giftFeePlanOf(plan.planId, plan.modules);
  const txs: GiftTx[] = txRows.map((t) => ({
    id: t.id,
    giftId: t.giftId,
    amount: t.amount,
    netAmount: t.netAmount,
    fee: t.fee,
    method: t.paymentMethod,
    status: t.status,
    who: t.guest?.name || t.guestName || "Convidado sem nome",
    createdAt: t.createdAt,
  }));
  const statement = summarizeGifts(txs, giftPlan);
  const budget = summarizeBudget(expenseRows, todayKey);
  const weddingKey = identity.weddingDate ? dayKeyOf(identity.weddingDate) : null;
  const weddingDays = weddingKey ? daysBetweenKeys(todayKey, weddingKey) : null;
  const deadlineKey = settings?.rsvpDeadline ? dayKeyOf(settings.rsvpDeadline) : null;
  const deadline = deadlineInfo(todayKey, deadlineKey);
  const unseatedPeople = unseated.reduce((acc, g) => acc + 1 + g.confirmedCompanions, 0);

  // Primeiro acesso: nada foi cadastrado ainda. Em vez de caixas vazias, o convite pronto e um caminho de 3 passos.
  const firstAccess = counts.invites.total === 0 && giftCount === 0 && taskCount === 0 && expenseRows.length === 0 && statement.approvedCount === 0 && statement.toCheckCount === 0;

  // Sugestão da Liz, por regras e com dado real: situação + motivo + ação. A Liz só orienta; quem age é o casal.
  const tip = decideLizTip({
    pendingGuests: counts.invites.pending,
    pendingPeople: counts.people.pending,
    deadlineKey,
    todayKey,
    weddingDays: weddingDays !== null && weddingDays >= 0 ? weddingDays : null,
    notInvitedYet: guests.filter((g) => !(g.rsvpStatus === "PENDING" && g.category === "Só presenteou") && g.phone && !g.hasReceivedMessage).length,
    canWhatsApp,
    overdueExpenses: budget.overdueCount,
    overdueTasks: 0, // as tarefas atrasadas têm lugar próprio em Tarefas; aqui entram na fila só pelo prazo
    allowedPaths: session.allowedPaths,
  });

  const queue = buildQueue({
    todayKey,
    tip,
    pendingPix: can("/financas") ? statement.toCheckCount : 0,
    budget,
    hasWeddingDate: Boolean(weddingKey),
    task: nextTask?.dueDate ? { title: nextTask.title, dueKey: dayKeyOf(nextTask.dueDate) } : null,
    unseatedPeople,
    hasTables: tableCount > 0,
    can,
  });

  // ---------- Convite ----------
  const slug = identity.slug ?? weddingRow.slug;
  const siteUrl = weddingSiteUrl(slug, undefined, weddingRow.customDomain);
  const rsvpUrl = weddingSiteUrl(slug, "rsvp", weddingRow.customDomain);
  const weddingDate = identity.weddingDate;
  const generalMessage = generalInviteText({ coupleNames: identity.coupleNames, weddingDate, city: weddingRow.city, url: siteUrl });
  const inviteRow = (g: GuestRow, kind: "invite" | "reminder"): InviteRow => {
    const reached = inviteReached(g);
    const text =
      kind === "reminder"
        ? reminderText({ guestName: g.name, coupleNames: identity.coupleNames, deadline: settings?.rsvpDeadline ?? null, url: rsvpUrl })
        : personalInviteText({ guestName: g.name, coupleNames: identity.coupleNames, weddingDate, url: rsvpUrl });
    const status = !reached ? "convite ainda não enviado" : g.inviteSharedAt ? `convite enviado em ${shortDayLabel(dayKeyOf(g.inviteSharedAt))}` : "convite enviado";
    return { id: g.id, name: g.name, detail: `${seatsText(seatsOf(g))} · ${g.phone ? status : "sem telefone cadastrado"}`, whatsappUrl: whatsappLink(g.phone, text), kind };
  };
  const toInvite = guestsToInvite(guests);
  const toRemind = guestsToRemind(guests);
  const reminding = (deadline.state === "soon" || deadline.state === "today" || deadline.state === "passed") && toRemind.length > 0;
  const deadlineChip = deadline.state === "soon" ? `Prazo em ${deadline.days} ${deadline.days === 1 ? "dia" : "dias"}` : deadline.state === "today" ? "O prazo termina hoje" : deadline.state === "passed" ? "Prazo vencido" : null;

  const dateShort = weddingDate ? `${weddingDate.getUTCDate()} · ${MONTHS[weddingDate.getUTCMonth()]} · ${weddingDate.getUTCFullYear()}` : null;

  // ---------- Cabeçalho ----------
  const today = capitalize(new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: SP_TZ }).format(now));
  const left = weddingDays !== null && weddingDays >= 0 ? daysLeftLabel(weddingDays) : null;
  const weddingLine = weddingDate
    ? `Casamento ${new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(weddingDate).replace(/^(\p{L}+), /u, "no $1, ")}${weddingRow.city ? `, em ${weddingRow.city}` : ""}`
    : null;
  const deadlineLabel = deadlineKey ? dayLabel(deadlineKey, todayKey) : null;

  const shortcuts: Shortcut[] = [
    can("/convidados") && { href: "/convidados", label: "Adicionar convidado", icon: UserPlus },
    can("/convidados") && { href: "/convidados", label: "Importar lista", icon: Upload },
    can("/presentes-admin") && { href: "/presentes-admin", label: "Criar presente", icon: Gift },
    can("/site-builder") && { href: "/site-builder", label: "Editar o site", icon: LayoutTemplate },
  ].filter((s): s is Shortcut => Boolean(s));

  const lines = lastGiftLines(txs, giftPlan, 6);

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-titulo text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] text-tinta md:text-[28px]">Resumo</h1>
          <p className="mt-1.5 max-w-[72ch] text-pretty text-sm text-tinta-suave">
            {today}.{" "}
            {weddingLine ? (
              <>
                {weddingLine}
                {left ? (
                  <>
                    : <b className="font-semibold tabular-nums text-tinta">{left}</b>.
                  </>
                ) : (
                  "."
                )}
              </>
            ) : (
              "Vocês ainda não definiram a data do casamento. Com ela, o painel mostra quantos dias faltam."
            )}
            {deadlineLabel && (
              <>
                {" "}
                {deadline.state === "passed" ? (
                  `O prazo de confirmação terminou em ${deadlineLabel}.`
                ) : deadline.state === "today" ? (
                  <b className="font-semibold text-tinta">O prazo de confirmação termina hoje.</b>
                ) : deadline.state === "soon" ? (
                  <>
                    Prazo de confirmação em {deadlineLabel}, <b className="font-semibold text-tinta">daqui a {deadline.days} {deadline.days === 1 ? "dia" : "dias"}</b>.
                  </>
                ) : (
                  `Prazo de confirmação em ${deadlineLabel} (${deadline.days} dias).`
                )}
              </>
            )}
          </p>
        </div>
        {identity.slug && (
          <Link href={siteUrl} target="_blank" rel="noopener" className={`${btnSecondary} max-md:hidden`}>
            Ver o site
            <ExternalLink className="size-[17px]" aria-hidden="true" />
            <span className="sr-only">(abre em outra aba)</span>
          </Link>
        )}
      </div>

      <div className="grid items-start gap-4 min-[1200px]:grid-cols-12">
        <InviteBlock
          displayUrl={siteUrl.replace(/^https?:\/\//, "")}
          siteUrl={siteUrl}
          generalWhatsappUrl={whatsappLink(null, generalMessage)}
          generalMessage={generalMessage}
          coupleNames={identity.coupleNames}
          initials={identity.initials}
          dateShort={dateShort}
          coverUrl={site?.heroImageUrl || site?.couplePhotoUrl || null}
          invitesTotal={counts.invites.total}
          sentCount={counts.sent}
          canSendEach={can("/convidados")}
          toInvite={{ rows: toInvite.slice(0, SHOWN_IN_LISTS).map((g) => inviteRow(g, "invite")), total: toInvite.length }}
          reminders={reminding ? { rows: toRemind.slice(0, SHOWN_IN_LISTS).map((g) => inviteRow(g, inviteReached(g) ? "reminder" : "invite")), total: toRemind.length, peopleTotal: counts.people.pending } : null}
          firstAccess={firstAccess}
        />

        {firstAccess ? (
          <FirstAccessQueue canAddGuests={can("/convidados")} className="min-[1200px]:col-span-5" />
        ) : (
          <QueueBlock items={queue} deadline={reminding && deadlineChip ? { chip: deadlineChip, remindHref: "#convite" } : null} className="min-[1200px]:col-span-5" />
        )}

        {counts.invites.total === 0 ? (
          <EmptyConfirmations className="min-[1200px]:col-span-7" />
        ) : (
          <ConfirmationsBlock
            counts={counts}
            deadlineHint={deadlineLabel && deadline.state !== "passed" ? `Prazo em ${shortDayLabel(deadlineKey!)}${deadlineKey!.slice(0, 4) !== todayKey.slice(0, 4) ? ` ${deadlineKey!.slice(0, 4)}` : ""}` : deadline.state === "passed" ? "Prazo vencido" : null}
            deadlineChip={reminding ? deadlineChip : null}
            canOpenList={can("/convidados")}
            className="min-[1200px]:col-span-7"
          />
        )}
        {counts.invites.total > 0 && (
          <ResponsesBlock
            rows={recent.map((g) => {
              const yes = g.rsvpStatus === RsvpStatus.CONFIRMED;
              return { id: g.id, name: g.name, yes, people: yes ? 1 + g.confirmedCompanions : 1 + g.allowedCompanions, at: g.updatedAt };
            })}
            canOpenList={can("/convidados")}
            className="min-[1200px]:col-span-5"
          />
        )}
        {counts.invites.total === 0 && <BudgetBlock budget={budget} canOpen={can("/financas")} className="min-[1200px]:col-span-5" />}

        <MoneyBlock
          statement={statement}
          lines={lines}
          plan={giftPlan}
          giftCount={giftCount}
          canOpenGifts={can("/presentes-admin")}
          canReceive={can("/configuracoes")}
          canConfer={can("/financas")}
          className={counts.invites.total === 0 ? "min-[1200px]:col-span-12" : "min-[1200px]:col-span-7"}
        />
        {counts.invites.total > 0 && <BudgetBlock budget={budget} canOpen={can("/financas")} className="min-[1200px]:col-span-5" />}

        <Shortcuts items={shortcuts} />
      </div>

      {canQr && weddingDays !== null && weddingDays <= 7 && weddingDays >= 0 && can("/credenciamento") && (
        <Link href="/credenciamento" className="flex items-center justify-between gap-4 rounded-[12px] border border-ameixa/30 bg-ameixa-suave p-5 text-tinta">
          <span className="flex items-center gap-3">
            <QrCode className="h-6 w-6 text-ameixa" aria-hidden="true" />
            <span>
              <span className="block font-semibold">Registro de entrada dos convidados</span>
              <span className="text-sm text-tinta-suave">Abra o leitor de código QR na entrada da festa.</span>
            </span>
          </span>
          <ChevronRight className="h-5 w-5 text-ameixa" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
