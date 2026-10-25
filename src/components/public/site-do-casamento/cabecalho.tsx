"use client";
// Cabeçalho do site: no celular fica no topo ao rolar e as seções vão para um menu; no computador, links na barra.
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import type { DadosDoSite, PropriedadesDeLink } from "./dados-do-site";
import { TextoDeIniciais } from "./pecas";

function BotaoDoMenu({ aberto, aoAlternar }: { aberto: boolean; aoAlternar: () => void }) {
  return (
    <button type="button" onClick={aoAlternar} aria-expanded={aberto} aria-controls="menu-secoes" aria-label={aberto ? "Fechar seções" : "Abrir seções"} className="grid size-11 place-items-center rounded-xl text-tinta hover:bg-areia lg:hidden">
      {aberto ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
    </button>
  );
}

function MenuDoCelular({ site, linkProps, preview, aoEscolher }: { site: DadosDoSite; linkProps: PropriedadesDeLink; preview: boolean; aoEscolher: () => void }) {
  return (
    <nav id="menu-secoes" aria-label="Seções" className="absolute inset-x-0 top-full border-b border-linha bg-papel px-2 py-2 shadow-[var(--shadow-aceito-2)] lg:hidden">
      <ul>
        {site.navLinks.map((l) => (
          <li key={l.href + l.label}>
            <a href={l.href} onClick={aoEscolher} className="flex min-h-12 items-center rounded-xl px-3 font-medium text-tinta no-underline hover:bg-areia" {...(preview ? linkProps : {})}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function CabecalhoDoSite({ site, linkProps, preview }: { site: DadosDoSite; linkProps: PropriedadesDeLink; preview: boolean }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const temLinks = site.navLinks.length > 0;
  return (
    <header onKeyDown={(e) => e.key === "Escape" && setMenuAberto(false)} className={`z-30 border-b border-linha bg-linho ${preview ? "relative" : "sticky top-0 lg:relative"}`}>
      <div className="mx-auto flex min-h-[60px] max-w-[1120px] items-center justify-between gap-x-8 gap-y-3 py-2 pl-4 pr-2 lg:flex-wrap md:px-6 lg:py-4">
        <a href="#inicio" className="flex min-h-11 items-center font-display text-[22px] leading-8 text-tinta no-underline md:text-2xl" aria-label={`${site.coupleNames}, início`} {...linkProps}>
          <TextoDeIniciais initials={site.initials} />
        </a>
        {temLinks && (
          <nav aria-label="Seções" className="hidden flex-wrap gap-x-6 gap-y-2 font-medium lg:flex">
            {site.navLinks.map((l) => (
              <a key={l.href + l.label} href={l.href} className="rounded-md py-2 text-tinta-suave no-underline hover:text-ameixa" {...linkProps}>{l.label}</a>
            ))}
          </nav>
        )}
        {site.showRsvp && <Link href={site.rsvpHref} className={`${estiloDoBotao.primary} ${estiloDoBotao.sm} max-lg:hidden`} {...linkProps}>Confirmar presença</Link>}
        {temLinks && <BotaoDoMenu aberto={menuAberto} aoAlternar={() => setMenuAberto((o) => !o)} />}
      </div>
      {menuAberto && temLinks && <MenuDoCelular site={site} linkProps={linkProps} preview={preview} aoEscolher={() => setMenuAberto(false)} />}
    </header>
  );
}
