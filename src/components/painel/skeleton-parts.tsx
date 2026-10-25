import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonAvatar } from "@/components/skeletons";
import { estiloDoCartao } from "@/components/casal/ui";
import { cn } from "@/lib/utils";

/* Peças de esqueleto próprias do painel do casal (compõem os blocos de @/components/skeletons). */

/** Linhas de 56px sem moldura nem respiro lateral, para dentro de um cartão que já tem padding (dashboard, tarefas). */
export function EsqueletoDeLinhas({
  rows = 4,
  leading = "avatar",
  trailing = "none",
  lines = 2,
  className,
}: {
  rows?: number;
  leading?: "avatar" | "check" | "none";
  trailing?: "chip" | "none";
  lines?: 1 | 2;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex min-h-14 items-center gap-3 border-b border-linha py-2 last:border-b-0">
          {leading === "avatar" && <SkeletonAvatar />}
          {leading === "check" && <Skeleton className="mx-3 size-5 shrink-0 rounded-md" />}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className={cn("h-4 max-w-full rounded-md", i % 3 === 0 ? "w-44" : i % 3 === 1 ? "w-36" : "w-52")} />
            {lines === 2 && <Skeleton className="h-3 w-28 max-w-full rounded-md" />}
          </div>
          {trailing === "chip" && <Skeleton className="h-7 w-20 shrink-0 rounded-lg" />}
        </div>
      ))}
    </div>
  );
}

/** Barra de busca de 44px, como a do DataTable (largura máxima de `max-w-sm`). */
export function EsqueletoDaBusca({ className }: { className?: string }) {
  return <Skeleton className={cn("h-11 w-full max-w-sm rounded-xl", className)} />;
}

/** Título de seção (cardTitle, 28px) com descrição opcional, como `<h2>` + `<p>` das telas do painel. */
export function EsqueletoDoTituloDaSecao({ description = false }: { description?: boolean }) {
  return (
    <div>
      <div className="flex h-7 items-center">
        <Skeleton className="h-5 w-44 rounded-md" />
      </div>
      {description && (
        <div className="mt-0.5 flex h-[22px] items-center">
          <Skeleton className="h-3.5 w-80 max-w-full rounded-md" />
        </div>
      )}
    </div>
  );
}

/** Cartão com moldura (`card`) e conteúdo livre. */
export function EsqueletoDoPainel({ className, children }: { className?: string; children?: ReactNode }) {
  return <div className={cn(estiloDoCartao, "min-w-0", className)}>{children}</div>;
}

/** Bloco de resultado de uma verificação (ícone, título, texto e botão), como o da conexão do WhatsApp. */
export function EsqueletoDoBlocoDeSituacao({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-linha p-10 text-center", className)}>
      <Skeleton className="size-12 rounded-full" />
      <Skeleton className="h-6 w-56 max-w-full rounded-md" />
      <Skeleton className="h-4 w-72 max-w-full rounded-md" />
      <Skeleton className="mt-2 h-11 w-56 max-w-full rounded-xl" />
    </div>
  );
}
