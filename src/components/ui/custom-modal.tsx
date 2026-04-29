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

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClasses = {
  sm: "sm:max-w-[425px]",
  md: "sm:max-w-[600px]",
  lg: "sm:max-w-[800px]",
  xl: "sm:max-w-[1024px]",
  full: "sm:max-w-[95vw] h-[95vh]",
};

export function CustomModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = "",
  size = "sm",
}: CustomModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(`p-6 sm:p-8 ${sizeClasses[size]}`, className)}>
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>
          {description && <DialogDescription className="text-zinc-500 mt-1">{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
