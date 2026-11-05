import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR } from "../tema";
import { progresso } from "../movimento";

export const TRANSICAO = 10;

/** Uma cena com fundo próprio que aparece e some em `TRANSICAO` quadros (a primeira não aparece, a última não some). */
export function Cena({ duracao, entra = true, sai = true, fundo = COR.linho, children }: { duracao: number; entra?: boolean; sai?: boolean; fundo?: string; children: ReactNode }) {
  const frame = useCurrentFrame();
  const opacidade = (entra ? progresso(frame, 0, TRANSICAO) : 1) * (sai ? 1 - progresso(frame, duracao - TRANSICAO, TRANSICAO) : 1);
  return <AbsoluteFill style={{ backgroundColor: fundo, opacity: opacidade }}>{children}</AbsoluteFill>;
}
