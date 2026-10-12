import { MARK_ARCH_PATH, MARK_LETTER_PATH, WORDMARK_PATH, WORDMARK_SMALL_PATH } from "./logo-paths";

type LogoVariant = "wordmark" | "wordmark-linho" | "mark" | "mark-linho" | "lockup";

// Proporção (largura x altura em px) de cada versão, a mesma dos SVGs em public/brand.
const SIZES: Record<LogoVariant, { w: number; h: number; viewBox: string }> = {
  wordmark: { w: 610, h: 170, viewBox: "0.38 -79.97 304.82 84.97" },
  "wordmark-linho": { w: 610, h: 170, viewBox: "0.38 -79.97 304.82 84.97" },
  mark: { w: 128, h: 176, viewBox: "0 0 64 88" },
  "mark-linho": { w: 128, h: 176, viewBox: "0 0 64 88" },
  lockup: { w: 770, h: 170, viewBox: "-4 -81 384.82 85" },
};

// Em corpo pequeno o fio da perna esquerda do "A" some: abaixo desta altura (px) usa a versão com traço mais firme.
const SMALL_BELOW = 40;
const SMALL_SIZES: Partial<Record<LogoVariant, { w: number; h: number; viewBox: string }>> = {
  wordmark: { w: 617, h: 170, viewBox: "0.38 -79.97 308.39 84.97" },
  "wordmark-linho": { w: 617, h: 170, viewBox: "0.38 -79.97 308.39 84.97" },
};

// Cores por tema (definidas em globals.css): o logotipo sai inline, sem requisição de imagem, e
// acompanha o tema sem trocar de arquivo. "marca" = ameixa no claro, linho no escuro (as versões
// -linho do design); "sobre ameixa" = para quando o fundo é a própria ameixa.
const MARCA = "var(--logo-marca)";
const CONTRA = "var(--logo-contra)";
const SOBRE_AMEIXA = "var(--logo-sobre-ameixa)";
const AMEIXA = "var(--color-ameixa)";

/**
 * Logo do Aceito, inline e nas cores do tema. `height` em px; a largura acompanha.
 * - wordmark / mark / lockup: sobre linho, papel ou areia (ameixa no claro, linho no escuro).
 * - wordmark-linho / mark-linho: sobre fundo `bg-ameixa` (cor do texto sobre ameixa em cada tema).
 * `priority` é aceito por compatibilidade e não faz nada: não há imagem para pré-carregar.
 */
export function Logo({
  variant = "wordmark",
  height = 28,
  className,
}: {
  variant?: LogoVariant;
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const small = height < SMALL_BELOW ? SMALL_SIZES[variant] : undefined;
  const s = small ?? SIZES[variant];
  const width = Math.round((s.w / s.h) * height);
  const wordmarkPath = small ? WORDMARK_SMALL_PATH : WORDMARK_PATH;

  let shapes: React.ReactNode;
  if (variant === "mark" || variant === "mark-linho") {
    const onAmeixa = variant === "mark-linho";
    shapes = (
      <>
        <path style={{ fill: onAmeixa ? SOBRE_AMEIXA : MARCA }} d={MARK_ARCH_PATH} />
        <path style={{ fill: onAmeixa ? AMEIXA : CONTRA }} d={MARK_LETTER_PATH} />
      </>
    );
  } else if (variant === "lockup") {
    shapes = (
      <>
        <g transform="translate(0 -76) scale(0.8750)">
          <path style={{ fill: MARCA }} d={MARK_ARCH_PATH} />
          <path style={{ fill: CONTRA }} d={MARK_LETTER_PATH} />
        </g>
        <path style={{ fill: MARCA }} transform="translate(67.62 0)" d={WORDMARK_PATH} />
      </>
    );
  } else {
    shapes = <path style={{ fill: variant === "wordmark-linho" ? SOBRE_AMEIXA : MARCA }} d={wordmarkPath} />;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={s.viewBox}
      width={width}
      height={height}
      role="img"
      aria-label="Aceito"
      focusable="false"
      // Tamanho fixo e sem encolher em flex: evita que o navegador distorça a proporção.
      className={`shrink-0 ${className ?? ""}`}
      style={{ height, width }}
    >
      {shapes}
    </svg>
  );
}
