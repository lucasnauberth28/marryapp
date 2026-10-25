// Peças que os modelos dividem: a foto com fundo de reserva, o conjunto de fotos do casal e o cabeçalho com menu no celular.
"use client";
import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import type { DadosDoSite } from "../../dados-do-site";
import type { ItemDaHistoria } from "../../tipos";

/** As iniciais do casal (L&G), para o lugar da foto que ainda não foi enviada. */
export const IniciaisDoCasal = createContext("");

/**
 * Foto que preenche o pai (que define tamanho e forma). Sem foto, um fundo na cor do modelo com o monograma do
 * casal: o desenho continua inteiro enquanto as fotos não chegam.
 */
export function Foto({ src, alt = "", sizes = "(min-width: 768px) 40vw, 90vw", priority, className = "" }: { src: string | null | undefined; alt?: string; sizes?: string; priority?: boolean; className?: string }) {
  const iniciais = useContext(IniciaisDoCasal);
  return (
    <div className="relative size-full overflow-hidden bg-areia">
      {src ? (
        <ImagemDaPessoa src={src} alt={alt} sizes={sizes} priority={priority} className={`object-cover ${className}`} />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center overflow-hidden bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-ameixa)_20%,var(--color-areia)),color-mix(in_oklab,var(--color-ameixa)_7%,var(--color-linho)))]">
          {!priority && <span className="select-none font-display text-[clamp(28px,6vw,72px)] leading-none text-ameixa/40">{iniciais}</span>}
        </span>
      )}
    </div>
  );
}

/**
 * As fotos do casal em ordem de importância (capa, casal, momentos da história, galeria), sem repetir.
 * `foto(i)` devolve a i-ésima e, passando do fim, volta ao começo: o desenho nunca fica com buraco.
 */
export function fotosDoCasal(site: DadosDoSite, historia: ItemDaHistoria[]) {
  const todas = [site.coverUrl, site.s.couplePhotoUrl, ...historia.map((h) => h.imageUrl), ...site.galleryPhotos].filter((u): u is string => Boolean(u));
  const unicas = [...new Set(todas)];
  return {
    total: unicas.length,
    foto: (i: number) => (unicas.length === 0 ? null : unicas[i % unicas.length]),
  };
}

interface PropriedadesDoCabecalho {
  marca: ReactNode;
  links: { href: string; label: string }[];
  acao?: ReactNode;
  /** Classes da barra (cor, borda, posição). */
  className?: string;
  /** Classes de cada link do computador. */
  classeDosLinks?: string;
  /** Classes do painel do menu do celular. */
  classeDoPainel?: string;
  preview: boolean;
}

/** Cabeçalho dos modelos: a marca, os links e uma ação; no celular, os links vão para um menu. */
export function CabecalhoDoModelo({ marca, links, acao, className = "", classeDosLinks = "", classeDoPainel = "", preview }: PropriedadesDoCabecalho) {
  const [aberto, setAberto] = useState(false);
  return (
    <header onKeyDown={(e) => e.key === "Escape" && setAberto(false)} className={`z-30 ${className}`}>
      <div className="mx-auto flex min-h-[64px] max-w-[1200px] items-center justify-between gap-6 px-4 md:px-8">
        <a href="#inicio" aria-label="Início" className="no-underline">{marca}</a>
        <nav aria-label="Seções" className="hidden flex-wrap items-center gap-x-7 gap-y-2 lg:flex">
          {links.map((l) => <a key={l.href} href={l.href} className={`py-2 no-underline ${classeDosLinks}`} {...(preview ? { tabIndex: -1 } : {})}>{l.label}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <span className="max-lg:hidden">{acao}</span>
          {links.length > 0 && (
            <button type="button" aria-expanded={aberto} aria-controls="menu-do-modelo" aria-label={aberto ? "Fechar seções" : "Abrir seções"} onClick={() => setAberto((o) => !o)} className="grid size-11 place-items-center rounded-lg lg:hidden">
              {aberto ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>
      {aberto && (
        <nav id="menu-do-modelo" aria-label="Seções" className={`absolute inset-x-0 top-full px-4 py-3 lg:hidden ${classeDoPainel}`}>
          {links.map((l) => <a key={l.href} href={l.href} onClick={() => setAberto(false)} className={`flex min-h-12 items-center no-underline ${classeDosLinks}`}>{l.label}</a>)}
          {acao ? <div className="pt-2">{acao}</div> : null}
        </nav>
      )}
    </header>
  );
}

/** Quantos dias faltam, calculado no navegador (o servidor não sabe "agora" sem divergir na hidratação). */
export function DiasRestantes({ alvo, className }: { alvo: number | null; className?: string }) {
  const agora = useSyncExternalStore(assinarRelogioDoDia, lerAgoraEmDias, () => null);
  if (alvo === null || agora === null) return <span className={className}>--</span>;
  const dias = Math.ceil((alvo - agora * UM_DIA_EM_MS) / UM_DIA_EM_MS);
  return <span className={className}>{Math.max(0, dias)}</span>;
}

const UM_DIA_EM_MS = 86_400_000;
const assinarRelogioDoDia = (aviso: () => void) => {
  const id = setInterval(aviso, 60_000);
  return () => clearInterval(id);
};
const lerAgoraEmDias = () => Math.floor(Date.now() / UM_DIA_EM_MS * 24) / 24;
