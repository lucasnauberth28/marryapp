"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { NotificationItem } from "@/actions/notification-actions";
import { relativeTime } from "@/lib/notifications/relative-time";
import { cn } from "@/lib/utils";
import { NotificationIconBadge } from "./visuals";

interface Props {
  item: NotificationItem;
  now: Date;
  /** Chamado ao abrir o aviso (marca como lido e fecha o painel). */
  onOpen: (item: NotificationItem) => void;
}

/** Uma linha da lista: não lido tem fundo suave, ponto e título em negrito. A linha toda é o alvo de toque (44px+). */
export function NotificationRow({ item, now, onOpen }: Props) {
  const unread = !item.readAt;
  const time = relativeTime(new Date(item.createdAt), now);
  const content = (
    <>
      <NotificationIconBadge type={item.type} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={cn("min-w-0 flex-1 truncate text-sm text-tinta", unread ? "font-semibold" : "font-medium")}>
            {item.title}
          </span>
          <time dateTime={item.createdAt} className="shrink-0 text-xs text-tinta-suave">
            {time}
          </time>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-sm leading-5 text-tinta-suave">{item.body}</span>
      </span>
      {unread ? (
        <>
          <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full bg-ameixa" />
          <span className="sr-only">Não lido</span>
        </>
      ) : item.href ? (
        <ChevronRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-tinta-suave" />
      ) : null}
    </>
  );
  const className = cn(
    "flex min-h-14 items-start gap-3 px-4 py-3 transition-colors focus-visible:bg-areia focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ameixa",
    unread ? "bg-ameixa-suave/45 hover:bg-ameixa-suave" : "hover:bg-linho",
  );

  return item.href ? (
    <Link href={item.href} onClick={() => onOpen(item)} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={() => onOpen(item)} className={cn(className, "w-full text-left")}>
      {content}
    </button>
  );
}
