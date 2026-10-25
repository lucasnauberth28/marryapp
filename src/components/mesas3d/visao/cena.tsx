import type { ConvidadoParaSentar } from "@/lib/mesas3d/seating";
import type { PosicaoDaMesa } from "@/lib/mesas3d/layout";
import { cn } from "@/lib/utils";
import { AvisoSemSuporteAo3D, BarraDaCamera, PainelDaMesa, RotuloDaMesa } from "./cenario";
import type { ReferenciasDaVisao } from "./tipos";
import type { useAcoesDaVisao } from "./use-acoes";
import type { DadosDasMesas } from "./use-dados-das-mesas";
import type { EstadoDaVisao } from "./use-estado";

interface Propriedades {
  edit: boolean;
  refs: ReferenciasDaVisao;
  estado: EstadoDaVisao;
  dados: DadosDasMesas;
  dica: string;
  noGl: boolean;
  acoes: ReturnType<typeof useAcoesDaVisao>;
  aoTirar: (g: ConvidadoParaSentar) => void;
}

function RotulosDasMesas({ slots, occ, dropId, labelRefs }: { slots: PosicaoDaMesa[]; occ: DadosDasMesas["occ"]; dropId: string | null; labelRefs: ReferenciasDaVisao["labelRefs"] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      {slots.map((s) => (
        <RotuloDaMesa
          key={s.id}
          slot={s}
          used={occ[s.id]?.used ?? 0}
          target={dropId === s.id}
          refCb={(el) => {
            if (el) labelRefs.current.set(s.id, el);
            else labelRefs.current.delete(s.id);
          }}
        />
      ))}
    </div>
  );
}

/** O cenário em 3D: o canvas, os rótulos das mesas, a dica, a câmera e o painel da mesa aberta. */
export function CenaEm3D({ edit, refs, estado: e, dados, dica, noGl, acoes, aoTirar }: Propriedades) {
  const { groups, occ, layout } = dados;
  const slots = layout.slots;
  const { canvasRef, hostRef, engineRef, labelRefs, loadingRef, dragRef } = refs;
  const openSlot = e.openId ? (slots.find((s) => s.id === e.openId) ?? null) : null;
  const openOcc = openSlot ? occ[openSlot.id] : null;

  return (
    <section aria-label="Cenário em 3D" ref={hostRef} className="relative order-1 h-[64vh] min-h-[380px] touch-none overflow-hidden rounded-2xl border border-linha bg-[#1a1519] lg:order-2 lg:h-auto">
      <canvas
        ref={canvasRef}
        aria-label="Cenário do casamento em 3D com as mesas. Use a lista ao lado para escolher a mesa de cada convidado."
        className="block size-full"
        onPointerMove={(ev) => {
          if (!edit || !e.selectedId || ev.buttons || dragRef.current) return;
          const t = engineRef.current?.tableAtPoint(ev.clientX, ev.clientY) ?? null;
          e.setDropId(t && !t.decor ? t.id : null);
        }}
        onPointerLeave={() => {
          if (!dragRef.current) e.setDropId(null);
        }}
      />

      <RotulosDasMesas slots={slots} occ={occ} dropId={e.dropId} labelRefs={labelRefs} />

      <p className={cn("absolute left-3 top-3 z-[2] max-w-[min(380px,calc(100%-24px))] rounded-xl border border-linha bg-papel/95 px-3 py-2.5 text-[13px] leading-[18px] text-tinta-suave backdrop-blur", openSlot && "hidden sm:block")}>
        <span className="mb-0.5 block font-display text-base leading-5 text-tinta">{layout.scene.nome}</span>
        {dica}
      </p>

      <BarraDaCamera cam={e.cam} aoEscolher={acoes.goCam} />

      {openSlot && openOcc ? <PainelDaMesa slot={openSlot} ocupacao={openOcc} edit={edit} groups={groups} aoFechar={acoes.fecharMesa} aoTirar={aoTirar} aoVerDaMesa={() => acoes.verDaMesa(openSlot.id)} /> : null}

      <div ref={loadingRef} hidden={!!e.scene} className="absolute inset-0 z-[3] grid place-items-center bg-[#1a1519] font-display text-lg text-[#F2EEF0]">
        {e.scene ? "Preparando o cenário..." : "Escolha um cenário para começar."}
      </div>

      {noGl ? <AvisoSemSuporteAo3D edit={edit} /> : null}
    </section>
  );
}
