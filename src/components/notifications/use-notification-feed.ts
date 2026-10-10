"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
  type ReminderItem,
} from "@/actions/notification-actions";

const POLL_MS = 60_000;

/** Quem muda a leitura fora do sino (página de avisos) dispara isto para o contador se acertar na hora. */
export const NOTIFICATIONS_CHANGED_EVENT = "aceito:notifications-changed";

/**
 * Estado do sino: contador (consultado ao voltar para a aba e a cada ~1 min enquanto ela está visível,
 * sem websocket), lista dos últimos avisos e marcação de leitura com resposta imediata.
 * `isActive` (estável) diz se este sino está na tela; escondido, não consulta.
 */
export function useNotificationFeed(initialUnread: number, isActive: () => boolean = () => true) {
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const openRef = useRef(false);
  const busy = useRef(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNotifications();
      setItems(res.items);
      setReminders(res.reminders);
      setUnread(res.unreadCount);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      if (openRef.current) await loadList();
      else setUnread(await getUnreadNotificationCount());
    } catch {
      // Sem rede por um instante: mantém o que já está na tela.
    } finally {
      busy.current = false;
    }
  }, [loadList]);

  useEffect(() => {
    const tick = () => {
      // O painel do fornecedor tem um sino para o celular e outro para o computador: só o que aparece consulta.
      if (document.visibilityState === "visible" && isActive()) void refresh();
    };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, tick);
    };
  }, [refresh, isActive]);

  /** Avisa o hook se o painel está aberto (aberto: a consulta periódica recarrega a lista inteira). */
  const setOpen = useCallback(
    (open: boolean) => {
      openRef.current = open;
      if (open) void loadList();
    },
    [loadList],
  );

  const markRead = useCallback(async (id: string, wasUnread: boolean) => {
    const now = new Date().toISOString();
    if (wasUnread) setUnread((c) => Math.max(0, c - 1));
    setItems((current) => (current ? current.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: now } : n)) : current));
    try {
      const res = await markNotificationRead(id);
      setUnread(res.unreadCount);
    } catch {
      // A leitura é só conforto: na próxima consulta o contador se acerta.
    }
  }, []);

  const markAll = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((current) => (current ? current.map((n) => (n.readAt ? n : { ...n, readAt: now })) : current));
    setUnread(0);
    try {
      const res = await markAllNotificationsRead();
      setUnread(res.unreadCount);
      return res.success;
    } catch {
      void refresh();
      return false;
    }
  }, [refresh]);

  return { unread, items, reminders, loading, failed, setOpen, loadList, refresh, markRead, markAll };
}
