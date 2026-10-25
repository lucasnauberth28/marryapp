import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logotipo } from "@/components/brand/logo";
import { AlternadorDeTema } from "@/components/theme/theme-toggle";

export interface FotoDoPalco {
  src: string;
  alt: string;
  caption: string;
  /** object-position da foto; escolhida para o assunto ficar fora do cartão (à direita no computador). */
  position?: string;
}

/**
 * Palco das telas de acesso (entrar, criar conta, senha, convite, boas-vindas): a foto ocupa a tela
 * toda e o formulário flutua num cartão branco à direita. No celular a foto vira uma faixa no topo e o
 * cartão sobe por cima dela. A foto troca com um esmaecer quando muda a etapa (`key` na imagem).
 */
export function PalcoDeAcesso({
  photo,
  children,
  footnote,
  backHref = "/",
  backLabel = "Voltar para o início",
}: {
  photo: FotoDoPalco;
  children: ReactNode;
  footnote?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const position = photo.position ?? "50% 60%";

  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-linho text-tinta lg:flex-row lg:items-center lg:justify-end lg:py-10 lg:pr-[clamp(24px,6vw,104px)]">
      {/* Foto: faixa no celular, fundo inteiro no computador */}
      <div className="relative h-60 w-full shrink-0 overflow-hidden bg-areia sm:h-80 lg:absolute lg:inset-0 lg:-z-10 lg:h-auto">
        <Image
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="100vw"
          className="photo-in object-cover"
          style={{ objectPosition: position }}
        />
        {/* No escuro a foto clara escurece, senão ofusca ao lado do cartão noturno */}
        <span aria-hidden="true" className="absolute inset-0 hidden bg-[#141113]/55 dark:block" />
        <p
          key={photo.caption}
          className="step-in absolute bottom-8 left-4 hidden max-w-[min(420px,50%)] rounded-[20px] bg-papel/80 px-5 py-3 font-display text-xl leading-7 text-tinta shadow-aceito-1 backdrop-blur-md lg:left-[clamp(24px,6vw,104px)] lg:block"
        >
          {photo.caption}
        </p>
      </div>

      <header className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 pt-3 lg:px-[clamp(24px,6vw,104px)] lg:pt-8">
        <Link
          href={backHref}
          aria-label={backLabel}
          className="grid size-11 place-items-center rounded-full bg-papel/80 text-tinta shadow-aceito-1 backdrop-blur-md transition-colors hover:bg-papel lg:hidden"
        >
          <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.6} />
        </Link>
        <Link
          href="/"
          aria-label="Aceito, início"
          className="flex h-11 items-center rounded-full bg-papel/80 px-5 shadow-aceito-1 backdrop-blur-md transition-colors hover:bg-papel"
        >
          <Logotipo height={24} priority />
        </Link>
        <AlternadorDeTema className="ml-auto rounded-full bg-papel/80 shadow-aceito-1 backdrop-blur-md hover:bg-papel" />
      </header>

      <main
        id="conteudo"
        className="relative z-10 -mt-7 flex w-full flex-1 flex-col rounded-t-[28px] bg-papel px-5 pb-8 pt-7 shadow-aceito-2 sm:mx-auto sm:max-w-[520px] lg:mx-0 lg:mt-0 lg:w-[480px] lg:max-w-none lg:flex-none lg:rounded-[28px] lg:px-10 lg:py-10"
      >
        {children}
        {footnote ? <p className="mt-8 border-t border-linha pt-5 text-sm leading-5 text-tinta-suave">{footnote}</p> : null}
      </main>
    </div>
  );
}
