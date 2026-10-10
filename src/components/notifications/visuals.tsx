import { CalendarClock, Check, Clock, Gift, Handshake, Inbox, Sparkles, Star, Wallet, X, type LucideIcon } from "lucide-react";
import { specOf, type NotificationIcon, type NotificationTone } from "@/lib/notifications/catalog";

const ICONS: Record<NotificationIcon, LucideIcon> = {
  gift: Gift,
  wallet: Wallet,
  check: Check,
  x: X,
  calendar: CalendarClock,
  sparkles: Sparkles,
  inbox: Inbox,
  handshake: Handshake,
  star: Star,
  clock: Clock,
};

/** Cores dos tons: sempre com ícone e texto, nunca só cor. */
export const TONE_CLASS: Record<NotificationTone, string> = {
  success: "bg-sucesso-suave text-sucesso",
  info: "bg-ameixa-suave text-ameixa",
  warning: "bg-aviso-suave text-aviso",
  alert: "bg-perigo-suave text-perigo",
};

export function NotificationIconBadge({ type, className }: { type: string; className?: string }) {
  const spec = specOf(type);
  const Icon = ICONS[spec.icon];
  return (
    <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-xl ${TONE_CLASS[spec.tone]} ${className ?? ""}`}>
      <Icon className="size-4" strokeWidth={1.9} />
    </span>
  );
}
