import { HeartHandshake, UserCheck } from "lucide-react";
import type { ConvidadoLocal } from "@/types/local";

export function SeloDoLink({ guest }: { guest: ConvidadoLocal }) {
  if (guest.parentGuest?.name) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-tinta-suave">
        <HeartHandshake className="size-4 shrink-0" aria-hidden="true" />
        Com {guest.parentGuest.name}
      </span>
    );
  }
  if (guest.linkedGuests && guest.linkedGuests.length > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-tinta-suave">
        <UserCheck className="size-4 shrink-0" aria-hidden="true" />
        Titular de {guest.linkedGuests.length} {guest.linkedGuests.length === 1 ? "pessoa" : "pessoas"}
      </span>
    );
  }
  return null;
}
