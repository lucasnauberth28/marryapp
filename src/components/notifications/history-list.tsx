"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { marcarTodasAsNotificacoesComoLidas, marcarNotificacaoComoLida, type ItemDeNotificacao } from "@/actions/notification-actions";
import { BotaoMarcarTodas } from "./marcar-todas";
import { LinhaDeNotificacao } from "./notification-row";
import { EVENTO_DE_NOTIFICACOES_MUDARAM } from "./use-notification-feed";
import { useAgora } from "./use-now";

interface Propriedades {
  initialItems: ItemDeNotificacao[];
  /** Hora do servidor: a primeira pintura do "há 5 min" fica igual no servidor e no navegador. */
  nowIso: string;
}

const anunciarParaLeitor = () => window.dispatchEvent(new Event(EVENTO_DE_NOTIFICACOES_MUDARAM));

/** Marcar tudo (volta ao que veio do servidor se falhar) e marcar um aviso ao abrir. */
function useMarcarNoHistorico(initialItems: ItemDeNotificacao[]) {
  const [items, setItems] = useState(initialItems);

  async function onMarkAll() {
    const stamp = new Date().toISOString();
    setItems((current) => current.map((n) => (n.readAt ? n : { ...n, readAt: stamp })));
    try {
      const res = await marcarTodasAsNotificacoesComoLidas();
      if (!res.success) throw new Error("falhou");
      anunciarParaLeitor();
    } catch {
      setItems(initialItems);
      toast.error("Não conseguimos marcar como lidos. Tente de novo.");
    }
  }

  function onOpen(item: ItemDeNotificacao) {
    if (item.readAt) return;
    const stamp = new Date().toISOString();
    setItems((current) => current.map((n) => (n.id === item.id ? { ...n, readAt: stamp } : n)));
    void marcarNotificacaoComoLida(item.id).then(anunciarParaLeitor, () => {});
  }

  return { items, onMarkAll, onOpen };
}

function HistoricoVazio() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-ameixa-suave text-ameixa">
        <Bell className="size-5" strokeWidth={1.6} />
      </span>
      <p className="font-display text-xl text-tinta">Tudo em dia por aqui</p>
      <p className="max-w-sm text-sm text-tinta-suave">Presentes, confirmações, pedidos e lembretes aparecem neste lugar assim que acontecem.</p>
    </div>
  );
}

/** Histórico (últimos 100 avisos), com "Marcar todas como lidas". */
export function ListaDoHistorico({ initialItems, nowIso }: Propriedades) {
  const { items, onMarkAll, onOpen } = useMarcarNoHistorico(initialItems);
  const now = useAgora(nowIso);
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <section aria-label="Histórico de avisos" className="overflow-hidden rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-linha pl-4 pr-2">
        <p className="text-sm text-tinta-suave" role="status">
          {items.length === 0 ? "Nenhum aviso ainda" : unread > 0 ? `${unread} ${unread === 1 ? "não lido" : "não lidos"}` : "Tudo lido"}
        </p>
        {items.length > 0 && <BotaoMarcarTodas desligado={unread === 0} aoClicar={onMarkAll} />}
      </div>

      {items.length === 0 ? (
        <HistoricoVazio />
      ) : (
        <ul className="divide-y divide-linha">
          {items.map((item) => (
            <li key={item.id}>
              <LinhaDeNotificacao item={item} now={now} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
