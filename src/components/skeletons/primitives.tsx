import type { CSSProperties } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* Peças pequenas que as composições (sections.tsx) e as telas reaproveitam. */

/**
 * Linhas de texto. Cada linha ocupa a altura da linha real (24px em `base`, 20px em `sm`),
 * então um parágrafo de N linhas ocupa o mesmo espaço do texto carregado.
 *   <SkeletonText lines={3} />   <SkeletonText size="sm" lines={2} lastLineWidth="w-1/3" />
 */
export function SkeletonText({
  lines = 3,
  size = "base",
  lastLineWidth = "w-3/5",
  className,
}: {
  lines?: number;
  /** `base`: leading-6 (texto de corpo). `sm`: leading-5 (texto pequeno). */
  size?: "base" | "sm";
  /** Largura da última linha (classe Tailwind). `w-full` deixa todas iguais. */
  lastLineWidth?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn("flex items-center", size === "base" ? "h-6" : "h-5")}>
          <Skeleton className={cn("rounded-md", size === "base" ? "h-4" : "h-3", i === lines - 1 ? lastLineWidth : "w-full")} />
        </div>
      ))}
    </div>
  );
}

const AVATAR_SIZE = {
  sm: "size-8",
  md: "size-10",
  lg: "size-14",
  xl: "size-20",
} as const;

/** Círculo (ou quadrado arredondado) de avatar/logo. `md` (40px) é o tamanho das listas. */
export function SkeletonAvatar({
  size = "md",
  shape = "circle",
  className,
}: {
  size?: keyof typeof AVATAR_SIZE;
  shape?: "circle" | "square";
  className?: string;
}) {
  return <Skeleton className={cn("shrink-0", AVATAR_SIZE[size], shape === "circle" ? "rounded-full" : "rounded-xl", className)} />;
}

/**
 * Imagem com proporção fixa: reserva o espaço antes da foto chegar, sem pulo de layout.
 *   <SkeletonImage ratio="4/3" />   <SkeletonImage ratio={1} className="rounded-[16px]" />
 * - ratio: "4/3", "16/9", "1/1" ou número (largura / altura). Padrão 4/3.
 * Para a foto de verdade com esqueleto embutido, use <UserImage> (components/ui/user-image).
 */
export function SkeletonImage({
  ratio = "4/3",
  className,
}: {
  ratio?: string | number;
  className?: string;
}) {
  const style: CSSProperties = { aspectRatio: typeof ratio === "number" ? String(ratio) : ratio };
  return <Skeleton className={cn("w-full rounded-2xl", className)} style={style} />;
}

const BAR_HEIGHTS = [38, 62, 48, 80, 56, 92, 70, 44, 66, 84, 52, 74];

/**
 * Gráfico: barras no desenho do gráfico de receita (eixo à esquerda, base na linha), sem cartão.
 *   <SkeletonChart />   <SkeletonChart bars={6} height={190} legend={false} />
 * - height: altura da área das barras em px (padrão 190, a do RevenueChart).
 * - variant "area": um bloco liso, para gráficos de linha ou área.
 */
export function SkeletonChart({
  height = 190,
  bars = 6,
  variant = "bars",
  legend = true,
  className,
}: {
  height?: number;
  bars?: number;
  variant?: "bars" | "area";
  legend?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      {legend && (
        <div className="mb-4 flex h-5 items-center gap-5">
          <Skeleton className="h-3 w-28 rounded-md" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
      )}
      {variant === "area" ? (
        <Skeleton className="w-full rounded-xl" style={{ height }} />
      ) : (
        <div className="grid grid-cols-[3.25rem_1fr] gap-x-2 pt-3">
          <div className="flex flex-col justify-between" style={{ height }} aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-9 self-end rounded-md" />
            ))}
          </div>
          <div className="grid items-end gap-2 border-b border-linha sm:gap-4" style={{ height, gridTemplateColumns: `repeat(${bars}, minmax(0, 1fr))` }}>
            {Array.from({ length: bars }).map((_, i) => (
              <Skeleton key={i} className="mx-auto w-full max-w-[44px] rounded-b-none rounded-t-[4px]" style={{ height: `${BAR_HEIGHTS[i % BAR_HEIGHTS.length]}%` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TAB_WIDTHS = ["w-14", "w-20", "w-16", "w-24", "w-12", "w-20"];

/**
 * Abas. `segmented` (padrão) espelha o TabsNav (faixa de areia, aba ativa em papel);
 * `chips` espelha os filtros em botões (44px no celular, 40px no computador).
 *   <SkeletonTabs count={4} />   <SkeletonTabs variant="chips" count={5} />
 */
export function SkeletonTabs({
  count = 4,
  variant = "segmented",
  className,
}: {
  count?: number;
  variant?: "segmented" | "chips";
  className?: string;
}) {
  if (variant === "chips") {
    return (
      <div className={cn("-mx-4 flex gap-2 overflow-hidden px-4 md:mx-0 md:px-0", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className={cn("h-11 shrink-0 rounded-md md:h-10", i % 2 ? "w-24" : "w-32")} />
        ))}
      </div>
    );
  }
  return (
    <div className={cn("-mx-4 overflow-hidden px-4 sm:mx-0 sm:px-0", className)}>
      <div className="inline-flex max-w-full items-center gap-1 rounded-xl bg-areia p-1" aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cn("flex min-h-11 items-center rounded-lg px-4 sm:min-h-9", i === 0 && "bg-papel shadow-[var(--shadow-aceito-1)]")}>
            <Skeleton className={cn("h-4 rounded-md", TAB_WIDTHS[i % TAB_WIDTHS.length], i !== 0 && "bg-linha")} />
          </div>
        ))}
      </div>
    </div>
  );
}
