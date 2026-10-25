"use client";

import { ModalPersonalizado } from "./custom-modal";
import { Botao } from "./button";
import { AlertTriangle } from "lucide-react";

interface PropriedadesDoModalDeConfirmacao {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

export function ModalDeConfirmacao({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "destructive",
  isLoading = false,
}: PropriedadesDoModalDeConfirmacao) {
  return (
    <ModalPersonalizado
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
    >
      <div className="space-y-4">
        {variant === "destructive" && (
          <div className="flex items-center gap-3 p-3 bg-perigo-suave rounded-xl text-perigo text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <p className="font-medium">Esta ação não poderá ser desfeita.</p>
          </div>
        )}
        
        <div className="flex justify-end gap-3 pt-2">
          <Botao
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Botao>
          <Botao
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={() => {
              onConfirm();
            }}
            loading={isLoading}
          >
            {confirmText}
          </Botao>
        </div>
      </div>
    </ModalPersonalizado>
  );
}
