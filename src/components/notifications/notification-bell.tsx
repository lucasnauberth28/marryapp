"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellRing, CheckCheck, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { NotificationRow } from "./notification-row";
import { useNotificationFeed } from "./use-notification-feed";
import { useNow } from "./use-now";
import { ReminderIcon } from "./reminder-icon";
import { PushCard } from "./push-card";

interface Props {
  /** Contagem de não lidos já calculada no servidor (evita o sino piscar vazio). */
  initialUnread: number;
  /** Página com o histórico: "/notificacoes" (casal) ou "/fornecedor/notificacoes". */
  allHref: string;
  /** Onde ficam as escolhas de avisos. */
  settingsHref: string;
  /** Chave pública do push (null com o push desligado no servidor). */
  pushPublicKey?: string | null;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

/** Sino com contador de não lidos e painel dos últimos avisos. Serve aos dois painéis (casal e fornecedor). */
export function NotificationBell({ initialUnread, allHref, settingsHref, pushPublicKey = null, align = "end", side = "bottom", className }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isShown = useCallback(() => triggerRef.current?.offsetParent != null, []);
  const feed = useNotificationFeed(initialUnread, isShown);
  const [open, setOpen] = useState(false);
  const now = useNow();

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    feed.setOpen(next);
  };

  const label = feed.unread > 0 ? `Avisos, ${feed.unread} ${feed.unread === 1 ? "novo" : "novos"}` : "Avisos";

  async function onMarkAll() {
    const ok = await feed.markAll();
    if (!ok) toast.error("Não conseguimos marcar como lidos. Tente de novo.");
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label={label}
          className={cn(
            "relative grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-tinta-suave transition-colors hover:bg-areia/70 hover:text-ameixa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ameixa data-[state=open]:bg-areia/70 data-[state=open]:text-ameixa",
            className,
          )}
        >
          {feed.unread > 0 ? <BellRing aria-hidden="true" className="size-5" strokeWidth={1.75} /> : <Bell aria-hidden="true" className="size-5" strokeWidth={1.75} />}
          {feed.unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full border-2 border-linho bg-perigo px-1 text-[10px] font-bold leading-none text-on-ameixa"
            >
              {feed.unread > 99 ? "99+" : feed.unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      {/* Anuncia mudanças no contador para leitores de tela, sem tirar o foco de onde está. */}
      <span role="status" aria-live="polite" className="sr-only">
        {feed.unread > 0 ? `${feed.unread} ${feed.unread === 1 ? "aviso novo" : "avisos novos"}` : ""}
      </span>

      <PopoverContent
        align={align}
        side={side}
        sideOffset={8}
        collisionPadding={16}
        aria-label="Avisos"
        className="w-[calc(100vw-32px)] max-w-[400px] overflow-hidden rounded-2xl border-linha p-0 shadow-[var(--shadow-aceito-2)]"
      >
        <div className="flex min-h-12 items-center justify-between gap-2 border-b border-linha pl-4 pr-2">
          <p className="text-sm font-semibold text-tinta">Avisos</p>
          {/* Fica na tela (desligado) depois de marcar tudo: o foco do teclado não se perde. */}
          {feed.items && feed.items.length > 0 && (
            <button
              type="button"
              onClick={onMarkAll}
              disabled={feed.unread === 0}
              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-ameixa transition-colors hover:bg-ameixa-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ameixa disabled:cursor-default disabled:text-tinta-suave disabled:hover:bg-transparent"
            >
              <CheckCheck aria-hidden="true" className="size-4" />
              Marcar todas como lidas
            </button>
          )}
        </div>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto" data-lenis-prevent>
          {feed.items === null ? (
            feed.failed ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-tinta-suave">
                <p>Não conseguimos carregar os avisos.</p>
                <button
                  type="button"
                  onClick={() => void feed.loadList()}
                  className="min-h-11 cursor-pointer rounded-lg px-3 font-semibold text-ameixa hover:bg-ameixa-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ameixa"
                >
                  Tentar de novo
                </button>
              </div>
            ) : (
              <ul aria-busy="true" className="divide-y divide-linha">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex gap-3 px-4 py-3">
                    <span className="size-9 shrink-0 animate-pulse rounded-xl bg-areia" />
                    <span className="flex-1 space-y-2 pt-1">
                      <span className="block h-3 w-2/5 animate-pulse rounded bg-areia" />
                      <span className="block h-3 w-4/5 animate-pulse rounded bg-areia" />
                    </span>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <>
              {feed.items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                  <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-ameixa-suave text-ameixa">
                    <Bell className="size-5" strokeWidth={1.75} />
                  </span>
                  <p className="text-sm font-semibold text-tinta">Tudo em dia por aqui</p>
                  <p className="text-sm text-tinta-suave">Quando algo acontecer, o aviso aparece neste lugar.</p>
                </div>
              ) : (
                <ul className="divide-y divide-linha">
                  {feed.items.map((item) => (
                    <li key={item.id}>
                      <NotificationRow
                        item={item}
                        now={now}
                        onOpen={(n) => {
                          if (!n.readAt) void feed.markRead(n.id, true);
                          setOpen(false);
                          feed.setOpen(false);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}

              {feed.reminders.length > 0 && (
                <section aria-label="Lembretes" className="border-t border-linha bg-linho/60">
                  <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">Lembretes</p>
                  <ul>
                    {feed.reminders.map((r) => (
                      <li key={r.id}>
                        <Link
                          href={r.href}
                          onClick={() => onOpenChange(false)}
                          className="flex min-h-12 items-start gap-3 px-4 py-2.5 transition-colors hover:bg-areia/60 focus-visible:bg-areia focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ameixa"
                        >
                          <ReminderIcon category={r.category} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-tinta">{r.title}</span>
                            <span className="line-clamp-2 block text-sm leading-5 text-tinta-suave">{r.description}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        <PushCard publicKey={pushPublicKey} variant="compact" />

        <div className="flex items-center justify-between gap-2 border-t border-linha px-2 py-1">
          <Link
            href={allHref}
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-11 items-center rounded-lg px-2.5 text-sm font-semibold text-ameixa transition-colors hover:bg-ameixa-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ameixa"
          >
            Ver todos os avisos
          </Link>
          <Link
            href={settingsHref}
            onClick={() => onOpenChange(false)}
            aria-label="Escolher quais avisos receber"
            title="Escolher quais avisos receber"
            className="grid size-11 place-items-center rounded-lg text-tinta-suave transition-colors hover:bg-areia/70 hover:text-ameixa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ameixa"
          >
            <Settings2 aria-hidden="true" className="size-[18px]" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
