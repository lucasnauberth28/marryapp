import type { ReactNode, Ref } from "react";
import { AuthStage, type StagePhoto } from "./auth-stage";

export type ShellPhoto = StagePhoto;

export const SHELL_PHOTOS = {
  senha: {
    src: "/images/acesso/cafe-croissant.webp",
    alt: "Duas xícaras de cerâmica, um croissant e flores secas numa mesa de madeira clara",
    caption: "Sem pressa. A gente ajuda a voltar.",
    position: "45% 60%",
  },
  convite: {
    src: "/images/acesso/maos-xicara.webp",
    alt: "Duas pessoas de mãos dadas em volta de uma xícara, uma delas com aliança dourada",
    caption: "Todo grande dia começa com um sim.",
    position: "50% 60%",
  },
  boasVindas: {
    src: "/images/acesso/croche-peonia.webp",
    alt: "Peônia de crochê rosa num vaso branco, ao lado de uma xícara fumegante",
    caption: "Comecem de graça. O resto vem com calma.",
    position: "35% 60%",
  },
  pronto: {
    src: "/images/acesso/croche-peonia.webp",
    alt: "Peônia de crochê rosa num vaso branco, ao lado de uma xícara fumegante",
    caption: "Tudo pronto. Agora é só começar.",
    position: "35% 60%",
  },
} satisfies Record<string, ShellPhoto>;

/**
 * Moldura das telas avulsas de acesso (esqueci a senha, convite do par, onboarding):
 * o mesmo palco de /login, com a foto ao fundo e o formulário no cartão flutuante.
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
    <AuthStage photo={photo} backHref={backHref} backLabel={backLabel} footnote={footnote}>
      {children}
    </AuthStage>
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
        className="font-display text-[30px] font-medium leading-9 tracking-[-0.015em] text-tinta outline-none lg:text-[36px] lg:leading-[42px]"
      >
        {title}
      </h1>
      {text ? <p className="text-base leading-6 text-tinta-suave">{text}</p> : null}
    </div>
  );
}
