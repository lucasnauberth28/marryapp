import { CalendarClock, Check, Clock, Gift, Handshake, Inbox, Sparkles, Star, Wallet, X, type LucideIcon } from "lucide-react";
import { especificacaoDe, type IconeDaNotificacao, type TomDaNotificacao } from "@/lib/notifications/catalog";

const ICONES_DO_MENU: Record<IconeDaNotificacao, LucideIcon> = {
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
const CLASSE_DO_TOM: Record<TomDaNotificacao, string> = {
  success: "bg-sucesso-suave text-sucesso",
  info: "bg-ameixa-suave text-ameixa",
  warning: "bg-aviso-suave text-aviso",
  alert: "bg-perigo-suave text-perigo",
};

export function SeloDeIconeDaNotificacao({ type, className }: { type: string; className?: string }) {
  const spec = especificacaoDe(type);
  const Icon = ICONES_DO_MENU[spec.icon];
  return (
    <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-xl ${CLASSE_DO_TOM[spec.tone]} ${className ?? ""}`}>
      <Icon className="size-4" strokeWidth={1.9} />
    </span>
  );
}
