import Image from "next/image";

type LogoVariant = "wordmark" | "wordmark-linho" | "mark" | "mark-linho" | "lockup";

const SOURCES: Record<LogoVariant, { src: string; w: number; h: number }> = {
  wordmark: { src: "/brand/aceito-wordmark.svg", w: 584, h: 170 },
  "wordmark-linho": { src: "/brand/aceito-wordmark-linho.svg", w: 584, h: 170 },
  mark: { src: "/brand/aceito-mark.svg", w: 128, h: 176 },
  "mark-linho": { src: "/brand/aceito-mark-linho.svg", w: 128, h: 176 },
  lockup: { src: "/brand/aceito-lockup.svg", w: 712, h: 170 },
};

/** Logo do Aceito a partir dos SVGs do design system. `height` em px; a largura acompanha. */
export function Logo({
  variant = "wordmark",
  height = 28,
  className,
  priority,
}: {
  variant?: LogoVariant;
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const s = SOURCES[variant];
  const width = Math.round((s.w / s.h) * height);
  return (
    <Image
      src={s.src}
      alt="aceito"
      width={width}
      height={height}
      priority={priority}
      unoptimized
      // Tamanho fixo e sem encolher em flex: evita que o navegador distorça a proporção.
      className={`shrink-0 ${className ?? ""}`}
      style={{ height, width }}
    />
  );
}
