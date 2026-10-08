"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { AnchorLink } from "./anchor-link";
import { btn, btnArrow } from "./styles";

type NavItem = { label: string; href: string; anchor?: boolean };

const NAV: NavItem[] = [
  { label: "Como funciona", href: "/#como", anchor: true },
  { label: "Para convidados", href: "/#convidados", anchor: true },
  { label: "Fornecedores", href: "/fornecedores" },
  { label: "Planos", href: "/#planos", anchor: true },
];

function NavLink({ item, className, onClick, children }: { item: NavItem; className?: string; onClick?: () => void; children: React.ReactNode }) {
  if (item.anchor) {
    return (
      <AnchorLink href={item.href as `/#${string}`} className={className} onClick={onClick}>
        {children}
      </AnchorLink>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

/**
 * Cabeçalho público do Aceito. Transparente no topo; ao rolar ganha fundo linho translúcido,
 * fio inferior e uma sombra leve. No celular, um botão abre o menu em tela cheia.
 */
export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha o menu ao trocar de página. Ajuste de estado durante a renderização,
  // como recomenda o React para estado derivado de props.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    closeButton.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
        return;
      }
      // Mantém o foco dentro do menu.
      if (e.key === "Tab" && dialog.current) {
        const items = dialog.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-[var(--ease-aceito)]",
          scrolled
            ? "border-linha bg-linho/85 shadow-[0_8px_24px_-20px_rgba(35,28,36,0.35)] backdrop-blur-md backdrop-saturate-150"
            : "border-transparent bg-linho/0",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-4 pl-4 pr-2 sm:px-6 lg:h-[72px] lg:gap-10">
          <Link
            href="/"
            aria-label="Aceito, início"
            className="-m-2 flex shrink-0 items-center rounded-[12px] p-2 transition-opacity duration-200 hover:opacity-80"
          >
            <Logo height={26} priority />
          </Link>

          <nav aria-label="Principal" className="hidden flex-1 lg:block">
            <ul className="flex items-center gap-8">
              {NAV.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    className="group/nav relative inline-flex min-h-11 items-center text-[15px] font-medium text-tinta-suave transition-colors duration-200 hover:text-tinta"
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-2.5 h-px origin-left scale-x-0 bg-champanhe transition-transform duration-500 ease-[var(--ease-aceito)] group-hover/nav:scale-x-100"
                    />
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link href="/login" className={cn(btn.quiet, "max-sm:min-h-11 max-sm:px-3 max-sm:text-sm")}>
              Entrar
            </Link>
            <Link href="/assinar" className={cn(btn.primary, "hidden md:inline-flex")}>
              Criar meu casamento
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </Link>
            <button
              ref={menuButton}
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={open}
              aria-controls="menu-publico"
              className="grid size-11 cursor-pointer place-items-center rounded-[12px] text-tinta transition-colors duration-200 hover:bg-areia lg:hidden"
            >
              <Menu aria-hidden="true" className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      {/* Menu em tela cheia (celular e tablet). Sempre montado para animar a entrada e a saída. */}
      <div
        ref={dialog}
        id="menu-publico"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        data-lenis-prevent
        inert={!open}
        className={cn(
          "fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-papel text-tinta transition-[opacity,visibility] duration-300 ease-[var(--ease-aceito)] lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-linha pl-4 pr-2">
          <Link href="/" aria-label="Aceito, início" onClick={close} className="-m-2 flex rounded-[12px] p-2">
            <Logo height={24} />
          </Link>
          <button
            ref={closeButton}
            type="button"
            onClick={() => {
              close();
              menuButton.current?.focus();
            }}
            aria-label="Fechar menu"
            className="grid size-11 cursor-pointer place-items-center rounded-[12px] text-tinta transition-colors duration-200 hover:bg-areia"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <nav aria-label="Principal" className="px-4 pt-4">
          <ul>
            {NAV.map((item, i) => (
              <li
                key={item.href}
                className={cn(
                  "border-b border-linha transition-[opacity,transform] duration-500 ease-[var(--ease-aceito)]",
                  open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                )}
                style={{ transitionDelay: open ? `${80 + i * 60}ms` : "0ms" }}
              >
                <NavLink
                  item={item}
                  onClick={close}
                  className="group/item flex min-h-16 items-center justify-between font-display text-[28px] leading-9 text-tinta"
                >
                  {item.label}
                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 text-tinta-suave transition-transform duration-300 group-hover/item:translate-x-1"
                    strokeWidth={1.75}
                  />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div
          className={cn(
            "mt-auto flex flex-col gap-2 border-t border-linha px-4 pb-8 pt-4 transition-opacity duration-500",
            open ? "opacity-100" : "opacity-0",
          )}
          style={{ transitionDelay: open ? "320ms" : "0ms" }}
        >
          <p className="mb-2 text-sm text-tinta-suave">Recebeu um convite? Use o link que os noivos mandaram.</p>
          <Link href="/assinar" onClick={close} className={cn(btn.primary, btn.block)}>
            Criar meu casamento
          </Link>
          <Link href="/login" onClick={close} className={cn(btn.secondary, btn.block)}>
            Entrar
          </Link>
        </div>
      </div>
    </>
  );
}
