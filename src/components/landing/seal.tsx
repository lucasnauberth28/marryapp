import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * Selo do Aceito: marca confirmação de presença e pagamento concluído, nada mais.
 * Círculo ameixa com o símbolo da marca (arte em curvas) e um fio rosa interno.
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
      <span aria-hidden="true" className="grid place-items-center">
        <Logo variant="mark-linho" height={lg ? 36 : 20} />
      </span>
    </span>
  );
}
