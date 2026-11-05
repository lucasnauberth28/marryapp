import { Check } from "lucide-react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { COR, FONTE } from "../tema";
import { progresso, subir } from "../movimento";

/** Onde fica a tela preta em cada foto do celular (px da foto) e a máscara que preserva os dedos sobre a tela. */
export const TELAS = {
  horizontal: { foto: "fotos/convite-horizontal.jpg", mascara: "fotos/convite-horizontal-mascara.png", largura: 1536, altura: 1024, tela: { x: 552, y: 37, l: 428, a: 919 } },
  vertical: { foto: "fotos/convite-vertical.jpg", mascara: "fotos/convite-vertical-mascara.png", largura: 1024, altura: 1536, tela: { x: 298, y: 377, l: 428, a: 893 } },
} as const;

const LARGURA_DE_DESENHO = 300;

function Conversa({ nomes, frame }: { nomes: string; frame: number }) {
  const toque = progresso(frame, 34, 10);
  return (
    <AbsoluteFill style={{ background: COR.linhoQuente, fontFamily: FONTE.texto }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "44px 16px 12px", background: COR.papel, borderBottom: `1px solid ${COR.linha}` }}>
        <span style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 99, background: COR.ameixa, color: COR.papel, fontSize: 13, fontWeight: 600 }}>
          {nomes.replace(/[^A-Z]/g, "").slice(0, 2)}
        </span>
        <span style={{ fontWeight: 600, fontSize: 15, color: COR.tinta }}>{nomes}</span>
      </div>
      <div style={{ padding: 14, ...subir(frame, 6, 16, 24) }}>
        <div style={{ maxWidth: 270, padding: 12, borderRadius: "16px 16px 16px 4px", background: COR.papel, boxShadow: "0 2px 6px rgba(0,0,0,.06)", fontSize: 14, lineHeight: 1.4, color: COR.tinta }}>
          Marina, preparamos um convite especial para você.
          <div style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", border: `1px solid ${COR.linha}`, transform: `scale(${1 - toque * 0.04})` }}>
            <div style={{ height: 82, background: `linear-gradient(135deg, ${COR.ameixaSuave}, ${COR.petala})`, display: "grid", placeItems: "center", fontFamily: FONTE.titulo, fontWeight: 600, fontSize: 22, color: COR.ameixa }}>{nomes}</div>
            <div style={{ padding: "8px 10px", fontSize: 12, color: COR.tintaSuave }}>Convite de {nomes} · meuaceito.com.br</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Convite({ nomes, frame, altura }: { nomes: string; frame: number; altura: number }) {
  const confirmar = progresso(frame, 92, 10);
  return (
    <AbsoluteFill style={{ background: COR.papel, fontFamily: FONTE.texto, textAlign: "center", alignItems: "center", justifyContent: "center", gap: 0 }}>
      <div style={{ position: "absolute", top: altura * 0.08, width: 240, height: 120, borderRadius: "120px 120px 0 0", border: `1.5px solid ${COR.petala}`, borderBottom: "none" }} />
      <div style={{ fontSize: 15, color: COR.tintaSuave, ...subir(frame, 58, 14, 14) }}>Marina,</div>
      <div style={{ marginTop: 6, fontSize: 14, color: COR.tintaSuave, ...subir(frame, 61, 14, 14) }}>você está convidada para o casamento de</div>
      <div style={{ marginTop: 18, fontFamily: FONTE.titulo, fontWeight: 600, fontSize: 40, lineHeight: 1.05, letterSpacing: "-0.02em", color: COR.ameixa, padding: "0 20px", ...subir(frame, 64, 16, 18) }}>{nomes}</div>
      <div style={{ marginTop: 18, fontSize: 15, fontWeight: 500, letterSpacing: "0.12em", color: COR.tinta, ...subir(frame, 68, 14, 14) }}>18 · 04 · 2027</div>
      <div style={{ marginTop: 4, fontSize: 13, color: COR.tintaSuave, ...subir(frame, 70, 14, 14) }}>Fazenda Santa Maria, Campinas</div>
      <div style={{ marginTop: 28, ...subir(frame, 74, 14, 14) }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 22px",
            borderRadius: 14,
            background: confirmar > 0.5 ? COR.sucesso : COR.ameixa,
            color: COR.papel,
            fontSize: 15,
            fontWeight: 600,
            transform: `scale(${1 - Math.sin(confirmar * Math.PI) * 0.06})`,
          }}
        >
          {confirmar > 0.5 ? <Check size={16} strokeWidth={2.6} /> : null}
          {confirmar > 0.5 ? "Presença confirmada" : "Confirmar presença"}
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** A tela do celular na foto: primeiro a conversa com o link, depois o convite que sobe e a presença confirmada. */
export function TelaDoCelular({ nomes, telaDa }: { nomes: string; telaDa: keyof typeof TELAS }) {
  const frame = useCurrentFrame();
  const { largura, altura, mascara, tela } = TELAS[telaDa];
  const escala = tela.l / LARGURA_DE_DESENHO;
  const alturaDeDesenho = tela.a / escala;
  const sobe = progresso(frame, 46, 16);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: largura, height: altura, WebkitMaskImage: `url(${staticFile(mascara)})`, WebkitMaskSize: "100% 100%", maskImage: `url(${staticFile(mascara)})`, maskSize: "100% 100%" }}>
      <div style={{ position: "absolute", left: tela.x, top: tela.y, width: LARGURA_DE_DESENHO, height: alturaDeDesenho, transform: `scale(${escala})`, transformOrigin: "0 0", overflow: "hidden" }}>
        <Conversa nomes={nomes} frame={frame} />
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - sobe) * 100}%)` }}>
          <Convite nomes={nomes} frame={frame} altura={alturaDeDesenho} />
        </div>
      </div>
    </div>
  );
}

