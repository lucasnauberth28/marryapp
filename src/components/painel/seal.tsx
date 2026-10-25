import { Logotipo } from "@/components/brand/logo";

/** Selo do design: marca confirmação de presença (aqui, o convite válido na portaria). */
export function Selo({ size = 96, label }: { size?: number; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      style={{ width: size, height: size, boxShadow: "inset 0 0 0 4px var(--color-ameixa), inset 0 0 0 5px var(--color-rosa)" }}
      className="inline-grid place-items-center rounded-full bg-ameixa text-on-ameixa"
    >
      <span aria-hidden="true" className="grid place-items-center">
        <Logotipo variant="mark-linho" height={Math.round(size * 0.5)} />
      </span>
    </span>
  );
}
