import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { obterContextoDaPaginaDoFornecedor } from "@/lib/security/vendor-guard";
import { LinkPendente } from "@/components/feedback/link-pending";
import { EtiquetaBase } from "../../_components/status-chip";
import {
  nivelEfetivoDoFornecedor,
  formatarHoraDoPainel,
  formatarDataDoCasamento,
  NOMES_DOS_MESES,
  MESES,
  paraDataIso,
  hojeEmBrasilia,
  DIAS_DA_SEMANA_CURTOS,
} from "../../_lib/vendor-panel";
import {
  CalendarioDaAgenda,
  ProvedorDaAgenda,
  BotaoDeExcluirEvento,
  BotaoDeNovoEvento,
  type ItemDoDia,
  type OpcaoDePedido,
} from "./agenda-client";

export const metadata: Metadata = { title: "Agenda" };

const ESTILO_DO_CARTAO = "rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]";
const ESTILO_DO_SOBRETITULO = "text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase";
const ESTILO_DO_BOTAO_DE_NAVEGACAO =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-[15px] font-semibold transition-colors";
const UM_DIA_EM_MS = 86_400_000;

function parametroDoMes(year: number, month: number) {
  const d = new Date(Date.UTC(year, month, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** "Hoje", "Amanhã" ou "Qua, 15 out" (datas à meia-noite UTC). */
function rotuloDoDia(date: Date, today: Date) {
  const diff = Math.round((date.getTime() - today.getTime()) / UM_DIA_EM_MS);
  if (diff === 0) return "Hoje";
  if (diff === 1) return `Amanhã · ${DIAS_DA_SEMANA_CURTOS[date.getUTCDay()]}`;
  const sameYear = date.getUTCFullYear() === today.getUTCFullYear();
  return `${DIAS_DA_SEMANA_CURTOS[date.getUTCDay()]}, ${date.getUTCDate()} ${MESES[date.getUTCMonth()]}${sameYear ? "" : ` ${date.getUTCFullYear()}`}`;
}

type Proximos =
  | { type: "WEDDING"; id: string; date: Date; coupleName: string; location: string | null }
  | {
      type: "MEETING" | "BLOCKED";
      id: string;
      date: Date;
      time: string | null;
      title: string;
      notes: string | null;
      lead: { id: string; coupleName: string } | null;
    };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { vendor } = await obterContextoDaPaginaDoFornecedor();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  const today = hojeEmBrasilia();
  const todayIso = paraDataIso(today);

  const { mes } = await searchParams;
  const match = typeof mes === "string" ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(mes) : null;
  const year = match && Number(match[1]) >= 2000 && Number(match[1]) <= 2100 ? Number(match[1]) : today.getUTCFullYear();
  const month = match && year === Number(match[1]) ? Number(match[2]) - 1 : today.getUTCMonth();
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 1));
  const isCurrentMonth = year === today.getUTCFullYear() && month === today.getUTCMonth();

  const eventSelect = {
    id: true,
    kind: true,
    date: true,
    time: true,
    title: true,
    notes: true,
    lead: { select: { id: true, coupleName: true } },
  } as const;

  // Todas as consultas filtram pelo fornecedor da sessão.
  const [monthEvents, monthWeddings, nextEvents, nextWeddings, leads] = await Promise.all([
    prisma.vendorEvent.findMany({
      where: { vendorId: vendor.id, date: { gte: monthStart, lt: monthEnd } },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      select: eventSelect,
    }),
    prisma.vendorLead.findMany({
      where: { vendorId: vendor.id, status: "CLOSED", weddingDate: { gte: monthStart, lt: monthEnd } },
      orderBy: { weddingDate: "asc" },
      select: { id: true, coupleName: true, weddingDate: true, location: true },
    }),
    prisma.vendorEvent.findMany({
      where: { vendorId: vendor.id, date: { gte: today } },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 6,
      select: eventSelect,
    }),
    prisma.vendorLead.findMany({
      where: { vendorId: vendor.id, status: "CLOSED", weddingDate: { gte: today } },
      orderBy: { weddingDate: "asc" },
      take: 6,
      select: { id: true, coupleName: true, weddingDate: true, location: true },
    }),
    prisma.vendorLead.findMany({
      // Pedidos bloqueados pelo limite do Start não entram (o nome completo fica oculto).
      where: {
        vendorId: vendor.id,
        status: { not: "DECLINED" },
        ...(nivelEfetivoDoFornecedor(vendor.planTier, vendor.planExpiresAt) === "FREE" ? { locked: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, coupleName: true, weddingDate: true },
    }),
  ]);

  // Itens por dia do mês exibido.
  const days: Record<string, ItemDoDia[]> = {};
  const push = (iso: string, item: ItemDoDia) => (days[iso] ??= []).push(item);
  for (const w of monthWeddings) {
    if (w.weddingDate) push(paraDataIso(w.weddingDate), { type: "WEDDING", id: w.id, title: w.coupleName, location: w.location });
  }
  for (const e of monthEvents) {
    push(paraDataIso(e.date), {
      type: e.kind === "BLOCKED" ? "BLOCKED" : "MEETING",
      id: e.id,
      title: e.title,
      time: e.time,
      notes: e.notes,
      leadId: e.lead?.id ?? null,
    });
  }

  const upcoming: Proximos[] = [
    ...nextWeddings
      .filter((w) => w.weddingDate)
      .map((w) => ({ type: "WEDDING" as const, id: w.id, date: w.weddingDate!, coupleName: w.coupleName, location: w.location })),
    ...nextEvents.map((e) => ({
      type: e.kind === "BLOCKED" ? ("BLOCKED" as const) : ("MEETING" as const),
      id: e.id,
      date: e.date,
      time: e.time,
      title: e.title,
      notes: e.notes,
      lead: e.lead,
    })),
  ]
    .sort((a, b) => {
      const ka = `${paraDataIso(a.date)} ${a.type === "WEDDING" ? "" : (a.time ?? "")}`;
      const kb = `${paraDataIso(b.date)} ${b.type === "WEDDING" ? "" : (b.time ?? "")}`;
      return ka.localeCompare(kb);
    })
    .slice(0, 6);

  const leadOptions: OpcaoDePedido[] = leads.map((l) => ({
    id: l.id,
    label: l.weddingDate ? `${l.coupleName} · ${formatarDataDoCasamento(l.weddingDate)}` : l.coupleName,
  }));

  const monthTitle = `${NOMES_DOS_MESES[month].charAt(0).toUpperCase()}${NOMES_DOS_MESES[month].slice(1)} de ${year}`;

  return (
    <ProvedorDaAgenda todayIso={todayIso} leads={leadOptions}>
      <div className="flex flex-col gap-6">
        <Aparicao variant="fade" className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex max-w-2xl flex-col gap-1">
            <p className={cn(ESTILO_DO_SOBRETITULO, "hidden md:block")}>Fornecedor</p>
            <h1 className="font-display text-[28px] leading-9 font-medium md:text-[40px] md:leading-[46px]">Agenda</h1>
            <p className="text-tinta-suave">
              Casamentos fechados, reuniões com casais e datas bloqueadas. Datas bloqueadas aparecem como ocupadas nos
              seus pedidos de orçamento.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BotaoDeNovoEvento kind="BLOCKED" />
            <BotaoDeNovoEvento kind="MEETING" />
          </div>
        </Aparicao>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Aparicao variant="up" delay={80} className="min-w-0">
            <section aria-labelledby="mes-titulo" className={cn(ESTILO_DO_CARTAO, "group/agenda flex min-w-0 flex-col gap-4 p-4 sm:p-6")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="mes-titulo" aria-live="polite" className="font-display text-2xl font-medium sm:text-[28px]">
                  {monthTitle}
                </h2>
                <nav aria-label="Navegar entre meses" className="flex items-center gap-1">
                  <Link
                    href={`/fornecedor/agenda?mes=${parametroDoMes(year, month - 1)}`}
                    scroll={false}
                    aria-label="Mês anterior"
                    className={cn(ESTILO_DO_BOTAO_DE_NAVEGACAO, "text-tinta-suave hover:bg-areia hover:text-tinta")}
                  >
                    <ChevronLeft aria-hidden="true" className="size-5" />
                    <LinkPendente label="Carregando o mês" />
                  </Link>
                  <Link
                    href="/fornecedor/agenda"
                    scroll={false}
                    aria-current={isCurrentMonth ? "date" : undefined}
                    className={cn(ESTILO_DO_BOTAO_DE_NAVEGACAO, "border border-linha-forte bg-papel px-4 text-sm text-tinta hover:bg-areia")}
                  >
                    Hoje
                    <LinkPendente label="Carregando o mês" />
                  </Link>
                  <Link
                    href={`/fornecedor/agenda?mes=${parametroDoMes(year, month + 1)}`}
                    scroll={false}
                    aria-label="Próximo mês"
                    className={cn(ESTILO_DO_BOTAO_DE_NAVEGACAO, "text-tinta-suave hover:bg-areia hover:text-tinta")}
                  >
                    <ChevronRight aria-hidden="true" className="size-5" />
                    <LinkPendente label="Carregando o mês" />
                  </Link>
                </nav>
              </div>

              <div className="transition-opacity group-has-[[data-link-pending]]/agenda:opacity-60">
                <CalendarioDaAgenda year={year} month={month} todayIso={todayIso} days={days} />
              </div>

              <ul aria-label="Legenda" className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-tinta-suave">
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-3 rounded bg-ameixa" />
                  Casamento fechado
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-3 rounded border border-salvia bg-salvia-suave" />
                  Reunião com casal
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-3 rounded border border-linha-forte bg-areia" />
                  Data bloqueada
                </li>
              </ul>
              <p className="text-sm text-tinta-suave">Toque em um dia para ver os detalhes, marcar uma reunião ou bloquear a data.</p>
            </section>
          </Aparicao>

          <Aparicao variant="up" delay={160} className="min-w-0">
            <section aria-labelledby="proximos-titulo" className="flex flex-col gap-3">
              <h2 id="proximos-titulo" className="text-lg font-semibold">
                Próximos compromissos
              </h2>
              {upcoming.length === 0 ? (
                <p className={cn(ESTILO_DO_CARTAO, "p-4 text-tinta-suave")}>Nada marcado daqui para frente.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {upcoming.map((item) => {
                    const isToday = paraDataIso(item.date) === todayIso;
                    const time = item.type === "MEETING" ? formatarHoraDoPainel(item.time) : null;
                    const label = `${rotuloDoDia(item.date, today)}${time ? ` · ${time}` : ""}`;
                    return (
                      <li key={`${item.type}-${item.id}`}>
                        <article className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-1.5 p-4")}>
                          <EtiquetaBase tone={isToday ? "sucesso" : item.type === "WEDDING" ? "salvia" : "neutro"}>{label}</EtiquetaBase>
                          {item.type === "WEDDING" ? (
                            <>
                              <strong className="text-[17px] font-semibold break-words">Casamento de {item.coupleName}</strong>
                              {item.location ? <span className="text-sm text-tinta-suave">{item.location}</span> : null}
                              <Link
                                href={`/fornecedor/pedidos/${item.id}`}
                                className="-ml-3 inline-flex min-h-11 w-fit items-center rounded-xl px-3 text-sm font-semibold text-ameixa hover:bg-areia"
                              >
                                Ver pedido
                              </Link>
                            </>
                          ) : (
                            <>
                              <strong className="text-[17px] font-semibold break-words">
                                {item.type === "BLOCKED" ? "Data bloqueada" : item.title}
                              </strong>
                              {item.type === "BLOCKED" && item.title !== "Data bloqueada" ? (
                                <span className="text-sm text-tinta-suave">{item.title}</span>
                              ) : null}
                              {item.type === "MEETING" && item.notes ? (
                                <span className="text-sm whitespace-pre-line break-words text-tinta-suave">{item.notes}</span>
                              ) : null}
                              <div className="-ml-3 flex flex-wrap gap-1">
                                {item.lead ? (
                                  <Link
                                    href={`/fornecedor/pedidos/${item.lead.id}`}
                                    className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ameixa hover:bg-areia"
                                  >
                                    Ver pedido
                                    <span className="sr-only"> de {item.lead.coupleName}</span>
                                  </Link>
                                ) : null}
                                <BotaoDeExcluirEvento eventId={item.id} label={item.type === "BLOCKED" ? "Desbloquear" : "Excluir"} />
                              </div>
                            </>
                          )}
                        </article>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="text-sm text-tinta-suave">
                Casamentos entram na agenda quando você marca o pedido como Fechado e ele tem data.
              </p>
            </section>
          </Aparicao>
        </div>
      </div>
    </ProvedorDaAgenda>
  );
}
