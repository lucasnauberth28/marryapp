"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { markAllNotificationsRead, markNotificationRead, type NotificationItem } from "@/actions/notification-actions";
import { NotificationRow } from "./notification-row";
import { NOTIFICATIONS_CHANGED_EVENT } from "./use-notification-feed";
import { useNow } from "./use-now";

interface Props {
  initialItems: NotificationItem[];
  /** Hora do servidor: a primeira pintura do "há 5 min" fica igual no servidor e no navegador. */
  nowIso: string;
}

const announce = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));

/** Histórico (últimos 100 avisos), com "Marcar todas como lidas". */
export function HistoryList({ initialItems, nowIso }: Props) {
  const [items, setItems] = useState(initialItems);
  const now = useNow(nowIso);
  const unread = items.filter((n) => !n.readAt).length;

  async function onMarkAll() {
    const stamp = new Date().toISOString();
    setItems((current) => current.map((n) => (n.readAt ? n : { ...n, readAt: stamp })));
    try {
      const res = await markAllNotificationsRead();
      if (!res.success) throw new Error("falhou");
      announce();
    } catch {
      setItems(initialItems);
      toast.error("Não conseguimos marcar como lidos. Tente de novo.");
    }
  }

  function onOpen(item: NotificationItem) {
    if (item.readAt) return;
    const stamp = new Date().toISOString();
    setItems((current) => current.map((n) => (n.id === item.id ? { ...n, readAt: stamp } : n)));
    void markNotificationRead(item.id).then(announce, () => {});
  }

  return (
    <section aria-label="Histórico de avisos" className="overflow-hidden rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-linha pl-4 pr-2">
        <p className="text-sm text-tinta-suave" role="status">
          {items.length === 0 ? "Nenhum aviso ainda" : unread > 0 ? `${unread} ${unread === 1 ? "não lido" : "não lidos"}` : "Tudo lido"}
        </p>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onMarkAll}
            disabled={unread === 0}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-ameixa transition-colors hover:bg-ameixa-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ameixa disabled:cursor-default disabled:text-tinta-suave disabled:hover:bg-transparent"
          >
            <CheckCheck aria-hidden="true" className="size-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-ameixa-suave text-ameixa">
            <Bell className="size-5" strokeWidth={1.75} />
          </span>
          <p className="font-display text-xl text-tinta">Tudo em dia por aqui</p>
          <p className="max-w-sm text-sm text-tinta-suave">
            Presentes, confirmações, pedidos e lembretes aparecem neste lugar assim que acontecem.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-linha">
          {items.map((item) => (
            <li key={item.id}>
              <NotificationRow item={item} now={now} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
