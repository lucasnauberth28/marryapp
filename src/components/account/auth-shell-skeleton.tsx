import type { ReactNode } from "react";
import { Logotipo } from "@/components/brand/logo";
import { LoadingRegion } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto do palco de acesso (AuthStage): faixa de foto no topo no celular, fundo inteiro no computador,
 * com a logo de verdade e o cartão do formulário por cima. O conteúdo do cartão entra como `children`.
 * - mobilePhoto e footnote existem por compatibilidade: o palco sempre tem foto e o rodapé ocupa a mesma altura.
 */
export function EsqueletoDoMoldeDeAcesso({
  label,
  children,
  footnote = false,
}: {
  label: string;
  children: ReactNode;
  mobilePhoto?: boolean;
  footnote?: boolean;
}) {
  return (
    <LoadingRegion
      label={label}
      className="relative isolate flex min-h-dvh flex-col bg-linho text-tinta lg:flex-row lg:items-center lg:justify-end lg:py-10 lg:pr-[clamp(24px,6vw,104px)]"
    >
      <div className="relative h-60 w-full shrink-0 overflow-hidden bg-areia sm:h-80 lg:absolute lg:inset-0 lg:-z-10 lg:h-auto" />
      <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 pt-3 lg:px-[clamp(24px,6vw,104px)] lg:pt-8">
        <Skeleton className="size-11 rounded-full lg:hidden" />
        <span className="flex h-11 items-center rounded-full bg-papel/80 px-5 shadow-aceito-1">
          <Logotipo height={24} />
        </span>
      </div>
      <div className="relative z-10 -mt-7 flex w-full flex-1 flex-col rounded-t-[28px] bg-papel px-5 pb-8 pt-7 shadow-aceito-2 sm:mx-auto sm:max-w-[520px] lg:mx-0 lg:mt-0 lg:w-[480px] lg:max-w-none lg:flex-none lg:rounded-[28px] lg:px-10 lg:py-10">
        {children}
        {footnote ? <Skeleton className="mt-8 h-10 w-full rounded-md" /> : null}
      </div>
    </LoadingRegion>
  );
}

/** Título + descrição das telas de acesso (mesma escala do ShellHeading). */
export function EsqueletoDoTituloDeAcesso({ lines = 2, titleLines = 1 }: { lines?: number; titleLines?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col">
        {Array.from({ length: titleLines }).map((_, i) => (
          <div key={i} className="flex h-9 items-center lg:h-[42px]">
            <Skeleton className={i === 0 ? "h-7 w-4/5 rounded-lg lg:h-8" : "h-7 w-2/5 rounded-lg lg:h-8"} />
          </div>
        ))}
      </div>
      <div className="flex flex-col">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex h-6 items-center">
            <Skeleton className={i === lines - 1 ? "h-4 w-3/5 rounded-md" : "h-4 w-full rounded-md"} />
          </div>
        ))}
      </div>
    </div>
  );
}
