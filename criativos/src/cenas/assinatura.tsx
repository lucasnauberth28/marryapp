import { Img, staticFile, useCurrentFrame } from "remotion";
import { Cena } from "../componentes/cena";
import { Foto } from "../componentes/foto";
import { Frase } from "../componentes/frase";
import { subir } from "../movimento";
import { COR, FONTE, useFormato, type Casal, type TipoDeFormato } from "../tema";

/** Topo de cada elemento (fração da altura) e tamanhos, por formato: tudo no céu, acima das cabeças. */
const ARRANJO: Record<TipoDeFormato, { logo: number; larguraDoLogo: number; frase: number; tamanho: number; selo: number; foco: [number, number] }> = {
  horizontal: { logo: 0.08, larguraDoLogo: 300, frase: 0.2, tamanho: 76, selo: 0.4, foco: [0.5, 0.78] },
  vertical: { logo: 0.15, larguraDoLogo: 360, frase: 0.23, tamanho: 84, selo: 0.4, foco: [0.5, 0.8] },
  quadrado: { logo: 0.07, larguraDoLogo: 260, frase: 0.16, tamanho: 62, selo: 0.36, foco: [0.5, 0.7] },
};

/** Fechamento: a celebração, o logo, a mensagem institucional e o endereço. */
export function CenaAssinatura({ duracao, casal }: { duracao: number; casal: Casal }) {
  const frame = useCurrentFrame();
  const { tipo, largura, altura, u } = useFormato();
  const a = ARRANJO[tipo];
  const vertical = tipo === "vertical";
  return (
    <Cena duracao={duracao} sai={false}>
      <Foto
        src={`fotos/festa-${casal}-${vertical ? "vertical" : "horizontal"}.jpg`}
        largura={vertical ? 1024 : 1536}
        altura={vertical ? 1536 : 1024}
        foco={a.foco}
        alvo={a.foco}
        zoom={[1.06, 1]}
        duracao={duracao}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(252,251,250,.55) 0%, rgba(252,251,250,0) 50%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: a.logo * altura, display: "flex", justifyContent: "center", ...subir(frame, 4, 18, 20 * u) }}>
        <Img src={staticFile("marca/aceito-horizontal-ameixa.svg")} style={{ width: a.larguraDoLogo * u }} />
      </div>
      <Frase texto="O casamento de vocês, mais simples de organizar." inicio={10} tamanho={a.tamanho * u} estilo={{ left: largura * 0.08, right: largura * 0.08, top: a.frase * altura }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: a.selo * altura, display: "flex", justifyContent: "center", ...subir(frame, 22, 18, 20 * u) }}>
        <span style={{ padding: `${18 * u}px ${40 * u}px`, borderRadius: 999, background: COR.ameixa, color: COR.papel, fontFamily: FONTE.texto, fontWeight: 600, fontSize: 36 * u, letterSpacing: "0.01em" }}>meuaceito.com.br</span>
      </div>
    </Cena>
  );
}
