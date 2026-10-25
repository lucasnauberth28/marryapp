"use client";

/**
 * Foto com uma tela de verdade encaixada: o conteúdo (HTML) é deformado em perspectiva para os quatro
 * cantos da tela do celular ou do notebook que aparece na foto. As coordenadas são da foto em 1536 px de largura.
 * Sem JavaScript a tela fica escondida e a foto aparece como veio.
 */
import { useEffect, useRef } from "react";
import Image from "next/image";

type PontoNaFoto = readonly [number, number];
type Quadrilatero = readonly [PontoNaFoto, PontoNaFoto, PontoNaFoto, PontoNaFoto];

const FOTO_LARGURA = 1536;
const FOTO_ALTURA = 1024;

// Homografia de um retângulo para quatro pontos (matrizes 3x3 em linha).
function matrizAdjunta(m: number[]) {
  return [
    m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
  ];
}
function multiplicarMatrizes(a: number[], b: number[]) {
  const c: number[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c[3 * i + j] = a[3 * i] * b[j] + a[3 * i + 1] * b[3 + j] + a[3 * i + 2] * b[6 + j];
  return c;
}
function multiplicarMatrizPorVetor(m: number[], v: number[]) {
  return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
}
function montarBaseDaProjecao(p: number[]) {
  const m = [p[0], p[2], p[4], p[1], p[3], p[5], 1, 1, 1];
  const v = multiplicarMatrizPorVetor(matrizAdjunta(m), [p[6], p[7], 1]);
  return multiplicarMatrizes(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}
function calcularProjecao(origem: number[], destino: number[]) {
  const t = multiplicarMatrizes(montarBaseDaProjecao(destino), matrizAdjunta(montarBaseDaProjecao(origem)));
  return t.map((x) => x / t[8]);
}

export function TelaNaFoto({
  src,
  alt,
  sizes,
  quad,
  base: [largura, altura],
  screenClassName,
  children,
}: {
  src: string;
  alt: string;
  sizes: string;
  quad: Quadrilatero;
  base: readonly [number, number];
  screenClassName: string;
  children: React.ReactNode;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLDivElement>(null);

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
      el.style.transform = `matrix3d(${[t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]].join(",")})`;
      el.style.visibility = "visible";
    };
    posicionar();
    const ro = new ResizeObserver(posicionar);
    ro.observe(box);
    return () => ro.disconnect();
  }, [quad, largura, altura]);

  return (
    <div ref={caixa} className="lp-tela-foto">
      <Image src={src} alt={alt} width={FOTO_LARGURA} height={FOTO_ALTURA} sizes={sizes} />
      <div ref={tela} className={`lp-tela-conteudo ${screenClassName}`} style={{ width: largura, height: altura }} aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
