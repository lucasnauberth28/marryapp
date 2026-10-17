"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Eye, Pencil } from "lucide-react";
import { endImpersonation } from "@/actions/admin-impersonation-actions";
import { btn } from "@/components/landing/styles";
import { LoadingButton } from "@/components/painel/loading-button";
import { minutesLeft } from "@/lib/security/impersonation-rules";
import { cn } from "@/lib/utils";

/**
 * Faixa fixa "Você está vendo como ..." do "Entrar como este casal" (administração).
 * Aparece em todas as telas do painel do casal enquanto a sessão vale. Mostra os minutos que faltam e sai sozinha
 * no fim dos 30 minutos (o servidor também deixa de aceitar a sessão: esta contagem é só o aviso).
 */
export function ImpersonationBanner({ coupleNames, canEdit, expiresAt }: { coupleNames: string; canEdit: boolean; expiresAt: string }) {
  const end = new Date(expiresAt);
  const [left, setLeft] = useState(() => minutesLeft(end));
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const leaving = useRef(false);

  function leave() {
    if (leaving.current) return;
    leaving.current = true;
    startTransition(async () => {
      try {
        const result = await endImpersonation();
        if (result.success) {
          window.location.assign(result.redirectTo);
          return;
        }
      } catch {
        // cai no aviso abaixo
      }
      leaving.current = false;
      setFailed(true);
    });
  }

  useEffect(() => {
    const tick = () => {
      const remaining = end.getTime() - Date.now();
      setLeft(minutesLeft(end));
      if (remaining <= 0) leave();
    };
    tick();
    const timer = setInterval(tick, 15_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a contagem depende só do horário de término
  }, [expiresAt]);

  const Icon = canEdit ? Pencil : Eye;
  return (
    <div role="status" className={cn("sticky top-0 z-50 flex h-[68px] items-center gap-3 bg-ameixa px-4 text-on-ameixa md:h-14 md:px-8")}>
      <Icon className="hidden size-5 shrink-0 sm:block" aria-hidden="true" />
      <div className="min-w-0 flex-1 leading-5 md:flex md:items-baseline md:gap-4">
        <p className="truncate font-semibold">Você está vendo como {coupleNames}</p>
        <p className="text-sm text-on-ameixa/80">
          {canEdit ? "Edição liberada" : "Só leitura"} · {left <= 0 ? "saindo..." : `sai sozinho em ${left} min`}
          {failed && " · não conseguimos sair, tente de novo"}
        </p>
      </div>
      <LoadingButton onClick={leave} loading={pending} className={cn(btn.onAmeixa, btn.sm, "shrink-0")}>
        Sair deste casal
      </LoadingButton>
    </div>
  );
}
