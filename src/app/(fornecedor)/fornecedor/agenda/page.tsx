import type { Metadata } from "next";
import { Aparicao } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { obterContextoDaPaginaDoFornecedor } from "@/lib/security/vendor-guard";
import { NOMES_DOS_MESES, hojeEmBrasilia, paraDataIso } from "../../_lib/vendor-panel";
import { CalendarioDaAgenda } from "./_agenda/calendario-da-agenda";
import { carregarAgenda, itensPorDia, mesDaAgenda, opcoesDePedido, proximosCompromissos } from "./_agenda/dados";
import { NavegacaoDoMes } from "./_agenda/navegacao-do-mes";
import { ProximosCompromissos } from "./_agenda/proximos-compromissos";
import { BotaoDeNovoEvento, ProvedorDaAgenda } from "./_agenda/provedor-da-agenda";

export const metadata: Metadata = { title: "Agenda" };

const ESTILO_DO_CARTAO = "rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]";

function Legenda() {
  return (
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
  );
}

function CabecalhoDaAgenda() {
  return (
    <Aparicao variant="fade" className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-2xl flex-col gap-1">
        <p className="hidden text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase md:block">Fornecedor</p>
        <h1 className="font-display text-[28px] leading-9 font-medium md:text-[40px] md:leading-[46px]">Agenda</h1>
        <p className="text-tinta-suave">Casamentos fechados, reuniões com casais e datas bloqueadas. Datas bloqueadas aparecem como ocupadas nos seus pedidos de orçamento.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <BotaoDeNovoEvento kind="BLOCKED" />
        <BotaoDeNovoEvento kind="MEETING" />
      </div>
    </Aparicao>
  );
}

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { vendor } = await obterContextoDaPaginaDoFornecedor();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  const today = hojeEmBrasilia();
  const todayIso = paraDataIso(today);
  const { year, month, isCurrentMonth } = mesDaAgenda((await searchParams).mes, today);
  const [monthEvents, monthWeddings, nextEvents, nextWeddings, leads] = await carregarAgenda(vendor, year, month, today);
  const monthTitle = `${NOMES_DOS_MESES[month].charAt(0).toUpperCase()}${NOMES_DOS_MESES[month].slice(1)} de ${year}`;

  return (
    <ProvedorDaAgenda todayIso={todayIso} leads={opcoesDePedido(leads)}>
      <div className="flex flex-col gap-6">
        <CabecalhoDaAgenda />
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Aparicao variant="up" delay={80} className="min-w-0">
            <section aria-labelledby="mes-titulo" className={cn(ESTILO_DO_CARTAO, "group/agenda flex min-w-0 flex-col gap-4 p-4 sm:p-6")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="mes-titulo" aria-live="polite" className="font-display text-2xl font-medium sm:text-[28px]">
                  {monthTitle}
                </h2>
                <NavegacaoDoMes year={year} month={month} isCurrentMonth={isCurrentMonth} />
              </div>
              <div className="transition-opacity group-has-[[data-link-pending]]/agenda:opacity-60">
                <CalendarioDaAgenda year={year} month={month} todayIso={todayIso} days={itensPorDia(monthEvents, monthWeddings)} />
              </div>
              <Legenda />
              <p className="text-sm text-tinta-suave">Toque em um dia para ver os detalhes, marcar uma reunião ou bloquear a data.</p>
            </section>
          </Aparicao>
          <Aparicao variant="up" delay={160} className="min-w-0">
            <ProximosCompromissos itens={proximosCompromissos(nextEvents, nextWeddings)} today={today} todayIso={todayIso} />
          </Aparicao>
        </div>
      </div>
    </ProvedorDaAgenda>
  );
}
