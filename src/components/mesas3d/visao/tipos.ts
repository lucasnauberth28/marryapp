import type { MotorDasMesas3D } from "@/lib/mesas3d/engine";
import type { MesaDeEntrada, PosicaoDaMesa } from "@/lib/mesas3d/layout";
import type { IdDoCenario } from "@/lib/mesas3d/scenarios";
import type { ConvidadoParaSentar, ocupacaoPorMesa } from "@/lib/mesas3d/seating";

export interface PropriedadesDaVisao {
  mode: "edit" | "view";
  coupleNames: string;
  initialScene: IdDoCenario | null;
  tables: MesaDeEntrada[];
  guests: ConvidadoParaSentar[];
  initialShareToken?: string | null;
}

/** Valores que os ouvintes do motor precisam ler sem recriar o motor. */
export interface EstadoAoVivo {
  edit: boolean;
  selectedId: string | null;
  guests: ConvidadoParaSentar[];
  occ: ReturnType<typeof ocupacaoPorMesa>;
  slotsById: Map<string, PosicaoDaMesa>;
  layoutSlots: PosicaoDaMesa[];
}

export interface ArrastoEmAndamento {
  guest: ConvidadoParaSentar;
  x: number;
  y: number;
  live: boolean;
}

/** Referências que o motor, o arrasto e os rótulos compartilham (criadas no componente). */
export interface ReferenciasDaVisao {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  hostRef: React.RefObject<HTMLDivElement | null>;
  engineRef: React.MutableRefObject<MotorDasMesas3D | null>;
  labelRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  ghostRef: React.RefObject<HTMLDivElement | null>;
  loadingRef: React.RefObject<HTMLDivElement | null>;
  dragRef: React.MutableRefObject<ArrastoEmAndamento | null>;
  suppressClickRef: React.MutableRefObject<boolean>;
  live: React.MutableRefObject<EstadoAoVivo>;
}

export const iniciaisDoNome = (n: string) => {
  const p = n.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase();
};
