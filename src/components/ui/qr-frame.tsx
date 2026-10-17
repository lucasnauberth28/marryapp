import { cn } from "@/lib/utils";

/**
 * Moldura de QR Code: fundo branco FIXO (valor literal, não token) e margem clara ao redor.
 * Leitor de QR precisa de módulos escuros sobre fundo claro com zona de silêncio; no tema escuro
 * os tokens de papel/linho escurecem, então o QR nunca pode depender deles.
 */
export function QrFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div data-qr-frame className={cn("rounded-[12px] border border-linha bg-[#fff] p-4", className)}>
      {children}
    </div>
  );
}
