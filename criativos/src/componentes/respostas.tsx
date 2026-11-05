import { Check, Gift, X } from "lucide-react";
import { interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE } from "../tema";
import { progresso, subir } from "../movimento";

const RESPOSTAS = [
  { nome: "Marina Souza", vai: true, pessoas: 1 },
  { nome: "Carlos e Júlia", vai: true, pessoas: 2 },
  { nome: "Tia Cida", vai: true, pessoas: 1 },
  { nome: "Pedro Lima", vai: false, pessoas: 1 },
  { nome: "Família Oliveira", vai: true, pessoas: 4 },
];

/** Lista de respostas que chegam, o número de confirmados subindo e o aviso de presente recebido. Dados de exemplo. */
export function ListaDeRespostas({ u, largura }: { u: number; largura: number }) {
  const frame = useCurrentFrame();
  const confirmados = Math.round(interpolate(progresso(frame, 8, 60), [0, 1], [88, 96]));
  const aviso = progresso(frame, 52, 18);
  return (
    <div style={{ position: "relative", width: largura, fontFamily: FONTE.texto, color: COR.tinta }}>
      <div style={{ padding: 34 * u, borderRadius: 32 * u, background: COR.papel, border: `${1.5 * u}px solid ${COR.linha}`, boxShadow: `0 ${30 * u}px ${80 * u}px rgba(94, 43, 78, 0.14)` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 * u }}>
          <span style={{ fontFamily: FONTE.titulo, fontWeight: 600, fontSize: 92 * u, letterSpacing: "-0.03em", color: COR.ameixa }}>{confirmados}</span>
          <span style={{ fontSize: 30 * u, color: COR.tintaSuave }}>confirmados</span>
        </div>
        <div style={{ marginTop: 14 * u }}>
          {RESPOSTAS.map((r, i) => (
            <div key={r.nome} style={{ display: "flex", alignItems: "center", gap: 16 * u, padding: `${14 * u}px 0`, borderTop: `${1.5 * u}px solid ${COR.linha}`, ...subir(frame, 6 + i * 7, 14, 18 * u) }}>
              <span style={{ flex: 1, fontSize: 28 * u, fontWeight: 500 }}>{r.nome}</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8 * u,
                  padding: `${7 * u}px ${16 * u}px`,
                  borderRadius: 99,
                  fontSize: 22 * u,
                  fontWeight: 600,
                  background: r.vai ? COR.sucessoSuave : COR.nevoa,
                  color: r.vai ? COR.sucesso : COR.tintaSuave,
                }}
              >
                {r.vai ? <Check size={18 * u} strokeWidth={2.6} /> : <X size={18 * u} strokeWidth={2.6} />}
                {r.vai ? (r.pessoas > 1 ? `Vão · ${r.pessoas}` : "Vai") : "Não vai"}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: -24 * u,
          bottom: -40 * u,
          display: "flex",
          alignItems: "center",
          gap: 16 * u,
          padding: `${18 * u}px ${26 * u}px ${18 * u}px ${18 * u}px`,
          borderRadius: 22 * u,
          background: COR.ameixa,
          color: COR.papel,
          boxShadow: `0 ${20 * u}px ${50 * u}px rgba(94, 43, 78, 0.3)`,
          opacity: aviso,
          transform: `translateY(${(1 - aviso) * 30 * u}px)`,
        }}
      >
        <span style={{ display: "grid", placeItems: "center", width: 52 * u, height: 52 * u, borderRadius: 99, background: "rgba(255,255,255,.16)" }}>
          <Gift size={26 * u} strokeWidth={1.8} />
        </span>
        <span style={{ fontSize: 24 * u, lineHeight: 1.3 }}>
          <b style={{ fontWeight: 600 }}>Presente recebido</b>
          <br />
          Marina · Jantar da lua de mel
        </span>
      </div>
    </div>
  );
}
