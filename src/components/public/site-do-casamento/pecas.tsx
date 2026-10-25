// Peças visuais repetidas no site do casal: faixa de seção, título, foto em arco, nomes e iniciais com o "&" em destaque.
import type { ReactNode } from "react";
import { Aparicao } from "@/components/motion/reveal";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import type { TomDaFaixa } from "./tipos";
import { separarNomes } from "./utilitarios";

/** Cartão do design: papel, borda linha e raio de 16px. Dentro de faixa papel, usa o linho. */
export const estiloDoCartao = "cartao-do-site rounded-2xl border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)] group-data-[tone=papel]/band:bg-linho";

export const classeDoTitulo = "font-display text-[34px] font-medium leading-10 tracking-[-0.015em] text-tinta text-balance md:text-5xl md:leading-[54px]";

/** Nomes com o "&" em itálico na cor de destaque. */
export function NomesDoCasal({ names, ampClassName = "text-ameixa" }: { names: string; ampClassName?: string }) {
  const par = separarNomes(names);
  if (!par) return <>{names}</>;
  return (
    <>
      {par[0]} <em className={`italic ${ampClassName}`}>&amp;</em> {par[1]}
    </>
  );
}

/** "L&G" -> L & G, com o "&" em itálico. Uma inicial só (ou o coração) fica como está. */
export function TextoDeIniciais({ initials }: { initials: string }) {
  const [a, b] = initials.split("&");
  if (!b) return <>{initials}</>;
  return (
    <>
      {a} <em className="italic">&amp;</em> {b}
    </>
  );
}

/** Faixa de seção do site: conteúdo de até 1120px, 48px de respiro no celular e 96px no computador. */
export function FaixaDaSecao({ id, tone, compact = false, children }: { id?: string; tone: TomDaFaixa; compact?: boolean; children: ReactNode }) {
  const fundo = tone === "papel" ? "border-y border-linha bg-papel" : tone === "areia" ? "bg-areia" : "";
  return (
    <section id={id} data-tone={tone} className={`group/band ${fundo}`}>
      <Aparicao className={`mx-auto flex max-w-[1120px] flex-col gap-6 px-4 md:gap-8 md:px-6 ${compact ? "py-12 md:py-16" : "py-12 md:py-24"}`}>
        {children}
      </Aparicao>
    </section>
  );
}

export function TituloDaSecao({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex max-w-[560px] flex-col gap-3">
      <h2 className={classeDoTitulo}>{title}</h2>
      {children && <p className="text-base leading-6 text-tinta-suave">{children}</p>}
    </div>
  );
}

/** Foto em arco 3:4 (ou outra proporção). O pai define a largura. */
export function FotoEmArco({ src, alt, sizes, ratio = "aspect-[3/4]", priority, className = "" }: { src: string; alt: string; sizes: string; ratio?: string; priority?: boolean; className?: string }) {
  return (
    <div className={`arch relative ${ratio} overflow-hidden bg-areia ${className}`}>
      <ImagemDaPessoa src={src} alt={alt} sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
