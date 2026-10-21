// Ilustrações da Liz: quais existem, em que larguras foram exportadas e qual pose cada estado usa.
// Puro (sem React nem Next): o componente LizIllustration e os testes usam as mesmas regras.

/** Poses publicadas em public/brand/liz. "rosto" é o recorte de cabeça e ombros do busto, para o círculo. */
export type LizPose = "rosto" | "boas-vindas" | "cumprimentando" | "sugerindo" | "atencao" | "tranquila";

interface LizAsset {
  /** Altura sobre largura do arquivo exportado. */
  ratio: number;
  /** Larguras exportadas (arquivo `{pose}-{largura}.webp`), em ordem crescente. */
  widths: readonly number[];
}

export const LIZ_ASSETS: Record<LizPose, LizAsset> = {
  rosto: { ratio: 1, widths: [112, 168] },
  "boas-vindas": { ratio: 1.6518, widths: [128, 256] },
  cumprimentando: { ratio: 1.6667, widths: [128, 256] },
  sugerindo: { ratio: 1.6481, widths: [128, 256] },
  atencao: { ratio: 1.8122, widths: [128, 256] },
  tranquila: { ratio: 1.1523, widths: [128, 256] },
};

/** Arquivo para a largura pedida pelo next/image: o menor que cobre a largura, ou o maior que existe. */
export function lizAssetSrc(pose: LizPose, width: number): string {
  const { widths } = LIZ_ASSETS[pose];
  const chosen = widths.find((w) => w >= width) ?? widths[widths.length - 1];
  return `/brand/liz/${pose}-${chosen}.webp`;
}

/** Poses do cartão de sugestão. Não há "comemorando": as regras não têm um estado de conquista. */
export type LizTipPose = Extract<LizPose, "sugerindo" | "atencao" | "tranquila">;

/**
 * Pose conforme o estado real da sugestão: sem sugestão, tranquila; motivo de prazo
 * (vencido ou perto), atenção; qualquer outro próximo passo, sugerindo.
 */
export function lizTipPose(tip: { urgent: boolean } | null): LizTipPose {
  if (!tip) return "tranquila";
  return tip.urgent ? "atencao" : "sugerindo";
}
