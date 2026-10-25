import Link from "next/link";
import { LogOut, Search } from "lucide-react";
import { sair } from "@/actions/auth-actions";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PlatformNavList, type PlatformNavCountsProp } from "@/components/plataforma/nav-list";

/**
 * Barra lateral da administração (computador): marca, cartão "Administração", "Buscar em tudo" (leva à busca
 * de Suporte e LGPD), menu com contadores reais e o perfil de quem está logado, com "Sair".
 * Componente de servidor: o botão Sair é um formulário que chama a Server Action `logout`.
 */
export function PlatformSidebar({
  counts,
  name,
  initials,
  roleLabel,
}: {
  counts: PlatformNavCountsProp;
  name: string;
  initials: string;
  roleLabel: string;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col gap-5 border-r border-linha bg-linho px-4 pb-4 pt-6 md:flex">
      <Link href="/admin" aria-label="Aceito, início da administração" className="px-3">
        <Logo height={26} priority />
      </Link>

      <div className="flex flex-col gap-0.5 rounded-xl border border-linha bg-papel p-3">
        <p className="font-display text-xl leading-[26px] text-tinta">Administração</p>
        <p className="text-sm leading-5 text-tinta-suave">Gestão da plataforma</p>
      </div>

      <Link
        href="/admin/suporte#busca"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-linha-forte bg-papel px-3.5 text-[15px] font-medium text-tinta-suave transition-colors hover:border-ameixa hover:bg-ameixa-suave"
      >
        <Search className="size-5 shrink-0" strokeWidth={1.6} aria-hidden="true" />
        Buscar em tudo
      </Link>

      <nav aria-label="Administração" className="-mx-1 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1" data-lenis-prevent>
        <PlatformNavList counts={counts} />
      </nav>

      <div className="flex items-center gap-1 border-t border-linha pt-3">
        <Link href="/conta" className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 transition-colors hover:bg-areia" aria-label={`Minha conta, ${name}`}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ameixa-suave text-sm font-semibold text-ameixa" aria-hidden="true">
            {initials}
          </span>
          <span className="flex min-w-0 flex-col text-sm leading-[18px]">
            <strong className="truncate font-semibold text-tinta">{name}</strong>
            <span className="truncate text-tinta-suave">{roleLabel}</span>
          </span>
        </Link>
        <ThemeToggle align="start" />
        <form action={sair}>
          <button
            type="submit"
            aria-label="Sair"
            title="Sair"
            className="grid size-11 cursor-pointer place-items-center rounded-xl text-perigo transition-colors hover:bg-perigo-suave focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa"
          >
            <LogOut className="size-5" strokeWidth={1.6} aria-hidden="true" />
          </button>
        </form>
      </div>
    </aside>
  );
}
