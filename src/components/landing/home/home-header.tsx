"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logotipo } from "@/components/brand/logo";
import { SeletorSegmentadoDoTema, AlternadorDeTema } from "@/components/theme/theme-toggle";
import { LinkDeAncora } from "../anchor-link";
import { LinkEmFormaDeBotao } from "./home-ui";

const NAVEGACAO = [
  { label: "Como funciona", href: "/#como" },
  { label: "Convidados", href: "/#convidados" },
  { label: "Presentes", href: "/#presentes" },
  { label: "Fornecedores", href: "/#fornecedores" },
  { label: "Planos", href: "/#planos" },
] as const;

/**
 * Cabeçalho da home: fixo no alto, com fundo translúcido e fio inferior. No celular, o botão abre um menu
 * em tela cheia (diálogo com foco preso, Esc fecha). Os links levam às seções da própria página.
 */
export function CabecalhoDaHome() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

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
      if (e.key === "Tab" && dialog.current) {
        const items = dialog.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled])");
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
      <header className="lp-nav">
        <div className="lp-moldura">
          <Link href="/" className="lp-marca" aria-label="Aceito, início">
            <Logotipo height={26} />
          </Link>
          <nav className="lp-nav-links" aria-label="Principal">
            {NAVEGACAO.map((item) => (
              <LinkDeAncora key={item.href} href={item.href}>
                {item.label}
              </LinkDeAncora>
            ))}
          </nav>
          <div className="lp-nav-acoes">
            <AlternadorDeTema className="lp-tema" />
            <Link href="/login" className="lp-entrar">
              Entrar
            </Link>
            <LinkEmFormaDeBotao href="/cadastro?plano=basic" className="lp-nav-cta">
              Criar conta grátis
            </LinkEmFormaDeBotao>
            <button
              ref={menuButton}
              type="button"
              className="lp-menu-btn"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={open}
              aria-controls="lp-menu"
            >
              <Menu aria-hidden="true" className="lp-ico" />
            </button>
          </div>
        </div>
      </header>

      <div ref={dialog} id="lp-menu" className="lp-menu" role="dialog" aria-modal="true" aria-label="Menu" data-lenis-prevent inert={!open} data-aberto={open ? "" : undefined}>
        <div className="lp-menu-topo">
          <Link href="/" className="lp-marca" aria-label="Aceito, início" onClick={close}>
            <Logotipo height={26} />
          </Link>
          <button
            ref={closeButton}
            type="button"
            className="lp-menu-btn"
            aria-label="Fechar menu"
            onClick={() => {
              close();
              menuButton.current?.focus();
            }}
          >
            <X aria-hidden="true" className="lp-ico" />
          </button>
        </div>
        <nav aria-label="Principal">
          {NAVEGACAO.map((item) => (
            <LinkDeAncora key={item.href} href={item.href} onClick={close}>
              {item.label}
            </LinkDeAncora>
          ))}
          <LinkDeAncora href="/#duvidas" onClick={close}>
            Perguntas frequentes
          </LinkDeAncora>
        </nav>
        <div className="lp-menu-pe">
          <div className="lp-menu-tema">
            <p>Aparência</p>
            <SeletorSegmentadoDoTema />
          </div>
          <p className="lp-mudo">Foi convidado para um casamento? Use o link enviado pelo casal. Você não precisa criar uma conta.</p>
          <LinkEmFormaDeBotao href="/cadastro?plano=basic" arrow>
            Criar conta grátis
          </LinkEmFormaDeBotao>
          <LinkEmFormaDeBotao href="/login" tone="branco">
            Entrar
          </LinkEmFormaDeBotao>
        </div>
      </div>
    </>
  );
}
