"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(`p-6 sm:p-8 ${classesDeTamanho[size]}`, className)}>
        <DialogHeader className="mb-2">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
