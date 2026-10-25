"use client";

import Link from "next/link";
import { Bell, BellRing, Settings2 } from "lucide-react";
import type { ItemDeLembrete, ItemDeNotificacao } from "@/actions/notification-actions";
import { RegiaoDeCarregamento } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";
import { useFluxoDeNotificacoes } from "./use-notification-feed";
import { BotaoMarcarTodas } from "./marcar-todas";
import { cn } from "@/lib/utils";
import { LinhaDeNotificacao } from "./notification-row";
import { IconeDeLembrete } from "./reminder-icon";

/** O botão que abre o painel dos avisos. */
export function BotaoDoSino({ triggerRef, unread, className }: { triggerRef: React.RefObject<HTMLButtonElement | null>; unread: number; className?: string }) {
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-label={unread > 0 ? `Avisos, ${unread} ${unread === 1 ? "novo" : "novos"}` : "Avisos"}
      className={cn(
        "relative grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-tinta-suave transition-colors hover:bg-areia/70 hover:text-ameixa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ameixa data-[state=open]:bg-areia/70 data-[state=open]:text-ameixa",
        className,
      )}
    >
      <IconeDoSino unread={unread} />
    </button>
  );
}

const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ameixa";

/** O ícone do sino com a bolinha de não lidos (a contagem é lida pelo `aria-label` e pela região de status). */
function IconeDoSino({ unread }: { unread: number }) {
  return (
    <>
      {unread > 0 ? <BellRing aria-hidden="true" className="size-5" strokeWidth={1.6} /> : <Bell aria-hidden="true" className="size-5" strokeWidth={1.6} />}
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full border-2 border-linho bg-perigo px-1 text-[10px] font-bold leading-none text-on-ameixa"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </>
  );
}

interface PropriedadesDoCabecalho {
  temItens: boolean;
  unread: number;
  aoMarcarTodas: () => void;
}

export function CabecalhoDosAvisos({ temItens, unread, aoMarcarTodas }: PropriedadesDoCabecalho) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-2 border-b border-linha pl-4 pr-2">
      <p className="text-sm font-semibold text-tinta">Avisos</p>
      {temItens && <BotaoMarcarTodas desligado={unread === 0} aoClicar={aoMarcarTodas} />}
    </div>
  );
}

export function FalhaAoCarregarAvisos({ aoTentarDeNovo }: { aoTentarDeNovo: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-tinta-suave">
      <p>Não conseguimos carregar os avisos.</p>
      <button type="button" onClick={aoTentarDeNovo} className={`min-h-11 cursor-pointer rounded-lg px-3 font-semibold text-ameixa hover:bg-ameixa-suave ${FOCO}`}>
        Tentar de novo
      </button>
    </div>
  );
}

export function EsqueletoDosAvisos() {
  return (
    <RegiaoDeCarregamento label="os avisos">
      <ul className="divide-y divide-linha">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex gap-3 px-4 py-3">
            <Esqueleto className="size-9 shrink-0 rounded-xl" />
            <span className="flex-1 space-y-2 pt-1">
              <Esqueleto className="h-3 w-2/5 rounded" />
              <Esqueleto className="h-3 w-4/5 rounded" />
            </span>
          </li>
        ))}
      </ul>
    </RegiaoDeCarregamento>
  );
}

function SemAvisos() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
      <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-ameixa-suave text-ameixa">
        <Bell className="size-5" strokeWidth={1.6} />
      </span>
      <p className="text-sm font-semibold text-tinta">Tudo em dia por aqui</p>
      <p className="text-sm text-tinta-suave">Quando algo acontecer, o aviso aparece neste lugar.</p>
    </div>
  );
}

export function ListaDeAvisos({ items, now, aoAbrir }: { items: ItemDeNotificacao[]; now: Date; aoAbrir: (n: ItemDeNotificacao) => void }) {
  if (items.length === 0) return <SemAvisos />;
  return (
    <ul className="divide-y divide-linha">
      {items.map((item) => (
        <li key={item.id}>
          <LinhaDeNotificacao item={item} now={now} onOpen={aoAbrir} />
        </li>
      ))}
    </ul>
  );
}

export function SecaoDeLembretes({ reminders, aoNavegar }: { reminders: ItemDeLembrete[]; aoNavegar: () => void }) {
  if (reminders.length === 0) return null;
  return (
    <section aria-label="Lembretes" className="border-t border-linha bg-linho/60">
      <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">Lembretes</p>
      <ul>
        {reminders.map((r) => (
          <li key={r.id}>
            <Link
              href={r.href}
              onClick={aoNavegar}
              className="flex min-h-12 items-start gap-3 px-4 py-2.5 transition-colors hover:bg-areia/60 focus-visible:bg-areia focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ameixa"
            >
              <IconeDeLembrete category={r.category} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-tinta">{r.title}</span>
                <span className="line-clamp-2 block text-sm leading-5 text-tinta-suave">{r.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RodapeDosAvisos({ allHref, settingsHref, aoNavegar }: { allHref: string; settingsHref: string; aoNavegar: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-linha px-2 py-1">
      <Link href={allHref} onClick={aoNavegar} className={`inline-flex min-h-11 items-center rounded-lg px-2.5 text-sm font-semibold text-ameixa transition-colors hover:bg-ameixa-suave ${FOCO}`}>
        Ver todos os avisos
      </Link>
      <Link
        href={settingsHref}
        onClick={aoNavegar}
        aria-label="Escolher quais avisos receber"
        title="Escolher quais avisos receber"
        className={`grid size-11 place-items-center rounded-lg text-tinta-suave transition-colors hover:bg-areia/70 hover:text-ameixa ${FOCO}`}
      >
        <Settings2 aria-hidden="true" className="size-[18px]" />
      </Link>
    </div>
  );
}

interface PropriedadesDoCorpo {
  feed: ReturnType<typeof useFluxoDeNotificacoes>;
  now: Date;
  aoAbrir: (n: ItemDeNotificacao) => void;
  aoNavegar: () => void;
}

/** A área rolável do painel: carregando, falha, ou a lista dos avisos e dos lembretes. */
export function CorpoDosAvisos({ feed, now, aoAbrir, aoNavegar }: PropriedadesDoCorpo) {
  return (
    <div className="max-h-[min(60vh,420px)] overflow-y-auto" data-lenis-prevent>
      {feed.items === null ? (
        feed.failed ? <FalhaAoCarregarAvisos aoTentarDeNovo={() => void feed.loadList()} /> : <EsqueletoDosAvisos />
      ) : (
        <>
          <ListaDeAvisos items={feed.items} now={now} aoAbrir={aoAbrir} />
          <SecaoDeLembretes reminders={feed.reminders} aoNavegar={aoNavegar} />
        </>
      )}
    </div>
  );
}
