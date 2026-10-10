import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { btn } from "@/components/landing/styles";
import { weddingSitePath } from "@/lib/wedding-links";
import { cn } from "@/lib/utils";

/** "A&R" vira "A & R", com o "&" em itálico, como no monograma do design. */
export function Monogram({ initials, className }: { initials: string; className?: string }) {
  const parts = initials.split("&");
  return (
    <span className={cn("font-display text-[22px] leading-7 text-tinta", className)}>
      {parts.length === 2 ? (
        <>
          {parts[0]} <em className="italic">&amp;</em> {parts[1]}
        </>
      ) : (
        initials
      )}
    </span>
  );
}

type GuestPage = "site" | "presentes" | "rsvp" | "dia-do-evento";

const NAV: { page: GuestPage; label: string }[] = [
  { page: "site", label: "Site do casal" },
  { page: "dia-do-evento", label: "Dia do casamento" },
  { page: "presentes", label: "Presentes" },
];

/**
 * Cabeçalho das páginas do convidado (presentes, programação). No celular é a barra com a seta de
 * voltar e o nome da página; no computador, o monograma, a navegação e o botão de confirmar presença.
 */
export function GuestHeader({
  slug,
  initials,
  coupleNames,
  current,
  title,
}: {
  slug: string;
  initials: string;
  coupleNames: string;
  current: GuestPage;
  /** Nome da página, mostrado na barra do celular. */
  title: string;
}) {
  const site = weddingSitePath(slug);
  return (
    <header className="border-b border-linha bg-linho">
      {/* Celular */}
      <div className="flex items-center gap-3 px-4 py-2 sm:hidden">
        <Link
          href={site}
          aria-label="Voltar ao site do casal"
          className="-ml-2 grid size-11 shrink-0 place-items-center rounded-[12px] text-tinta transition-colors hover:bg-areia"
        >
          <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </Link>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold leading-6 text-tinta">{title}</span>
          <span className="truncate text-sm leading-5 text-tinta-suave">{coupleNames}</span>
        </div>
      </div>

      {/* Computador */}
      <div className="mx-auto hidden max-w-[1120px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-4 sm:flex">
        <Link href={site} aria-label={`Site de ${coupleNames}`} className="no-underline">
          <Monogram initials={initials} className="text-2xl leading-8" />
        </Link>
        <nav aria-label="Páginas do casamento" className="flex flex-wrap gap-x-6 gap-y-2 font-medium">
          {NAV.map((item) => (
            <Link
              key={item.page}
              href={item.page === "site" ? site : weddingSitePath(slug, item.page)}
              aria-current={item.page === current ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center no-underline transition-colors hover:text-ameixa",
                item.page === current ? "font-semibold text-ameixa" : "text-tinta-suave",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href={weddingSitePath(slug, "rsvp")} className={cn(btn.primary, btn.sm)}>
          Confirmar presença
        </Link>
      </div>
    </header>
  );
}
