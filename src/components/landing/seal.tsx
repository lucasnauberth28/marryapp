import { cn } from "@/lib/utils";

/**
 * Selo de cera do Aceito: marca confirmação de presença e pagamento concluído, nada mais.
 * Círculo ameixa com o "A" em Bodoni itálico e um fio champanhe interno.
 */
export function Seal({ size = "sm", className, label = "Confirmado" }: { size?: "sm" | "lg"; className?: string; label?: string }) {
  const lg = size === "lg";
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full bg-ameixa text-on-ameixa",
        lg
          ? "size-[72px] shadow-[inset_0_0_0_4px_var(--color-ameixa),inset_0_0_0_5px_var(--color-champanhe)]"
          : "size-10 shadow-[inset_0_0_0_3px_var(--color-ameixa),inset_0_0_0_4px_var(--color-champanhe)]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("font-display italic leading-none", lg ? "text-[38px]" : "text-[22px]")}
        // Eixo óptico baixo: o fio da perna esquerda do "A" não some; leve ajuste à direita compensa o itálico.
        style={{ fontWeight: 600, fontVariationSettings: lg ? "'opsz' 18" : "'opsz' 11", transform: "translateX(0.03em)" }}
      >
        A
      </span>
    </span>
  );
}
