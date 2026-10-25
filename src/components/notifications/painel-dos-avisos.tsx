"use client";

import type { ComponentProps } from "react";
import { ConteudoDaJanelaFlutuante } from "@/components/ui/popover";
import { CartaoDoPush } from "./push-card";
import { CabecalhoDosAvisos, CorpoDosAvisos, RodapeDosAvisos } from "./sino-partes";
import type { useFluxoDeNotificacoes } from "./use-notification-feed";

interface Propriedades {
  feed: ReturnType<typeof useFluxoDeNotificacoes>;
  now: Date;
  align: ComponentProps<typeof ConteudoDaJanelaFlutuante>["align"];
  side: ComponentProps<typeof ConteudoDaJanelaFlutuante>["side"];
  pushPublicKey: string | null;
  allHref: string;
  settingsHref: string;
  aoFechar: () => void;
  aoMarcarTodas: () => void;
}

/** O que abre ao tocar no sino: cabeçalho, avisos e lembretes, convite para ativar o push e os atalhos. */
export function PainelDosAvisos({ feed, now, align, side, pushPublicKey, allHref, settingsHref, aoFechar, aoMarcarTodas }: Propriedades) {
  return (
    <ConteudoDaJanelaFlutuante
      align={align}
      side={side}
      sideOffset={8}
      collisionPadding={16}
      aria-label="Avisos"
      className="w-[calc(100vw-32px)] max-w-[400px] overflow-hidden rounded-2xl border-linha p-0 shadow-[var(--shadow-aceito-2)]"
    >
      <CabecalhoDosAvisos temItens={!!feed.items && feed.items.length > 0} unread={feed.unread} aoMarcarTodas={aoMarcarTodas} />

      <CorpoDosAvisos
        feed={feed}
        now={now}
        aoNavegar={aoFechar}
        aoAbrir={(n) => {
          if (!n.readAt) void feed.markRead(n.id, true);
          aoFechar();
        }}
      />

      <CartaoDoPush publicKey={pushPublicKey} variant="compact" />
      <RodapeDosAvisos allHref={allHref} settingsHref={settingsHref} aoNavegar={aoFechar} />
    </ConteudoDaJanelaFlutuante>
  );
}
