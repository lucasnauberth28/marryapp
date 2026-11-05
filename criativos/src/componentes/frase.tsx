import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { COR, FONTE } from "../tema";
import { progresso, subir } from "../movimento";

interface PropriedadesDaFrase {
  texto: string;
  /** Quadro em que a primeira palavra começa a entrar. */
  inicio: number;
  /** Quadro em que a frase começa a sair (some em 10 quadros). */
  saida?: number;
  tamanho: number;
  cor?: string;
  peso?: number;
  alinhamento?: "left" | "center";
  estilo?: CSSProperties;
}

/** Título da campanha: as palavras sobem uma a uma (Urbanist, como nos títulos do produto). */
export function Frase({ texto, inicio, saida, tamanho, cor = COR.tinta, peso = 600, alinhamento = "center", estilo }: PropriedadesDaFrase) {
  const frame = useCurrentFrame();
  const sumir = saida === undefined ? 1 : 1 - progresso(frame, saida, 10);
  const palavras = texto.split(" ");
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: FONTE.titulo,
        fontWeight: peso,
        fontSize: tamanho,
        lineHeight: 1.04,
        letterSpacing: "-0.025em",
        color: cor,
        textAlign: alinhamento,
        textWrap: "balance",
        opacity: sumir,
        ...estilo,
      }}
    >
      {palavras.map((p, i) => (
        <span key={i} style={{ display: "inline-block", whiteSpace: "pre", ...subir(frame, inicio + i * 3, 20, tamanho * 0.35) }}>
          {p}
          {i < palavras.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
}
