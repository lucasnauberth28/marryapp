import type { LucideIcon } from "lucide-react";
import { COR, FONTE } from "../tema";

/** Um "próximo passo" solto: o cartãozinho branco com ícone que sai da avalanche e vai para o painel. */
export function CartaoDeTarefa({ icone: Icone, texto, u }: { icone: LucideIcon; texto: string; u: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 16 * u,
        padding: `${16 * u}px ${26 * u}px ${16 * u}px ${16 * u}px`,
        borderRadius: 22 * u,
        background: COR.papel,
        border: `${1.5 * u}px solid ${COR.linha}`,
        boxShadow: `0 ${18 * u}px ${40 * u}px rgba(94, 43, 78, 0.12)`,
        fontFamily: FONTE.texto,
        fontWeight: 500,
        fontSize: 30 * u,
        color: COR.tinta,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ display: "grid", placeItems: "center", width: 54 * u, height: 54 * u, borderRadius: 999, background: COR.ameixaSuave, color: COR.ameixa }}>
        <Icone size={28 * u} strokeWidth={1.8} />
      </span>
      {texto}
    </div>
  );
}
