import type { ReactNode } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

interface PropriedadesDaFoto {
  src: string;
  /** Tamanho original da imagem, em px. */
  largura: number;
  altura: number;
  /** "cobrir" preenche o quadro; "altura" encaixa pela altura (sobra laterais com o fundo). */
  modo?: "cobrir" | "altura";
  /** Ponto da imagem (0–1) que fica sobre o `alvo` do quadro (0–1). */
  foco?: [number, number];
  alvo?: [number, number];
  /** Aproximação lenta ao longo da cena (início → fim). */
  zoom?: [number, number];
  duracao: number;
  /** Camadas desenhadas em cima da foto, em px da própria imagem (ex.: a tela do celular). */
  children?: ReactNode;
  /** Área onde a foto é encaixada; sem ela, o quadro inteiro. */
  caixa?: { largura: number; altura: number };
}

/** Foto posicionada por ponto de foco, com aproximação lenta (Ken Burns) e camadas presas à imagem. */
export function Foto({ src, largura, altura, modo = "cobrir", foco = [0.5, 0.5], alvo = [0.5, 0.5], zoom = [1, 1.05], duracao, children, caixa }: PropriedadesDaFoto) {
  const frame = useCurrentFrame();
  const quadro = useVideoConfig();
  const W = caixa?.largura ?? quadro.width;
  const H = caixa?.altura ?? quadro.height;
  const base = modo === "cobrir" ? Math.max(W / largura, H / altura) : H / altura;
  const s = base * interpolate(frame, [0, duracao], zoom, { extrapolateRight: "clamp" });
  let left = alvo[0] * W - foco[0] * largura * s;
  let top = alvo[1] * H - foco[1] * altura * s;
  if (modo === "cobrir") {
    left = Math.min(0, Math.max(W - largura * s, left));
    top = Math.min(0, Math.max(H - altura * s, top));
  }
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left, top, width: largura, height: altura, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        <Img src={staticFile(src)} style={{ width: largura, height: altura, display: "block" }} />
        {children}
      </div>
    </AbsoluteFill>
  );
}
