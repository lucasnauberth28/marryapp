import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { LoadingRegion } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto da moldura de acesso (AuthShell / AuthExperience): logo de verdade no topo, formulário à
 * esquerda e a foto em arco à direita (a partir de lg). O conteúdo da coluna entra como `children`.
 * - mobilePhoto: faixa de foto no celular (login e cadastro têm; as telas avulsas não).
 */
export function AuthShellSkeleton({
  label,
  children,
  mobilePhoto = false,
  footnote = false,
}: {
  label: string;
  children: ReactNode;
  mobilePhoto?: boolean;
  footnote?: boolean;
}) {
  return (
    <LoadingRegion label={label} className="flex min-h-dvh bg-linho text-tinta">
      <div className="flex min-w-0 flex-1 flex-col lg:px-[clamp(24px,5vw,80px)] lg:py-8">
        <div className="flex h-16 items-center gap-1 px-2 lg:h-auto lg:px-0">
          <Skeleton className="size-11 rounded-[12px] lg:hidden" />
          <span className="-m-2.5 p-2.5">
            <Logo height={26} className="lg:hidden" />
            <Logo height={28} className="hidden lg:block" />
          </span>
        </div>
        {mobilePhoto ? <Skeleton className="mx-4 h-36 rounded-[16px] sm:h-48 lg:hidden" /> : null}
        <div
          className={
            "mx-auto flex w-full max-w-[460px] flex-1 flex-col px-4 pb-8 pt-6 lg:px-0 lg:py-12 " +
            (mobilePhoto ? "justify-center" : "justify-start lg:justify-center")
          }
        >
          {children}
        </div>
        {footnote ? (
          <div className="flex flex-col items-center gap-1 px-4 pb-8 lg:items-start lg:px-0 lg:pb-2">
            <Skeleton className="h-3.5 w-72 max-w-full rounded-md" />
          </div>
        ) : null}
      </div>
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden border-l border-linha bg-areia lg:flex">
        <div className="relative w-[min(420px,64%)]">
          <div className="arch relative aspect-[2/3] overflow-hidden">
            <Skeleton className="size-full rounded-none bg-papel" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

/** Título + descrição das telas de acesso (mesma escala do ShellHeading). */
export function AuthHeadingSkeleton({ lines = 2, titleLines = 1 }: { lines?: number; titleLines?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col">
        {Array.from({ length: titleLines }).map((_, i) => (
          <div key={i} className="flex h-10 items-center lg:h-[50px]">
            <Skeleton className={i === 0 ? "h-8 w-4/5 rounded-lg lg:h-10" : "h-8 w-2/5 rounded-lg lg:h-10"} />
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
