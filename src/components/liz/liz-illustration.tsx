"use client";

import { useState } from "react";
import Image, { type ImageLoader } from "next/image";
import { IMAGENS_DA_LIZ, enderecoDaImagemDaLiz, type PoseDaLiz } from "@/lib/liz/pose";

/**
 * Ilustrações da Liz, a fada madrinha do Aceito. Os arquivos já saem em WebP no tamanho de uso
 * (public/brand/liz): o loader escolhe o arquivo pela largura pedida, sem passar pelo otimizador.
 * Uso, pela regra da marca:
 *  - até 32px: <LizIcon /> (SVG simplificado; versão escura no tema escuro);
 *  - de 40 a 96px: <LizAvatar /> (recorte real de cabeça e ombros, em círculo);
 *  - acima de 96px: <LizIllustration pose=... /> (corpo inteiro).
 * Alt: "Liz, assistente do Aceito"; `decorative` quando o texto ao lado já nomeia a Liz.
 */

const TEXTO_ALTERNATIVO_DA_LIZ = "Liz, assistente do Aceito";

function carregadorPara(pose: PoseDaLiz): ImageLoader {
  return ({ width }) => enderecoDaImagemDaLiz(pose, width);
}

const CARREGADORES = Object.fromEntries(
  (Object.keys(IMAGENS_DA_LIZ) as PoseDaLiz[]).map((pose) => [pose, carregadorPara(pose)]),
) as Record<PoseDaLiz, ImageLoader>;

interface PropriedadesDaIlustracaoDaLiz {
  pose: Exclude<PoseDaLiz, "rosto">;
  /** Altura na tela, em px; a largura sai da proporção da pose (sem salto de layout). */
  height: number;
  decorative?: boolean;
  className?: string;
}

/** Pose de corpo inteiro (acima de 96px de altura). Lazy por padrão. */
export function IlustracaoDaLiz({ pose, height, decorative = false, className = "" }: PropriedadesDaIlustracaoDaLiz) {
  const width = Math.round(height / IMAGENS_DA_LIZ[pose].ratio);
  return (
    <Image
      loader={CARREGADORES[pose]}
      src={`/brand/liz/${pose}.webp`}
      alt={decorative ? "" : TEXTO_ALTERNATIVO_DA_LIZ}
      width={width}
      height={height}
      data-liz-pose={pose}
      className={`select-none ${className}`}
      draggable={false}
    />
  );
}

/**
 * Rosto da Liz em círculo (40 a 96px), sobre um disco claro fixo: a ilustração tem cores próprias
 * e o disco mantém o contraste também no tema escuro. Enquanto o WebP carrega, aparece o SVG.
 */
export function AvatarDaLiz({ size, decorative = false, className = "" }: { size: number; decorative?: boolean; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span
      className={`relative inline-block bg-[#F5ECF1] dark:bg-[#E9DAE3] shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      {!loaded && <IconeDaLiz className="absolute inset-[12%] size-[76%]" />}
      <Image
        loader={CARREGADORES.rosto}
        src="/brand/liz/rosto.webp"
        alt={decorative ? "" : TEXTO_ALTERNATIVO_DA_LIZ}
        width={size}
        height={size}
        data-liz-pose="rosto"
        onLoad={() => setLoaded(true)}
        className="relative size-full select-none object-cover"
        draggable={false}
      />
    </span>
  );
}

/** Ícone da Liz para até 32px (menus, avisos). Decorativo: o nome vem do texto ao lado. */
export function IconeDaLiz({ className = "size-5" }: { className?: string; strokeWidth?: number | string; "aria-hidden"?: boolean | "true" | "false" }) {
  return (
    <span aria-hidden="true" className={`relative inline-block shrink-0 ${className}`}>
      <Image src="/brand/liz/icone.svg" alt="" fill sizes="32px" unoptimized className="dark:hidden" draggable={false} />
      <Image src="/brand/liz/icone-escuro.svg" alt="" fill sizes="32px" unoptimized className="hidden dark:block" draggable={false} />
    </span>
  );
}
