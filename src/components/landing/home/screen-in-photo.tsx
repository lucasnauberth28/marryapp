"use client";

/**
 * Foto com uma tela de verdade encaixada: o conteúdo (HTML) é deformado em perspectiva para os quatro
 * cantos da tela do celular ou do notebook que aparece na foto. As coordenadas são da foto em 1536 px de largura.
 * Sem JavaScript a tela fica escondida e a foto aparece como veio.
 */
import { useEffect, useRef } from "react";
import Image from "next/image";
import { calcularProjecao } from "./homografia";

type PontoNaFoto = readonly [number, number];
type Quadrilatero = readonly [PontoNaFoto, PontoNaFoto, PontoNaFoto, PontoNaFoto];

const FOTO_LARGURA = 1536;
const FOTO_ALTURA = 1024;

/** Aplica a perspectiva ao conteúdo e o mostra (fica escondido até a conta estar pronta). */
function encaixarNaTela(el: HTMLElement, t: number[]) {
  el.style.transform = `matrix3d(${[t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]].join(",")})`;
  el.style.visibility = "visible";
}

/** Encaixa o conteúdo na tela da foto: recalcula a perspectiva quando a foto muda de tamanho. */
function usePerspectiva(caixa: React.RefObject<HTMLDivElement | null>, tela: React.RefObject<HTMLDivElement | null>, quad: Quadrilatero, largura: number, altura: number) {
  useEffect(() => {
    const box = caixa.current;
    const el = tela.current;
    if (!box || !el) return;
    // Encolhe 0,8% para a tela não vazar pela moldura do aparelho.
    const cx = quad.reduce((s, p) => s + p[0], 0) / 4;
    const cy = quad.reduce((s, p) => s + p[1], 0) / 4;
    const q = quad.map((p) => [cx + (p[0] - cx) * 0.992, cy + (p[1] - cy) * 0.992]);
    const posicionar = () => {
      const escala = box.clientWidth / FOTO_LARGURA;
      if (!escala) return;
      const destino = q.flatMap((p) => [p[0] * escala, p[1] * escala]);
      const t = calcularProjecao([0, 0, largura, 0, largura, altura, 0, altura], destino);
      encaixarNaTela(el, t);
    };
    posicionar();
    const ro = new ResizeObserver(posicionar);
    ro.observe(box);
    return () => ro.disconnect();
  }, [caixa, tela, quad, largura, altura]);
}

interface Propriedades {
  src: string;
  alt: string;
  sizes: string;
  quad: Quadrilatero;
  base: readonly [number, number];
  screenClassName: string;
  children: React.ReactNode;
}

export function TelaNaFoto({ src, alt, sizes, quad, base: [largura, altura], screenClassName, children }: Propriedades) {
  const caixa = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLDivElement>(null);
  usePerspectiva(caixa, tela, quad, largura, altura);

  return (
    <div ref={caixa} className="lp-tela-foto">
      <Image src={src} alt={alt} width={FOTO_LARGURA} height={FOTO_ALTURA} sizes={sizes} />
      <div ref={tela} className={`lp-tela-conteudo ${screenClassName}`} style={{ width: largura, height: altura }} aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
