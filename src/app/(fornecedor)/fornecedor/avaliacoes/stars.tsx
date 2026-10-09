import { cn } from "@/lib/utils";

const STAR_PATH =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";

/** Estrelas em champanhe (cheias até a nota arredondada). A nota vai no aria-label, nunca só na cor. */
export function Stars({
  rating,
  label,
  size = 16,
  className,
}: {
  rating: number;
  label: string;
  size?: number;
  className?: string;
}) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span role="img" aria-label={label} className={cn("inline-flex shrink-0 gap-0.5", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          aria-hidden="true"
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={i < filled ? "text-champanhe" : "text-linha"}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}
