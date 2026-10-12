"use client";

import { useState } from "react";
import Image from "next/image";
import { isOptimizableImage } from "@/lib/image-source";

interface UserImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Largura renderizada, para o navegador escolher o tamanho certo (ex.: "(min-width: 768px) 50vw, 100vw"). */
  sizes: string;
  /** Imagem acima da dobra (LCP): carrega já e sem lazy. */
  priority?: boolean;
  /** Esqueleto com brilho enquanto a foto carrega (padrão). `false` para fotos que já têm fundo próprio. */
  skeleton?: boolean;
}

/**
 * Foto enviada por usuário (casal, fornecedor). Preenche o pai, que precisa ser `relative` e ter tamanho
 * (proporção fixa, como `aspect-[4/3]`, evita pulo de layout).
 * Fotos do nosso storage passam pelo next/image (WebP/AVIF e tamanhos responsivos); links livres e
 * data URLs seguem como <img> comum, pois o domínio é desconhecido ou não há o que otimizar.
 * Padrão de imagem do app: `loading="lazy"` (exceto `priority`) e esqueleto atrás da foto até ela
 * carregar (ou falhar). Imagens abaixo da dobra nunca levam `priority`.
 */
export function UserImage({ src, alt, className, sizes, priority, skeleton = true }: UserImageProps) {
  // Guarda QUAL foto terminou: ao trocar o src (galeria, lightbox) o esqueleto volta.
  const [settledSrc, setSettledSrc] = useState<string | null>(null);
  const done = () => setSettledSrc(src);
  const showSkeleton = skeleton && settledSrc !== src;

  return (
    <>
      {showSkeleton && <span aria-hidden="true" className="ac-skeleton absolute inset-0 rounded-[inherit]" />}
      {isOptimizableImage(src, process.env.NEXT_PUBLIC_SUPABASE_URL) ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} onLoad={done} onError={done} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- origem desconhecida (link livre) ou data URL: o next/image recusaria
        <img
          // Foto já em cache pode terminar antes da hidratação: o ref confere `complete` e libera o esqueleto.
          ref={(img) => {
            if (img?.complete) done();
          }}
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={done}
          onError={done}
          className={`absolute inset-0 h-full w-full ${className ?? ""}`}
        />
      )}
    </>
  );
}
