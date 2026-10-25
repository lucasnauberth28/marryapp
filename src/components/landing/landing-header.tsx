"use client";

import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { Logotipo } from "@/components/brand/logo";
import { AlternadorDeTema } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";
import { LinkDoMenu, NAVEGACAO } from "./cabecalho/itens";
import { MenuEmTelaCheia } from "./cabecalho/menu-em-tela-cheia";
import { useMenuEmTelaCheia } from "./cabecalho/use-menu";
import { estiloDoBotao, estiloDoBotaoComSeta } from "./styles";

function NavegacaoDoComputador() {
  return (
    <nav aria-label="Principal" className="hidden flex-1 lg:block">
      <ul className="flex items-center gap-8">
        {NAVEGACAO.map((item) => (
          <li key={item.href}>
            <LinkDoMenu item={item} className="group/nav relative inline-flex min-h-11 items-center text-[15px] font-medium text-tinta-suave transition-colors duration-200 hover:text-tinta">
              {item.label}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-2.5 h-px origin-left scale-x-0 bg-rosa transition-transform duration-500 ease-[var(--ease-aceito)] group-hover/nav:scale-x-100"
              />
            </LinkDoMenu>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function AcoesDoCabecalho({ menuButton, open, aoAbrirMenu }: { menuButton: React.RefObject<HTMLButtonElement | null>; open: boolean; aoAbrirMenu: () => void }) {
  return (
    <div className="ml-auto flex items-center gap-1 sm:gap-2">
      <AlternadorDeTema />
      <Link href="/login" className={cn(estiloDoBotao.quiet, "max-sm:min-h-11 max-sm:px-3 max-sm:text-sm")}>
        Entrar
      </Link>
      <Link href="/cadastro?plano=basic" className={cn(estiloDoBotao.primary, "hidden md:inline-flex")}>
        Criar conta grátis
        <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
      </Link>
      <button
        ref={menuButton}
        type="button"
        onClick={aoAbrirMenu}
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls="menu-publico"
        className="grid size-11 cursor-pointer place-items-center rounded-[12px] text-tinta transition-colors duration-200 hover:bg-areia lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5" strokeWidth={1.6} />
      </button>
    </div>
  );
}

/**
 * Cabeçalho público do Aceito. Transparente no topo; ao rolar ganha fundo linho translúcido,
 * fio inferior e uma sombra leve. No celular, um botão abre o menu em tela cheia.
 */
export function CabecalhoDaLanding() {
  const { open, setOpen, menuButton, closeButton, dialog, scrolled } = useMenuEmTelaCheia();
  const close = () => setOpen(false);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-[var(--ease-aceito)]",
          scrolled ? "border-linha bg-linho/85 shadow-aceito-1 backdrop-blur-md backdrop-saturate-150" : "border-transparent bg-linho/0",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-4 pl-4 pr-2 sm:px-6 lg:h-[72px] lg:gap-10">
          <Link href="/" aria-label="Aceito, início" className="-m-2 flex shrink-0 items-center rounded-[12px] p-2 transition-opacity duration-200 hover:opacity-80">
            <Logotipo height={26} priority />
          </Link>
          <NavegacaoDoComputador />

          <AcoesDoCabecalho menuButton={menuButton} open={open} aoAbrirMenu={() => setOpen(true)} />
        </div>
      </header>

      <MenuEmTelaCheia
        dialog={dialog}
        closeButton={closeButton}
        open={open}
        aoFechar={close}
        aoFecharComFoco={() => {
          close();
          menuButton.current?.focus();
        }}
      />
    </>
  );
}
