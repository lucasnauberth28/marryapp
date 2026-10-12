"use client";

import { useState } from "react";
import Image from "next/image";

type PhotoProps = React.ComponentProps<typeof Image>;

/**
 * Foto da página inicial: o `next/image` de sempre (lazy fora da dobra, `preload` só na primeira tela)
 * com esqueleto de brilho atrás até a foto carregar. O pai já tem proporção fixa e `relative`
 * (aspect-*), então nada pula. Fotos com `preload` (LCP) não levam esqueleto: já chegam com a página.
 */
export default function Photo({ onLoad, onError, preload, priority, ...props }: PhotoProps) {
  const [done, setDone] = useState(false);
  const eager = Boolean(preload || priority);
  return (
    <>
      {!eager && !done ? <span aria-hidden="true" className="ac-skeleton absolute inset-0 rounded-[inherit]" /> : null}
      <Image
        {...props}
        preload={preload}
        priority={priority}
        onLoad={(e) => {
          setDone(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setDone(true);
          onError?.(e);
        }}
      />
    </>
  );
}
