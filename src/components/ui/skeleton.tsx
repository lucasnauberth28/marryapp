import { cn } from "@/lib/utils";

/**
 * Bloco de esqueleto: areia com brilho suave (ver skeleton.css). Decorativo: `aria-hidden` por padrão,
 * quem avisa que está carregando é o <LoadingRegion> (components/skeletons).
 * Dê o tamanho e o raio por className, espelhando o elemento real (`h-12 w-40 rounded-xl`).
 * Prefira as composições de `@/components/skeletons` a montar blocos soltos.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("ac-skeleton rounded-lg", className)}
      {...props}
    />
  );
}

export { Skeleton };
