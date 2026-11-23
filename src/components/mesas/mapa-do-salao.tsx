// O salão visto de cima: cada mesa é um círculo numerado, com uma cadeira por lugar. Cheia fica em verde, passou do limite em vermelho.
// Só desenha: quem usa decide o que acontece ao tocar numa mesa.
import { cadeirasDaMesa, montarPlanta, RAIO_DA_MESA, type MesaDoMapa } from "@/lib/mesas/mapa";
import { cn } from "@/lib/utils";

interface Propriedades {
  mesas: MesaDoMapa[];
  /** Mesa em destaque (a do convidado que se procurou). */
  destaqueId?: string | null;
  aoEscolher?: (id: string) => void;
  className?: string;
}

function tomDaMesa(m: MesaDoMapa) {
  if (m.occupied > m.capacity) return "perigo" as const;
  if (m.capacity > 0 && m.occupied === m.capacity) return "sucesso" as const;
  return "neutro" as const;
}

const CORPO = { neutro: "fill-areia stroke-linha-forte", sucesso: "fill-areia stroke-sucesso", perigo: "fill-areia stroke-perigo" } as const;

function Mesa({ mesa, destaque, aoEscolher }: { mesa: ReturnType<typeof montarPlanta>["mesas"][number]; destaque: boolean; aoEscolher?: (id: string) => void }) {
  const tom = tomDaMesa(mesa);
  const rotulo = `Mesa ${mesa.name}: ${mesa.occupied} de ${mesa.capacity} lugares`;
  return (
    <g
      role={aoEscolher ? "button" : "img"}
      aria-label={rotulo}
      tabIndex={aoEscolher ? 0 : undefined}
      onClick={aoEscolher ? () => aoEscolher(mesa.id) : undefined}
      onKeyDown={aoEscolher ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), aoEscolher(mesa.id)) : undefined}
      className={cn(aoEscolher && "cursor-pointer outline-none focus-visible:[&>circle:first-of-type]:stroke-[3]")}
    >
      {cadeirasDaMesa(mesa.x, mesa.y, mesa.capacity, mesa.occupied).map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={5.5} className={c.excedente ? "fill-perigo stroke-perigo" : c.ocupada ? "fill-ameixa stroke-ameixa" : "fill-papel stroke-linha-forte"} strokeWidth={1.2} />
      ))}
      <circle cx={mesa.x} cy={mesa.y} r={RAIO_DA_MESA} className={cn(CORPO[tom], destaque && "fill-ameixa-suave stroke-ameixa")} strokeWidth={destaque ? 4 : 2} />
      <text x={mesa.x} y={mesa.y + 7} textAnchor="middle" className="fill-tinta font-num text-[22px]">
        {mesa.number}
      </text>
      <text x={mesa.x} y={mesa.y + RAIO_DA_MESA + 34} textAnchor="middle" className="fill-tinta text-[12px] font-semibold">
        {mesa.name.length > 18 ? `${mesa.name.slice(0, 17)}…` : mesa.name}
      </text>
    </g>
  );
}

export function MapaDoSalao({ mesas, destaqueId = null, aoEscolher, className }: Propriedades) {
  const planta = montarPlanta(mesas);
  const altura = planta.altura + 40; // espaço do nome da última fileira
  return (
    <svg viewBox={`0 0 ${planta.largura} ${altura}`} role="group" aria-label="Mapa do salão, visto de cima" className={cn("h-auto w-full max-w-full", className)}>
      {planta.mesas.map((m) => (
        <Mesa key={m.id} mesa={m} destaque={m.id === destaqueId} aoEscolher={aoEscolher} />
      ))}
    </svg>
  );
}
