import { CalendarClock, MessageCircle, Users, Wallet } from "lucide-react";
import type { ItemDeLembrete } from "@/actions/notification-actions";

const ICONES_DE_LEMBRETE = { finance: Wallet, expense: CalendarClock, guest: Users, whatsapp: MessageCircle } as const;

export function IconeDeLembrete({ category }: { category: ItemDeLembrete["category"] }) {
  const Icon = ICONES_DE_LEMBRETE[category];
  return (
    <span aria-hidden="true" className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-areia text-tinta-suave">
      <Icon className="size-4" strokeWidth={1.8} />
    </span>
  );
}
