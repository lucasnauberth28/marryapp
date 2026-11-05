import { Check, Gift, Mail, Users } from "lucide-react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COR, FONTE } from "../tema";
import { progresso, subir } from "../movimento";

/** Número que conta de `de` até `ate` entre os quadros `inicio` e `inicio + dur`. */
function Contador({ de, ate, inicio, dur }: { de: number; ate: number; inicio: number; dur: number }) {
  const frame = useCurrentFrame();
  return <>{Math.round(interpolate(progresso(frame, inicio, dur), [0, 1], [de, ate]))}</>;
}

function Indicador({ icone: Icone, rotulo, valor, u, inicio }: { icone: typeof Users; rotulo: string; valor: number; u: number; inicio: number }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ flex: 1, padding: 22 * u, borderRadius: 20 * u, background: COR.nevoa, ...subir(frame, inicio, 16, 20 * u) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 * u, color: COR.tintaSuave, fontSize: 22 * u, fontWeight: 500 }}>
        <Icone size={24 * u} strokeWidth={1.8} color={COR.ameixa} />
        {rotulo}
      </div>
      <div style={{ marginTop: 8 * u, fontFamily: FONTE.titulo, fontWeight: 600, fontSize: 64 * u, letterSpacing: "-0.02em", color: COR.tinta }}>
        <Contador de={0} ate={valor} inicio={inicio} dur={30} />
      </div>
    </div>
  );
}

function Linha({ texto, detalhe, feito, u, inicio, total }: { texto: string; detalhe: string; feito?: boolean; u: number; inicio: number; total?: number }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 * u, padding: `${16 * u}px 0`, borderTop: `${1.5 * u}px solid ${COR.linha}`, ...subir(frame, inicio, 16, 16 * u) }}>
      <span style={{ display: "grid", placeItems: "center", width: 40 * u, height: 40 * u, borderRadius: 999, background: feito ? COR.sucessoSuave : COR.ameixaSuave, color: feito ? COR.sucesso : COR.ameixa }}>
        {feito ? <Check size={22 * u} strokeWidth={2.4} /> : <Mail size={20 * u} strokeWidth={1.8} />}
      </span>
      <span style={{ flex: 1, fontSize: 26 * u, fontWeight: 500, color: COR.tinta }}>{texto}</span>
      {total ? (
        <span style={{ width: 200 * u, height: 12 * u, borderRadius: 99, background: COR.linha, overflow: "hidden" }}>
          <span style={{ display: "block", height: "100%", width: `${progresso(frame, inicio + 6, 30) * 83}%`, background: COR.ameixa, borderRadius: 99 }} />
        </span>
      ) : null}
      <span style={{ fontSize: 24 * u, color: COR.tintaSuave, minWidth: 120 * u, textAlign: "right" }}>{detalhe}</span>
    </div>
  );
}

/** O Resumo do casal em miniatura: nomes e data, três números e o que já está pronto. Dados de exemplo. */
export function MiniPainel({ nomes, u, inicio, largura }: { nomes: string; u: number; inicio: number; largura: number }) {
  return (
    <div style={{ width: largura, padding: 36 * u, borderRadius: 32 * u, background: COR.papel, border: `${1.5 * u}px solid ${COR.linha}`, boxShadow: `0 ${30 * u}px ${80 * u}px rgba(94, 43, 78, 0.16)`, fontFamily: FONTE.texto, color: COR.tinta }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 * u }}>
        <Img src={staticFile("marca/aceito-icone-ameixa.svg")} style={{ width: 52 * u, height: 52 * u }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONTE.titulo, fontWeight: 600, fontSize: 40 * u, letterSpacing: "-0.02em" }}>{nomes}</div>
          <div style={{ fontSize: 22 * u, color: COR.tintaSuave }}>18 de abril de 2027 · faltam 164 dias</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16 * u, marginTop: 28 * u }}>
        <Indicador icone={Users} rotulo="Convidados" valor={142} u={u} inicio={inicio + 6} />
        <Indicador icone={Check} rotulo="Confirmados" valor={96} u={u} inicio={inicio + 10} />
        <Indicador icone={Gift} rotulo="Presentes" valor={23} u={u} inicio={inicio + 14} />
      </div>
      <div style={{ marginTop: 24 * u }}>
        <Linha texto="Site do casamento no ar" detalhe="Pronto" feito u={u} inicio={inicio + 18} />
        <Linha texto="Convites enviados" detalhe="118 de 142" u={u} inicio={inicio + 22} total={142} />
      </div>
    </div>
  );
}
