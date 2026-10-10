import type { ReactNode } from "react";
import { Check, Clock, X } from "lucide-react";
import { chipBase, chipTone, type ChipTone } from "./styles";

export function StatusChip({ tone, icon, children, className = "" }: { tone: ChipTone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={`${chipBase} ${chipTone[tone]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}

type Rsvp = "PENDING" | "CONFIRMED" | "DECLINED";

const RSVP: Record<Rsvp, { tone: ChipTone; label: string; Icon: typeof Check }> = {
  CONFIRMED: { tone: "sucesso", label: "Confirmado", Icon: Check },
  PENDING: { tone: "aviso", label: "Sem resposta", Icon: Clock },
  DECLINED: { tone: "perigo", label: "Não vai", Icon: X },
};

/** Selo da resposta do convidado: ícone e palavra, nunca só a cor. */
export function RsvpChip({ status }: { status: Rsvp }) {
  const { tone, label, Icon } = RSVP[status];
  return (
    <StatusChip tone={tone} icon={<Icon className="size-4" strokeWidth={2} aria-hidden="true" />}>
      {label}
    </StatusChip>
  );
}
