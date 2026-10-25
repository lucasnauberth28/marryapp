"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  obterQuantidadeDeNotificacoesNaoLidas,
  listarNotificacoes,
  marcarTodasAsNotificacoesComoLidas,
  marcarNotificacaoComoLida,
  type ItemDeNotificacao,
  type ItemDeLembrete,
} from "@/actions/notification-actions";

const INTERVALO_DE_CONSULTA_EM_MS = 60_000;

/** Quem muda a leitura fora do sino (página de avisos) dispara isto para o contador se acertar na hora. */
export const EVENTO_DE_NOTIFICACOES_MUDARAM = "aceito:notifications-changed";

type Definir<T> = React.Dispatch<React.SetStateAction<T>>;

/** Consulta o contador ao voltar para a aba, ao focar a janela e a cada ~1 min (só o sino que está na tela consulta). */
function useConsultaPeriodica(refresh: () => Promise<void>, isActive: () => boolean) {
  useEffect(() => {
    const tick = () => {
      // O painel do fornecedor tem um sino para o celular e outro para o computador: só o que aparece consulta.
      if (document.visibilityState === "visible" && isActive()) void refresh();
    };
    const id = setInterval(tick, INTERVALO_DE_CONSULTA_EM_MS);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    window.addEventListener(EVENTO_DE_NOTIFICACOES_MUDARAM, tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
      window.removeEventListener(EVENTO_DE_NOTIFICACOES_MUDARAM, tick);
    };
  }, [refresh, isActive]);
}

/** Marcação de leitura com resposta imediata na tela; o servidor confirma o contador depois. */
function useMarcarLeitura(setItems: Definir<ItemDeNotificacao[] | null>, setUnread: Definir<number>, refresh: () => Promise<void>) {
  const markRead = useCallback(
    async (id: string, wasUnread: boolean) => {
      const now = new Date().toISOString();
      if (wasUnread) setUnread((c) => Math.max(0, c - 1));
      setItems((current) => (current ? current.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: now } : n)) : current));
      try {
        const res = await marcarNotificacaoComoLida(id);
        setUnread(res.unreadCount);
      } catch {
        // A leitura é só conforto: na próxima consulta o contador se acerta.
      }
    },
    [setItems, setUnread],
  );

  const markAll = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((current) => (current ? current.map((n) => (n.readAt ? n : { ...n, readAt: now })) : current));
    setUnread(0);
    try {
      const res = await marcarTodasAsNotificacoesComoLidas();
      setUnread(res.unreadCount);
      return res.success;
    } catch {
      void refresh();
      return false;
    }
  }, [refresh, setItems, setUnread]);

  return { markRead, markAll };
}

/** A lista dos últimos avisos (e lembretes), carregada quando o painel abre. */
function useListaDeAvisos(setUnread: Definir<number>) {
  const [items, setItems] = useState<ItemDeNotificacao[] | null>(null);
  const [reminders, setReminders] = useState<ItemDeLembrete[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listarNotificacoes();
      setItems(res.items);
      setReminders(res.reminders);
      setUnread(res.unreadCount);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [setUnread]);

  return { items, setItems, reminders, loading, failed, loadList };
}

/**
 * Estado do sino: contador (consultado ao voltar para a aba e a cada ~1 min enquanto ela está visível,
 * sem websocket), lista dos últimos avisos e marcação de leitura com resposta imediata.
 * `isActive` (estável) diz se este sino está na tela; escondido, não consulta.
 */
export function useFluxoDeNotificacoes(initialUnread: number, isActive: () => boolean = () => true) {
  const [unread, setUnread] = useState(initialUnread);
  const { items, setItems, reminders, loading, failed, loadList } = useListaDeAvisos(setUnread);
  const openRef = useRef(false);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      if (openRef.current) await loadList();
      else setUnread(await obterQuantidadeDeNotificacoesNaoLidas());
    } catch {
      // Sem rede por um instante: mantém o que já está na tela.
    } finally {
      busy.current = false;
    }
  }, [loadList]);

  useConsultaPeriodica(refresh, isActive);
  const { markRead, markAll } = useMarcarLeitura(setItems, setUnread, refresh);

  /** Avisa o hook se o painel está aberto (aberto: a consulta periódica recarrega a lista inteira). */
  const setOpen = useCallback(
    (open: boolean) => {
      openRef.current = open;
      if (open) void loadList();
    },
    [loadList],
  );

  return { unread, items, reminders, loading, failed, setOpen, loadList, refresh, markRead, markAll };
}
