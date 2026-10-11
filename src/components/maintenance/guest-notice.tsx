"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Wrench } from "lucide-react";
import { formatBackAt } from "@/lib/platform/maintenance-core";

/** Páginas que os convidados abrem: o aviso só aparece nelas. */
const GUEST_PREFIXES = ["/casamento", "/rsvp", "/presentes", "/dia-do-evento"];

interface PublicState {
  enabled: boolean;
  message: string;
  backAt: string | null;
}

/**
 * Faixa de manutenção para convidados no site do casamento. Consulta /api/manutencao ao abrir a página
 * (cache de 30 s no servidor), então funciona também nas páginas estáticas. Se a consulta falhar, não mostra nada.
 */
export function GuestMaintenanceNotice() {
  const pathname = usePathname();
  const [state, setState] = useState<PublicState | null>(null);
  const relevant = GUEST_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (!relevant) return;
    let cancelled = false;
    fetch("/api/manutencao")
      .then((r) => (r.ok ? (r.json() as Promise<PublicState>) : null))
      .then((s) => {
        if (!cancelled && s) setState(s);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [relevant]);

  if (!relevant || !state?.enabled) return null;
  const back = formatBackAt(state.backAt);
  return (
    <div role="status" className="sticky top-0 z-40 flex items-start gap-3 border-b border-aviso/40 bg-aviso-suave px-4 py-3 text-sm leading-5 text-tinta">
      <Wrench className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        <strong className="font-semibold">Estamos em manutenção.</strong> {state.message}
        {back ? ` Voltamos ${back}.` : ""}
      </p>
    </div>
  );
}
