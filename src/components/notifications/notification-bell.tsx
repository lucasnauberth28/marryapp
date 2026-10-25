"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { JanelaFlutuante, GatilhoDaJanelaFlutuante } from "@/components/ui/popover";
import { useFluxoDeNotificacoes } from "./use-notification-feed";
import { useAgora } from "./use-now";
import { PainelDosAvisos } from "./painel-dos-avisos";
import { BotaoDoSino } from "./sino-partes";

interface Propriedades {
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
export function SinoDeNotificacoes({ initialUnread, allHref, settingsHref, pushPublicKey = null, align = "end", side = "bottom", className }: Propriedades) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isShown = useCallback(() => triggerRef.current?.offsetParent != null, []);
  const feed = useFluxoDeNotificacoes(initialUnread, isShown);
  const [open, setOpen] = useState(false);
  const now = useAgora();

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    feed.setOpen(next);
  };
  const fechar = () => onOpenChange(false);

  async function onMarkAll() {
    const ok = await feed.markAll();
    if (!ok) toast.error("Não conseguimos marcar como lidos. Tente de novo.");
  }

  return (
    <JanelaFlutuante open={open} onOpenChange={onOpenChange}>
      <GatilhoDaJanelaFlutuante asChild>
        <BotaoDoSino triggerRef={triggerRef} unread={feed.unread} className={className} />
      </GatilhoDaJanelaFlutuante>

      {/* Anuncia mudanças no contador para leitores de tela, sem tirar o foco de onde está. */}
      <span role="status" aria-live="polite" className="sr-only">
        {feed.unread > 0 ? `${feed.unread} ${feed.unread === 1 ? "aviso novo" : "avisos novos"}` : ""}
      </span>

      <PainelDosAvisos
        feed={feed}
        now={now}
        align={align}
        side={side}
        pushPublicKey={pushPublicKey}
        allHref={allHref}
        settingsHref={settingsHref}
        aoFechar={fechar}
        aoMarcarTodas={onMarkAll}
      />
    </JanelaFlutuante>
  );
}
