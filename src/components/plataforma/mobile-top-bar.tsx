import Link from "next/link";
import { Search } from "lucide-react";
import { Logotipo } from "@/components/brand/logo";
import { AlternadorDeTema } from "@/components/theme/theme-toggle";

/** Faixa de cima da administração no celular: marca, "Administração" e a lupa que leva à busca em tudo. */
export function BarraSuperiorMovelDaPlataforma() {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between gap-3 border-b border-linha bg-linho/90 px-4 backdrop-blur-md md:hidden">
      <Link href="/admin" aria-label="Aceito, início da administração" className="flex min-w-0 items-center gap-2.5">
        <Logotipo variant="mark" height={28} />
        <span className="truncate font-display text-xl text-tinta">Administração</span>
      </Link>
      <div className="flex shrink-0 items-center">
        <AlternadorDeTema />
        <Link href="/admin/suporte#busca" aria-label="Buscar em tudo" className="grid size-11 place-items-center rounded-xl text-tinta-suave transition-colors hover:bg-areia">
          <Search className="size-5" strokeWidth={1.6} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
