import { Box, Compass, MessageCircle, Percent, QrCode, Sliders, Users, type LucideIcon } from "lucide-react";

/** Ícone de cada recurso do catálogo (o campo iconName do módulo). */
const ICONES: Record<string, LucideIcon> = { Sliders, Percent, MessageCircle, QrCode, Users, Box, Compass };

export function IconeDoRecurso({ nome, className }: { nome: string; className?: string }) {
  const Icone = ICONES[nome] ?? Sliders;
  return <Icone className={className} />;
}
