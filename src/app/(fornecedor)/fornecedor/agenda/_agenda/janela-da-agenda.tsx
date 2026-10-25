"use client";
// Diálogo nativo (<dialog>): foco preso, Esc fecha, camada superior.
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ESTILO_DO_BOTAO_DISCRETO } from "./tipos";

interface PropriedadesDaJanela {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function JanelaDaAgenda({ open, onClose, title, children }: PropriedadesDaJanela) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-[480px] overflow-y-auto rounded-2xl border border-linha bg-papel p-0 text-tinta shadow-[var(--shadow-aceito-2)] backdrop:bg-scrim/40"
    >
      {open ? (
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="font-display text-2xl leading-8 font-medium">
              {title}
            </h2>
            <button type="button" onClick={onClose} aria-label="Fechar" className={cn(ESTILO_DO_BOTAO_DISCRETO, "-mt-1 -mr-2 px-2.5")}>
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
