import { LOCKUP_SHAPE, MARK_SHAPE, VERTICAL_SHAPE, WORDMARK_SHAPE, type LogoShape } from "./logo-paths";

type LogoBase = "lockup" | "wordmark" | "mark" | "vertical";
type LogoVariant = LogoBase | `${LogoBase}-linho`;

const SHAPES: Record<LogoBase, LogoShape> = {
  lockup: LOCKUP_SHAPE,
  wordmark: WORDMARK_SHAPE,
  mark: MARK_SHAPE,
  vertical: VERTICAL_SHAPE,
};

// Cores por tema (definidas em globals.css): o logotipo sai inline, sem requisição de imagem, e
// acompanha o tema sem trocar de arquivo. Cada logo usa uma única cor (Manual de Marca, "Uma única cor").
// "marca" = ameixa no claro, rosa noturno no escuro; "sobre ameixa" = para quando o fundo é a própria ameixa.
const MARCA = "var(--logo-marca)";
const SOBRE_AMEIXA = "var(--logo-sobre-ameixa)";

/**
 * Logo do Aceito, inline e nas cores do tema. `height` em px; a largura acompanha a proporção do desenho.
 * - lockup (padrão): símbolo e nome na horizontal, a assinatura principal. Largura mínima recomendada: 160 px.
 * - wordmark: só o nome, para espaço compacto (mínimo 96 px). mark: só o símbolo, para avatar e cabeçalho estreito (mínimo 32 px).
 * - vertical: uso institucional (mínimo 240 px de largura de peça).
 * - "-linho": versão clara, para fundo `bg-ameixa` (a cor certa sobre ameixa em cada tema).
 * `priority` é aceito por compatibilidade e não faz nada: não há imagem para pré-carregar.
 */
export function Logo({
  variant = "lockup",
  height = 28,
  className,
}: {
  variant?: LogoVariant;
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const onAmeixa = variant.endsWith("-linho");
  const shape = SHAPES[variant.replace("-linho", "") as LogoBase];
  const width = Math.round((shape.width / shape.height) * height);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={shape.viewBox}
      width={width}
      height={height}
      role="img"
      aria-label="Aceito"
      focusable="false"
      // Tamanho fixo e sem encolher em flex: evita que o navegador distorça a proporção.
      className={`shrink-0 ${className ?? ""}`}
      style={{ height, width }}
    >
      {/* Versão clara usa a geometria própria do manual (compensação óptica sobre fundo escuro) */}
      {(onAmeixa ? shape.light : shape.paths).map((p, i) => (
        <path key={i} style={{ fill: onAmeixa ? SOBRE_AMEIXA : MARCA }} d={p.d} transform={p.transform} />
      ))}
    </svg>
  );
}
