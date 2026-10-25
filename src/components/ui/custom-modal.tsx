"use client";

import {
  Dialogo,
  ConteudoDoDialogo,
  CabecalhoDoDialogo,
  TituloDoDialogo,
  DescricaoDoDialogo,
} from "@/components/ui/dialog";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PropriedadesDoModalPersonalizado {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const classesDeTamanho = {
  sm: "sm:max-w-[425px]",
  md: "sm:max-w-[600px]",
  lg: "sm:max-w-[800px]",
  xl: "sm:max-w-[1024px]",
  full: "sm:max-w-[95vw] h-[95vh]",
};

export function ModalPersonalizado({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = "",
  size = "sm",
}: PropriedadesDoModalPersonalizado) {
  return (
    <Dialogo open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ConteudoDoDialogo className={cn(`p-6 sm:p-8 ${classesDeTamanho[size]}`, className)}>
        <CabecalhoDoDialogo className="mb-2">
          <TituloDoDialogo>{title}</TituloDoDialogo>
          {description && <DescricaoDoDialogo>{description}</DescricaoDoDialogo>}
        </CabecalhoDoDialogo>
        <div className="py-2">
          {children}
        </div>
      </ConteudoDoDialogo>
    </Dialogo>
  );
}
