import type { ReactNode, Ref } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export interface ShellPhoto {
  src: string;
  alt: string;
  caption: string;
  position?: string;
}

export const SHELL_PHOTOS = {
  senha: {
    src: "/images/aceito/img-21-papelaria.webp",
    alt: "Convite em papel algodão com envelope ameixa e selo de cera",
    caption: "Do convite ao grande dia.",
  },
  convite: {
    src: "/images/aceito/img-19-fotografia-pre-wedding.webp",
    alt: "Casal sorrindo numa estrada de terra ao pôr do sol",
    caption: "Todo grande dia começa com um sim.",
    position: "50% 35%",
  },
  boasVindas: {
    src: "/images/aceito/img-01-casal-capa.webp",
    alt: "Noivos se olhando no campo ao entardecer",
    caption: "Comecem de graça. O resto vem com calma.",
    position: "50% 30%",
  },
  pronto: {
    src: "/images/aceito/img-22-album-brinde.webp",
    alt: "Convidados brindando com taças de espumante",
    caption: "Que comece a festa.",
  },
} satisfies Record<string, ShellPhoto>;

/**
 * Moldura das telas avulsas de acesso (esqueci a senha, convite do par, onboarding):
 * a mesma composição de /login, com o formulário à esquerda e a foto em arco à direita.
 */
export function AuthShell({
  photo,
  children,
  backHref = "/",
  backLabel = "Voltar para o início",
  footnote,
}: {
  photo: ShellPhoto;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  footnote?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-linho text-tinta">
      <div className="flex min-w-0 flex-1 flex-col lg:px-[clamp(24px,5vw,80px)] lg:py-8">
        <header className="flex h-16 items-center gap-1 px-2 lg:h-auto lg:px-0">
          <Link
            href={backHref}
            aria-label={backLabel}
            className="grid size-11 place-items-center rounded-[12px] text-tinta transition-colors hover:bg-areia lg:hidden"
          >
            <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </Link>
          <Link href="/" aria-label="Aceito, início" className="-m-2.5 rounded-[12px] p-2.5 transition-opacity hover:opacity-80">
            <Logo height={24} priority className="lg:hidden" />
            <Logo height={28} priority className="hidden lg:block" />
          </Link>
        </header>

        <main id="conteudo" className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-start px-4 pb-8 pt-6 lg:justify-center lg:px-0 lg:py-12">
          {children}
        </main>

        {footnote ? <div className="px-4 pb-8 text-center text-sm text-tinta-suave lg:px-0 lg:pb-2 lg:text-left">{footnote}</div> : null}
      </div>

      <div className="relative hidden flex-1 items-center justify-center overflow-hidden border-l border-linha bg-areia lg:flex">
        <div className="relative w-[min(420px,64%)]">
          <span aria-hidden="true" className="arch pointer-events-none absolute -inset-2.5 border border-champanhe" />
          <div className="arch relative aspect-[2/3] overflow-hidden bg-papel">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 420px, 1px"
              className="photo-in object-cover"
              style={{ objectPosition: photo.position ?? "50% 50%" }}
            />
          </div>
        </div>
        <p className="step-in absolute inset-x-0 bottom-8 px-6 text-center font-display text-2xl text-tinta-suave">{photo.caption}</p>
      </div>
    </div>
  );
}

/** Título das telas de acesso (mesma escala de /login). */
export function ShellHeading({
  title,
  text,
  overline,
  id = "titulo",
  ref,
}: {
  title: string;
  text?: ReactNode;
  /** Sobretítulo em caixa-alta pequena, acima do título. */
  overline?: string;
  id?: string;
  ref?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="flex flex-col gap-2">
      {overline ? <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">{overline}</p> : null}
      <h1
        ref={ref}
        id={id}
        tabIndex={-1}
        className="font-display text-[34px] font-normal leading-10 tracking-[-0.015em] text-tinta outline-none lg:text-[44px] lg:leading-[50px]"
      >
        {title}
      </h1>
      {text ? <p className="text-base leading-6 text-tinta-suave">{text}</p> : null}
    </div>
  );
}
